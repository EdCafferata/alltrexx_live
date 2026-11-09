package info.cafferata.alltrexx.controller;

import info.cafferata.alltrexx.model.Tracker;
import info.cafferata.alltrexx.model.TrackerType;
import info.cafferata.alltrexx.security.RateLimiter;
import info.cafferata.alltrexx.service.NaamFilter;
import info.cafferata.alltrexx.service.SleutelService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.util.Map;

/**
 * Self-service inlogsleutel voor ingelogde (Apple/CloudKit) gebruikers.
 *
 * POST /api/sleutel/gratis  body { "naam": "...", "type": "PERSON" }
 *   → maakt een GRATIS tracker-sleutel (token) aan en geeft 'm terug.
 *
 * Misbruikbescherming: per client-IP max {@code app.sleutel.max-per-ip-per-uur}
 * (standaard 7) en globaal max {@code app.sleutel.max-totaal-per-uur} (standaard 200)
 * nieuwe sleutels per uur; daarboven HTTP 429.
 *
 * Pro-sleutels (betaald) volgen later — in de UI nu nog "binnenkort".
 */
@RestController
@RequestMapping("/api/sleutel")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SleutelController {

    private static final Duration UUR = Duration.ofHours(1);

    private final SleutelService sleutelService;
    private final RateLimiter rateLimiter;
    private final NaamFilter naamFilter;

    @Value("${app.sleutel.max-per-ip-per-uur:7}")
    private int maxPerIpPerUur;

    @Value("${app.sleutel.max-totaal-per-uur:200}")
    private int maxTotaalPerUur;

    @PostMapping("/gratis")
    public ResponseEntity<Tracker> gratisSleutel(@RequestBody(required = false) Map<String, String> body,
                                                 HttpServletRequest request) {
        String ip = RateLimiter.clientIp(request);
        if (!rateLimiter.probeer("sleutel:ip:" + ip, maxPerIpPerUur, UUR)
                || !rateLimiter.probeer("sleutel:totaal", maxTotaalPerUur, UUR)) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                "Te veel nieuwe sleutels aangevraagd — probeer het later opnieuw");
        }
        String naam = body != null ? body.get("naam") : null;
        if (naam != null && naam.length() > 100) {
            naam = naam.substring(0, 100);
        }
        // Inhoudsfilter (App Store Guideline 1.2): weiger aanstootgevende namen.
        if (!naamFilter.isToegestaan(naam)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Deze naam is niet toegestaan. Kies een nettere naam.");
        }
        TrackerType type = null;
        if (body != null && body.get("type") != null) {
            try {
                type = TrackerType.valueOf(body.get("type").toUpperCase());
            } catch (IllegalArgumentException ignored) {
                // onbekend type → service kiest PERSON
            }
        }
        return ResponseEntity.ok(sleutelService.maakGratisSleutel(naam, type));
    }
}
