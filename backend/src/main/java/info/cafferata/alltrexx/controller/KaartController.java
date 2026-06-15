package info.cafferata.alltrexx.controller;

import info.cafferata.alltrexx.dto.PositieDto;
import info.cafferata.alltrexx.model.TrackerType;
import info.cafferata.alltrexx.service.TrackerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Publieke API voor de kaart — geen authenticatie vereist voor lezen.
 */
@RestController
@RequestMapping("/api/kaart")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class KaartController {

    private final TrackerService trackerService;

    /**
     * Alle actuele posities voor de live kaart.
     * GET /api/kaart/live
     */
    @GetMapping("/live")
    public ResponseEntity<List<PositieDto>> liveKaart() {
        return ResponseEntity.ok(trackerService.liveKaart());
    }

    /**
     * Laatste update per databron (AISHUB, KPLER, ...) — voor de bron-ticker.
     * GET /api/kaart/bronnen
     */
    @GetMapping("/bronnen")
    public ResponseEntity<List<info.cafferata.alltrexx.repository.PositieRepository.BronStatus>> bronnen() {
        return ResponseEntity.ok(trackerService.bronnenStatus());
    }

    /**
     * Actuele posities gefilterd op type.
     * GET /api/kaart/live?type=BOAT
     */
    @GetMapping("/live/{type}")
    public ResponseEntity<List<PositieDto>> liveKaartPerType(
            @PathVariable TrackerType type) {
        return ResponseEntity.ok(trackerService.liveKaartPerType(type));
    }

    /**
     * Route van een tracker over de afgelopen X uur.
     * GET /api/kaart/route/1?uur=24
     */
    @GetMapping("/route/{trackerId}")
    public ResponseEntity<List<PositieDto>> route(
            @PathVariable Long trackerId,
            @RequestParam(defaultValue = "24") int uur) {
        return ResponseEntity.ok(trackerService.route(trackerId, uur));
    }
}
