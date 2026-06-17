package info.cafferata.alltrexx.controller;

import info.cafferata.alltrexx.model.Tracker;
import info.cafferata.alltrexx.security.AdminKey;
import info.cafferata.alltrexx.service.TrackerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Generieke beheer-endpoints (trackers toevoegen, bekijken, verwijderen, track wissen).
 * Beveiligd met de gedeelde admin-key (header X-Admin-Key, zie {@link AdminKey}).
 * Type-specifieke dingen staan in eigen controllers (bv. VliegtuigController).
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminController {

    private final TrackerService trackerService;
    private final AdminKey adminKey;

    /** Alle actieve trackers (voor het beheerscherm). */
    @GetMapping("/trackers")
    public ResponseEntity<List<Tracker>> lijst(
            @RequestHeader(value = "X-Admin-Key", required = false) String key) {
        adminKey.controleer(key);
        return ResponseEntity.ok(trackerService.alleActieveTrackers());
    }

    /** Tracker toevoegen of bijwerken (upsert op externeId). */
    @PostMapping("/trackers")
    public ResponseEntity<Tracker> opslaan(
            @RequestHeader(value = "X-Admin-Key", required = false) String key,
            @RequestBody Tracker tracker) {
        adminKey.controleer(key);
        return ResponseEntity.ok(trackerService.opslaanOfBijwerken(tracker));
    }

    /** Tracker verwijderen. */
    @DeleteMapping("/trackers/{id}")
    public ResponseEntity<Void> verwijder(
            @RequestHeader(value = "X-Admin-Key", required = false) String key,
            @PathVariable Long id) {
        adminKey.controleer(key);
        trackerService.verwijderTracker(id);
        return ResponseEntity.noContent().build();
    }

    /** Alle posities (track-historie) van een tracker wissen; de tracker blijft staan. */
    @DeleteMapping("/trackers/{id}/posities")
    public ResponseEntity<Void> wisPosities(
            @RequestHeader(value = "X-Admin-Key", required = false) String key,
            @PathVariable Long id) {
        adminKey.controleer(key);
        trackerService.verwijderPosities(id);
        return ResponseEntity.noContent().build();
    }
}
