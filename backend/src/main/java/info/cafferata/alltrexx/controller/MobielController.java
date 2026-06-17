package info.cafferata.alltrexx.controller;

import info.cafferata.alltrexx.model.Positie;
import info.cafferata.alltrexx.service.MobielService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

/**
 * API voor de mobiele Alltrexx-app (zoals BVK/RHN): de app stuurt posities in
 * met een per-toestel token. De token hoort bij één tracker en is de basis voor
 * abonnement/activatie per toestel. Geen JWT — de token is de sleutel.
 *
 * POST /api/mobiel/positie
 * Body: { "token": "...", "lat": 52.37, "lon": 4.89, "snelheid": 12.3, "koers": 180, "hoogte": 0 }
 */
@RestController
@RequestMapping("/api/mobiel")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MobielController {

    private final MobielService mobielService;

    @PostMapping("/positie")
    public ResponseEntity<Positie> nieuwePositie(@RequestBody Map<String, Object> body) {
        String token = (String) body.get("token");
        if (token == null || token.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token ontbreekt");
        }
        if (body.get("lat") == null || body.get("lon") == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "lat en lon zijn verplicht");
        }
        double lat      = ((Number) body.get("lat")).doubleValue();
        double lon      = ((Number) body.get("lon")).doubleValue();
        double snelheid = body.get("snelheid") != null ? ((Number) body.get("snelheid")).doubleValue() : 0;
        double koers    = body.get("koers")    != null ? ((Number) body.get("koers")).doubleValue()    : 0;
        double hoogte   = body.get("hoogte")   != null ? ((Number) body.get("hoogte")).doubleValue()   : 0;

        try {
            Positie opgeslagen = mobielService.slaPositieOpViaToken(token, lat, lon, snelheid, koers, hoogte);
            return ResponseEntity.ok(opgeslagen);
        } catch (IllegalArgumentException e) {
            // onbekende of inactieve token → 403 (toestel niet (meer) geactiveerd/geabonneerd)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, e.getMessage());
        }
    }
}
