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
 * Haalt AIS-data op bij AISHub (gratis voor data-aanleveraars) voor een gebied,
 * en bewaart de posities van de boten die wij in de database hebben.
 *
 * AISHub API: http://data.aishub.net/ws.php?username=..&format=1&output=json
 *             &latmin=..&latmax=..&lonmin=..&lonmax=..
 * Respons: [ {ERROR, USERNAME, RECORDS, ...}, [ {MMSI, LATITUDE, LONGITUDE, COG, SOG, NAME, ...}, .. ] ]
 *
 * Configuratie via .env / application-prod.properties:
 *   app.aishub.username, app.aishub.url, app.aishub.latmin/latmax/lonmin/lonmax
 *   interval via app.scheduler.ais-interval-ms (15 min)
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AisHubScheduler {

    private final TrackerService trackerService;
    private final WebClient.Builder webClientBuilder;

    @Value("${app.aishub.username:}") private String username;
    @Value("${app.aishub.url:http://data.aishub.net/ws.php}") private String url;
    @Value("${app.aishub.latmin:50.7}") private double latmin;
    @Value("${app.aishub.latmax:53.7}") private double latmax;
    @Value("${app.aishub.lonmin:3.2}")  private double lonmin;
    @Value("${app.aishub.lonmax:7.3}")  private double lonmax;

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

        WebClient client = webClientBuilder.build();
        JsonNode root;
        try {
            root = client.get()
                .uri(url + "?username={u}&format=1&output=json&compress=0"
                        + "&latmin={a}&latmax={b}&lonmin={c}&lonmax={d}",
                        username, latmin, latmax, lonmin, lonmax)
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
        log.info("AISHub: {} van onze {} boten geüpdatet ({} schepen in gebied)",
                opgeslagen, onzeMmsis.size(), schepen.size());
    }
}
