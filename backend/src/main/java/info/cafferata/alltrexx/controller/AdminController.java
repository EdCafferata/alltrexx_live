package info.cafferata.alltrexx.controller;

import info.cafferata.alltrexx.model.Tracker;
import info.cafferata.alltrexx.service.TrackerService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

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
    private final WebClient.Builder webClientBuilder;

    @Value("${app.admin.api-key:}")
    private String adminKey;

    @Value("${app.icao.lookup-url:https://hexdb.io/reg-hex}")
    private String icaoLookupUrl;

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

    /** Alle posities (track-historie) van een tracker wissen; de boot blijft staan. */
    @DeleteMapping("/trackers/{id}/posities")
    public ResponseEntity<Void> wisPosities(
            @RequestHeader(value = "X-Admin-Key", required = false) String key,
            @PathVariable Long id) {
        controleerKey(key);
        trackerService.verwijderPosities(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Zoek de ICAO 24-bit hex bij een vliegtuigregistratie (bv. PH-USN) via hexdb.io.
     * GET /api/admin/icao?reg=PH-USN  →  { "reg": "PH-USN", "hex": "484a8b" }
     */
    @GetMapping("/icao")
    public ResponseEntity<Map<String, String>> icaoLookup(
            @RequestHeader(value = "X-Admin-Key", required = false) String key,
            @RequestParam String reg) {
        controleerKey(key);
        String registratie = reg.trim().toUpperCase();
        String hex;
        try {
            hex = webClientBuilder.build().get()
                    .uri(icaoLookupUrl + "?reg={reg}", registratie)
                    .header("User-Agent", "Alltrexx/1.0 (+https://alltrexx.live)")
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Opzoeken mislukt");
        }
        hex = hex != null ? hex.trim() : "";
        if (!hex.matches("(?i)[0-9a-f]{6}")) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Geen ICAO-hex gevonden voor " + registratie);
        }
        return ResponseEntity.ok(Map.of("reg", registratie, "hex", hex.toLowerCase()));
    }
}
