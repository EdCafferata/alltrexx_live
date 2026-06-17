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

import java.util.Set;
import java.util.stream.Collectors;

/**
 * Haalt ADS-B-vliegtuigdata op bij airplanes.live (gratis, geen key) voor een gebied
 * en bewaart de posities van de vliegtuigen die wij in de database hebben.
 *
 * API: https://api.airplanes.live/v2/point/{lat}/{lon}/{radius_nm}
 * Respons: { "ac": [ { "hex", "flight", "r", "t", "desc", "lat", "lon", "gs", "track",
 *                      "alt_baro", ... }, .. ] }
 *
 * Sleutel = ICAO 24-bit hex (zoals MMSI bij schepen). Vliegtuigen worden in het
 * beheerscherm toegevoegd met hun hex als externeId.
 *
 * Configuratie via application-prod.properties:
 *   app.vliegtuig.url, app.vliegtuig.lat/lon/radius, app.scheduler.adsb-interval-ms (15 min)
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class VliegtuigScheduler {

    private final TrackerService trackerService;
    private final WebClient.Builder webClientBuilder;

    @Value("${app.vliegtuig.url:https://api.airplanes.live/v2/point}") private String url;
    @Value("${app.vliegtuig.lat:52.3}")    private double lat;
    @Value("${app.vliegtuig.lon:5.3}")     private double lon;
    @Value("${app.vliegtuig.radius:250}")  private int radius;   // nautische mijlen (max 250)

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

        WebClient client = webClientBuilder.build();
        JsonNode root;
        try {
            root = client.get()
                .uri(url + "/{lat}/{lon}/{r}", lat, lon, radius)
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
            if (!v.hasNonNull("lat") || !v.hasNonNull("lon")) continue;  // geen positie

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
        log.info("ADS-B: {} van onze {} vliegtuigen geüpdatet ({} toestellen in gebied)",
                opgeslagen, onzeHex.size(), vliegtuigen.size());
    }
}
