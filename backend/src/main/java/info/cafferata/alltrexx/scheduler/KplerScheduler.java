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

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * Tweede AIS-bron: Kpler Messages API (developers.kpler.com).
 * Haalt elke 15 min de recente decoded AIS-berichten op voor onze MMSI's en
 * bewaart de nieuwste positie + bootnaam. Draait náást AISHub (redundantie):
 * de meest recente positie wint op de kaart.
 *
 * Docs: https://servicedocs-sm.kpler.com/messages-api/
 *   GET https://rest.sml.kpler.com/messages?mmsi=...&fields=decoded
 *       &received_after=ISO8601   (Authorization: Bearer <token>)
 *   velden: mmsi, latitude, longitude, course, speed (knopen), name, timestamp, heading
 *   limiet: <30 verzoeken/min
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class KplerScheduler {

    private final TrackerService trackerService;
    private final WebClient.Builder webClientBuilder;

    @Value("${app.kpler.token:}") private String token;
    @Value("${app.kpler.url:https://rest.sml.kpler.com/messages}") private String url;
    /** Hoever terug we recente berichten ophalen (uren). */
    @Value("${app.kpler.lookback-hours:6}") private long lookbackHours;

    @Scheduled(fixedRateString = "${app.scheduler.ais-interval-ms:900000}")
    public void haalKplerDataOp() {
        if (token == null || token.isBlank()) {
            log.debug("Kpler: geen token ingesteld — overslaan");
            return;
        }

        List<String> mmsis = trackerService.trackerPerType(TrackerType.BOAT).stream()
                .map(t -> t.getExterneId())
                .filter(id -> id != null && !id.isBlank())
                .toList();
        if (mmsis.isEmpty()) {
            log.debug("Kpler: geen boten met AIS-nummer");
            return;
        }

        String mmsiCsv = String.join(",", mmsis);
        String sinds = Instant.now().minus(lookbackHours, ChronoUnit.HOURS)
                .truncatedTo(ChronoUnit.SECONDS).toString().replace("Z", "");

        JsonNode berichten;
        try {
            berichten = webClientBuilder.build().get()
                .uri(url + "?fields=decoded&mmsi={m}&received_after={s}", mmsiCsv, sinds)
                .header("Authorization", "Bearer " + token)
                .retrieve()
                .bodyToMono(JsonNode.class)
                .block();
        } catch (Exception e) {
            log.warn("Kpler: ophalen mislukt: {}", e.getMessage());
            return;
        }

        if (berichten == null || !berichten.isArray()) {
            log.warn("Kpler: onverwachte respons");
            return;
        }

        // Nieuwste bericht-met-positie per MMSI bewaren
        Map<String, JsonNode> nieuwstePerMmsi = new HashMap<>();
        for (JsonNode b : berichten) {
            if (b.path("latitude").isMissingNode() || b.path("longitude").isMissingNode()) continue;
            String mmsi = b.path("mmsi").asText();
            String ts = b.path("timestamp").asText("");
            JsonNode huidig = nieuwstePerMmsi.get(mmsi);
            if (huidig == null || ts.compareTo(huidig.path("timestamp").asText("")) > 0) {
                nieuwstePerMmsi.put(mmsi, b);
            }
        }

        int opgeslagen = 0;
        for (var e : nieuwstePerMmsi.entrySet()) {
            JsonNode b = e.getValue();
            String mmsi = e.getKey();
            double lat = b.path("latitude").asDouble();
            double lon = b.path("longitude").asDouble();
            double snelheid = b.path("speed").asDouble() * 1.852; // knopen → km/h
            double koers = b.path("course").asDouble();
            String bootnaam = b.path("name").asText(null);

            trackerService.slaPositieOp(mmsi, TrackerType.BOAT, bootnaam != null ? bootnaam : mmsi,
                    lat, lon, snelheid, koers, 0, "KPLER");
            trackerService.werkScheepsgegevensBij(mmsi, bootnaam, null);
            opgeslagen++;
        }
        log.info("Kpler: {} van onze {} boten geüpdatet", opgeslagen, mmsis.size());
    }
}
