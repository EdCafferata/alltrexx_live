package info.cafferata.alltrexx.controller;

import info.cafferata.alltrexx.model.Melding;
import info.cafferata.alltrexx.repository.MeldingRepository;
import info.cafferata.alltrexx.security.AdminKey;
import info.cafferata.alltrexx.security.RateLimiter;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.util.List;
import java.util.Map;

/**
 * Meldingen (reports) van aanstootgevende tracker-namen op de publieke kaart.
 *
 * Publiek: {@code POST /api/meld {trackerId, reden?}} — iedereen (ook via de mobiele
 * app, die de kaart in een webview toont) kan een naam melden; rate-limited op 20/IP/uur.
 * Beheer (X-Admin-Key): openstaande meldingen bekijken en afhandelen.
 *
 * Bij ≥ {@code app.meld.verberg-drempel} openstaande meldingen maskeert de live kaart
 * de naam automatisch (zie {@link info.cafferata.alltrexx.service.TrackerService}).
 * Samen met de naamfilter bij het aanmaken dekt dit App Store Guideline 1.2
 * (user-generated content: filteren, melden, verwijderen).
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MeldController {

    private static final Duration UUR = Duration.ofHours(1);

    private final MeldingRepository meldingRepo;
    private final RateLimiter rateLimiter;
    private final AdminKey adminKey;

    /** Een tracker-naam melden. Publiek, rate-limited op 20/IP/uur. */
    @PostMapping("/meld")
    public ResponseEntity<Map<String, Object>> meld(@RequestBody(required = false) Map<String, Object> body,
                                                    HttpServletRequest request) {
        String ip = RateLimiter.clientIp(request);
        if (!rateLimiter.probeer("meld:ip:" + ip, 20, UUR)) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                "Te veel meldingen — probeer het later opnieuw");
        }
        Long trackerId = null;
        Object t = body != null ? body.get("trackerId") : null;
        if (t instanceof Number n) {
            trackerId = n.longValue();
        } else if (t != null) {
            try { trackerId = Long.parseLong(t.toString().trim()); } catch (NumberFormatException ignored) { }
        }
        if (trackerId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "trackerId ontbreekt of is ongeldig");
        }
        String reden = body != null && body.get("reden") != null ? body.get("reden").toString() : null;
        if (reden != null && reden.length() > 500) reden = reden.substring(0, 500);

        meldingRepo.save(Melding.builder().trackerId(trackerId).reden(reden).ip(ip).build());
        return ResponseEntity.ok(Map.of("status", "ok", "bericht", "Bedankt, we bekijken je melding."));
    }

    /** Openstaande meldingen (beheer). */
    @GetMapping("/admin/meldingen")
    public ResponseEntity<List<Melding>> openstaand(
            @RequestHeader(value = "X-Admin-Key", required = false) String key) {
        adminKey.controleer(key);
        return ResponseEntity.ok(meldingRepo.findByAfgehandeldFalseOrderByTijdstipDesc());
    }

    /** Een melding als afgehandeld markeren (beheer). */
    @PostMapping("/admin/meldingen/{id}/afgehandeld")
    public ResponseEntity<Void> afhandelen(
            @RequestHeader(value = "X-Admin-Key", required = false) String key,
            @PathVariable Long id) {
        adminKey.controleer(key);
        meldingRepo.findById(id).ifPresent(m -> { m.setAfgehandeld(true); meldingRepo.save(m); });
        return ResponseEntity.noContent().build();
    }
}
