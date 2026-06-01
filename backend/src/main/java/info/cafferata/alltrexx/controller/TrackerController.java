package info.cafferata.alltrexx.controller;

import info.cafferata.alltrexx.model.Positie;
import info.cafferata.alltrexx.model.Tracker;
import info.cafferata.alltrexx.model.TrackerType;
import info.cafferata.alltrexx.service.TrackerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * API voor de mobiele app — verstuurt posities vanuit de app naar de backend.
 * Vereist JWT authenticatie.
 */
@RestController
@RequestMapping("/api/trackers")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TrackerController {

    private final TrackerService trackerService;

    /**
     * Alle actieve trackers ophalen.
     * GET /api/trackers
     */
    @GetMapping
    public ResponseEntity<List<Tracker>> alleTrackers() {
        return ResponseEntity.ok(trackerService.alleActieveTrackers());
    }

    /**
     * Nieuwe positie vanuit de mobiele app.
     * POST /api/trackers/positie
     *
     * Body: {
     *   "externeId": "fiets-001",
     *   "type": "BIKE",
     *   "naam": "Racefiets Ed",
     *   "lat": 52.37,
     *   "lon": 4.89,
     *   "snelheid": 28.5,
     *   "koers": 180,
     *   "hoogte": 0
     * }
     */
    @PostMapping("/positie")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Positie> nieuwePositie(@RequestBody Map<String, Object> body) {
        String externeId   = (String) body.get("externeId");
        TrackerType type   = TrackerType.valueOf(((String) body.get("type")).toUpperCase());
        String naam        = (String) body.getOrDefault("naam", externeId);
        double lat         = ((Number) body.get("lat")).doubleValue();
        double lon         = ((Number) body.get("lon")).doubleValue();
        double snelheid    = body.containsKey("snelheid") ? ((Number) body.get("snelheid")).doubleValue() : 0;
        double koers       = body.containsKey("koers")    ? ((Number) body.get("koers")).doubleValue()    : 0;
        double hoogte      = body.containsKey("hoogte")   ? ((Number) body.get("hoogte")).doubleValue()   : 0;

        Positie opgeslagen = trackerService.slaPositieOp(
            externeId, type, naam,
            lat, lon, snelheid, koers, hoogte,
            "APP"
        );
        return ResponseEntity.ok(opgeslagen);
    }

    /**
     * Tracker aanmaken of bijwerken (admin).
     * POST /api/trackers
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Tracker> slaTrackerOp(@RequestBody Tracker tracker) {
        return ResponseEntity.ok(trackerService.slaTrackerOp(tracker));
    }
}
