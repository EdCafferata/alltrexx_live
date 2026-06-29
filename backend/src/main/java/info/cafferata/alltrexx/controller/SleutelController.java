package info.cafferata.alltrexx.controller;

import info.cafferata.alltrexx.model.Tracker;
import info.cafferata.alltrexx.model.TrackerType;
import info.cafferata.alltrexx.service.SleutelService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Self-service inlogsleutel voor ingelogde (Apple/CloudKit) gebruikers.
 *
 * POST /api/sleutel/gratis  body { "naam": "...", "type": "PERSON" }
 *   → maakt een GRATIS tracker-sleutel (token) aan en geeft 'm terug.
 *
 * Pro-sleutels (betaald) volgen later — in de UI nu nog "binnenkort".
 */
@RestController
@RequestMapping("/api/sleutel")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SleutelController {

    private final SleutelService sleutelService;

    @PostMapping("/gratis")
    public ResponseEntity<Tracker> gratisSleutel(@RequestBody(required = false) Map<String, String> body) {
        String naam = body != null ? body.get("naam") : null;
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
