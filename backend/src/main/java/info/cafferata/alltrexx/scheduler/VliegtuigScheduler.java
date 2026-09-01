package info.cafferata.alltrexx.scheduler;

import com.fasterxml.jackson.databind.JsonNode;
import info.cafferata.alltrexx.model.TrackerType;
import info.cafferata.alltrexx.service.TrackerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.net.URI;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Haalt ADS-B-vliegtuigdata op bij adsb.lol en bewaart de posities van de vliegtuigen
 * die wij in de database hebben.
 *
 * <p>Sinds ~12 aug 2026 sloot airplanes.live z'n gratis API (403 "contact us"); adsb.lol
 * biedt dezelfde re-api. We vragen nu **direct op ICAO-hex** i.p.v. een gebied-query, zodat
 * ook toestellen BUITEN een vast NL-gebied worden opgehaald (waar dan ook ter wereld). Eén
 * call met alle hex'en van onze toestellen:
 *
 * <p>API: {@code https://api.adsb.lol/v2/hex/<hex1>,<hex2>,...}
 * <br>Respons: {@code { "ac": [ { "hex","flight","r","t","desc","lat","lon","gs","track","alt_baro", ... }, .. ] }}
 *
 * <p>Sleutel = ICAO 24-bit hex (zoals MMSI bij schepen). Vliegtuigen worden in het
 * beheerscherm toegevoegd met hun hex als externeId.
 *
 * <p>Configuratie via application-prod.properties:
 *   app.vliegtuig.url (basis van het hex-endpoint), app.scheduler.adsb-interval-ms (15 min)
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class VliegtuigScheduler {

    private final TrackerService trackerService;
    private final WebClient.Builder webClientBuilder;

    @Value("${app.vliegtuig.url:https://api.adsb.lol/v2/hex}") private String url;

    @Scheduled(fixedRateString = "${app.scheduler.adsb-interval-ms:900000}")
    public void haalVliegtuigDataOp() {
        // De ICAO-hex'en van onze actieve vliegtuigen (kleine letters voor de match)
        Set<String> onzeHex = trackerService.trackerPerType(TrackerType.PLANE).stream()
                .map(t -> t.getExterneId())
                .filter(id -> id != null && !id.isBlank())
                .map(id -> id.trim().toLowerCase())
                .collect(Collectors.toSet());
        if (onzeHex.isEmpty()) {
            log.debug("ADS-B: geen vliegtuigen met ICAO-hex in de database");
            return;
        }

        // Directe hex-query: alleen ONZE toestellen, wereldwijd (geen gebied-limiet).
        String hexen = String.join(",", onzeHex);
        WebClient client = webClientBuilder.build();
        JsonNode root;
        try {
            root = client.get()
                .uri(URI.create(url + "/" + hexen))
                .header("User-Agent", "Alltrexx/1.0 (+https://alltrexx.live)")
                .retrieve()
                .bodyToMono(JsonNode.class)
                .block();
        } catch (Exception e) {
            log.warn("ADS-B: ophalen mislukt: {}", e.getMessage());
            return;
        }

        if (root == null || !root.path("ac").isArray()) {
            log.warn("ADS-B: onverwachte respons");
            return;
        }

        JsonNode vliegtuigen = root.get("ac");
        int opgeslagen = 0;
        for (JsonNode v : vliegtuigen) {
            String hex = v.path("hex").asText("").trim().toLowerCase();
            if (hex.isEmpty() || !onzeHex.contains(hex)) continue;
            if (!v.hasNonNull("lat") || !v.hasNonNull("lon")) continue;  // geen positie (bv. aan de grond)

            double lat2     = v.path("lat").asDouble();
            double lon2     = v.path("lon").asDouble();
            double snelheid = v.path("gs").asDouble(0) * 1.852;   // knopen → km/h
            double koers    = v.path("track").asDouble(0);
            double hoogte   = v.path("alt_baro").asDouble(0) * 0.3048; // voet → meter ("ground" → 0)

            // Mooie weergavenaam: registratie > callsign > omschrijving
            String reg      = v.path("r").asText("").trim();
            String callsign = v.path("flight").asText("").trim();
            String desc     = v.path("desc").asText("").trim();
            String naam     = !reg.isEmpty() ? reg : (!callsign.isEmpty() ? callsign : (!desc.isEmpty() ? desc : hex));

            trackerService.slaPositieOp(hex, TrackerType.PLANE, naam,
                    lat2, lon2, snelheid, koers, hoogte, "ADSB");
            trackerService.werkScheepsgegevensBij(hex, naam, null);
            opgeslagen++;
        }
        log.info("ADS-B: {} van onze {} vliegtuigen geüpdatet (direct op hex)",
                opgeslagen, onzeHex.size());
    }
}
