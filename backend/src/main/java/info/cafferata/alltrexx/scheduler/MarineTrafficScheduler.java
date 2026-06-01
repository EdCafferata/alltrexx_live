package info.cafferata.alltrexx.scheduler;

import info.cafferata.alltrexx.model.TrackerType;
import info.cafferata.alltrexx.service.TrackerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import com.fasterxml.jackson.databind.JsonNode;

import java.util.List;

/**
 * Haalt live AIS-data op bij MarineTraffic voor geregistreerde boten.
 * Interval instelbaar via app.scheduler.ais-interval-ms (standaard elk uur).
 *
 * MarineTraffic API docs: https://www.marinetraffic.com/en/ais-api-services
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class MarineTrafficScheduler {

    private final TrackerService trackerService;
    private final WebClient.Builder webClientBuilder;

    @Value("${app.marinetraffic.api-key}")
    private String apiKey;

    @Value("${app.marinetraffic.base-url}")
    private String baseUrl;

    /**
     * Haal posities op voor alle actieve boten.
     * Scheduled: configureerbaar via app.scheduler.ais-interval-ms
     */
    @Scheduled(fixedRateString = "${app.scheduler.ais-interval-ms:3600000}")
    public void haalAisDataOp() {
        if ("DEMO_KEY".equals(apiKey)) {
            log.debug("MarineTraffic: DEMO_KEY — API ophalen overgeslagen");
            return;
        }

        var boten = trackerService.trackerPerType(TrackerType.BOAT);
        if (boten.isEmpty()) {
            log.debug("Geen actieve boten gevonden voor AIS ophaal");
            return;
        }

        log.info("AIS scheduler: {} boten ophalen bij MarineTraffic", boten.size());
        WebClient client = webClientBuilder.baseUrl(baseUrl).build();

        for (var boot : boten) {
            if (boot.getExterneId() == null) continue;
            try {
                haalEnSlaOp(client, boot.getExterneId(), boot.getNaam());
            } catch (Exception e) {
                log.warn("AIS ophalen mislukt voor {}: {}", boot.getNaam(), e.getMessage());
            }
        }
    }

    private void haalEnSlaOp(WebClient client, String mmsi, String naam) {
        // MarineTraffic v2 API: exportvessel endpoint
        String url = String.format(
            "/exportvessel/%s/v:2/mmsi:%s/protocol:jsono",
            apiKey, mmsi
        );

        JsonNode response = client.get()
            .uri(url)
            .retrieve()
            .bodyToMono(JsonNode.class)
            .block();

        if (response == null || !response.isArray() || response.isEmpty()) {
            log.debug("Geen AIS data voor MMSI {}", mmsi);
            return;
        }

        JsonNode schip = response.get(0);
        double lat      = schip.path("LAT").asDouble();
        double lon      = schip.path("LON").asDouble();
        double snelheid = schip.path("SPEED").asDouble() * 1.852; // knopen → km/h
        double koers    = schip.path("COURSE").asDouble();

        trackerService.slaPositieOp(
            mmsi, TrackerType.BOAT, naam,
            lat, lon, snelheid, koers, 0,
            "MARINETRAFFIC"
        );

        log.debug("AIS positie opgeslagen: {} @ {},{}", naam, lat, lon);
    }
}
