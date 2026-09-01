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
 * Haalt AIS-data op bij AISHub (gratis voor data-aanleveraars) en bewaart de posities van
 * de boten die wij in de database hebben.
 *
 * <p>We vragen **direct op MMSI** i.p.v. een NL-gebied-query, zodat ook boten BUITEN NL
 * worden opgehaald (overal waar een AISHub-ontvanger ze recent zag). Alle MMSI's in één
 * request (getest: 74 MMSI's = ~740 tekens, prima):
 *
 * <p>AISHub API: {@code http://data.aishub.net/ws.php?username=..&format=1&output=json&mmsi=<mmsi1>,<mmsi2>,..}
 * <br>Respons: {@code [ {ERROR, USERNAME, RECORDS, ...}, [ {MMSI, LATITUDE, LONGITUDE, COG, SOG, NAME, ...}, .. ] ]}
 *
 * <p>Configuratie via .env / application-prod.properties:
 *   app.aishub.username, app.aishub.url, interval via app.scheduler.ais-interval-ms (15 min)
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AisHubScheduler {

    private final TrackerService trackerService;
    private final WebClient.Builder webClientBuilder;

    @Value("${app.aishub.username:}") private String username;
    @Value("${app.aishub.url:http://data.aishub.net/ws.php}") private String url;

    @Scheduled(fixedRateString = "${app.scheduler.ais-interval-ms:900000}")
    public void haalAisDataOp() {
        if (username == null || username.isBlank()) {
            log.debug("AISHub: geen username ingesteld — overslaan");
            return;
        }

        // De MMSI's van onze actieve boten
        Set<String> onzeMmsis = trackerService.trackerPerType(TrackerType.BOAT).stream()
                .map(t -> t.getExterneId())
                .filter(id -> id != null && !id.isBlank())
                .collect(Collectors.toSet());
        if (onzeMmsis.isEmpty()) {
            log.debug("AISHub: geen boten met AIS-nummer in de database");
            return;
        }

        // Directe MMSI-query: alleen ONZE boten, waar dan ook (geen NL-gebied-limiet).
        String mmsis = String.join(",", onzeMmsis);
        WebClient client = webClientBuilder.build();
        JsonNode root;
        try {
            root = client.get()
                .uri(URI.create(url + "?username=" + username
                        + "&format=1&output=json&compress=0&mmsi=" + mmsis))
                .retrieve()
                .bodyToMono(JsonNode.class)
                .block();
        } catch (Exception e) {
            log.warn("AISHub: ophalen mislukt: {}", e.getMessage());
            return;
        }

        if (root == null || !root.isArray() || root.size() < 2) {
            log.warn("AISHub: onverwachte respons");
            return;
        }
        JsonNode meta = root.get(0);
        if (meta.path("ERROR").asBoolean(false)) {
            log.warn("AISHub fout: {}", meta.path("ERROR_MESSAGE").asText("onbekend"));
            return;
        }

        JsonNode schepen = root.get(1);
        int opgeslagen = 0;
        for (JsonNode v : schepen) {
            String mmsi = v.path("MMSI").asText();
            if (!onzeMmsis.contains(mmsi)) continue;

            double lat = v.path("LATITUDE").asDouble();
            double lon = v.path("LONGITUDE").asDouble();
            double snelheid = v.path("SOG").asDouble() * 1.852; // knopen → km/h
            double koers = v.path("COG").asDouble();
            String bootnaam = v.path("NAME").asText(null);

            trackerService.slaPositieOp(mmsi, TrackerType.BOAT, bootnaam != null ? bootnaam : mmsi,
                    lat, lon, snelheid, koers, 0, "AISHUB");
            trackerService.werkScheepsgegevensBij(mmsi, bootnaam, null);
            opgeslagen++;
        }
        log.info("AISHub: {} van onze {} boten geüpdatet (direct op MMSI)",
                opgeslagen, onzeMmsis.size());
    }
}
