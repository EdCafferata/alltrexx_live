package info.cafferata.alltrexx.controller;

import info.cafferata.alltrexx.model.Tracker;
import info.cafferata.alltrexx.service.TrackerService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/**
 * Beheer-endpoints (boten/AIS toevoegen, bekijken, verwijderen).
 * Beveiligd met een gedeelde admin-key in de header X-Admin-Key, vergeleken met
 * app.admin.api-key (uit .env). De key staat NOOIT in de frontend-bundle: de
 * beheerder voert hem in het beheerscherm in (opgeslagen in de browser).
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminController {

    private final TrackerService trackerService;

    @Value("${app.admin.api-key:}")
    private String adminKey;

    private void controleerKey(String key) {
        if (adminKey == null || adminKey.isBlank() || !adminKey.equals(key)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Ongeldige of ontbrekende admin-key");
        }
    }

    /** Alle actieve trackers (voor het beheerscherm). */
    @GetMapping("/trackers")
    public ResponseEntity<List<Tracker>> lijst(
            @RequestHeader(value = "X-Admin-Key", required = false) String key) {
        controleerKey(key);
        return ResponseEntity.ok(trackerService.alleActieveTrackers());
    }

    /** Boot toevoegen of bijwerken (upsert op externeId/AIS-nummer). */
    @PostMapping("/trackers")
    public ResponseEntity<Tracker> opslaan(
            @RequestHeader(value = "X-Admin-Key", required = false) String key,
            @RequestBody Tracker tracker) {
        controleerKey(key);
        return ResponseEntity.ok(trackerService.opslaanOfBijwerken(tracker));
    }

    /** Tracker verwijderen. */
    @DeleteMapping("/trackers/{id}")
    public ResponseEntity<Void> verwijder(
            @RequestHeader(value = "X-Admin-Key", required = false) String key,
            @PathVariable Long id) {
        controleerKey(key);
        trackerService.verwijderTracker(id);
        return ResponseEntity.noContent().build();
    }
}
