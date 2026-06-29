package info.cafferata.alltrexx.controller;

import info.cafferata.alltrexx.model.Gebruiker;
import info.cafferata.alltrexx.security.AdminKey;
import info.cafferata.alltrexx.service.GebruikerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

/**
 * Gebruikers: zelf-aanmelden bij login (publiek) + beheer (X-Admin-Key, zie AdminKey).
 * Minimaal model: opaak CloudKit-ID + abonnement (FREE/PRO). Geen persoonsgegevens.
 *
 *  POST   /api/gebruikers/aanmelden        body { externeId, naam?, beheerder? }  (publiek)
 *  GET    /api/gebruikers                  X-Admin-Key  → lijst
 *  PUT    /api/gebruikers/{id}/abonnement  X-Admin-Key  body { abonnement }
 *  DELETE /api/gebruikers/{id}             X-Admin-Key
 */
@RestController
@RequestMapping("/api/gebruikers")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class GebruikerController {

    private final GebruikerService service;
    private final AdminKey adminKey;

    @PostMapping("/aanmelden")
    public ResponseEntity<Gebruiker> aanmelden(@RequestBody Map<String, Object> body) {
        String externeId = (String) body.get("externeId");
        if (externeId == null || externeId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "externeId ontbreekt");
        }
        String naam = (String) body.get("naam");
        boolean beheerder = Boolean.TRUE.equals(body.get("beheerder"));
        return ResponseEntity.ok(service.aanmelden(externeId, naam, beheerder));
    }

    @GetMapping
    public ResponseEntity<List<Gebruiker>> lijst(
            @RequestHeader(value = "X-Admin-Key", required = false) String key) {
        adminKey.controleer(key);
        return ResponseEntity.ok(service.alle());
    }

    @PutMapping("/{id}/abonnement")
    public ResponseEntity<Gebruiker> zetAbonnement(
            @RequestHeader(value = "X-Admin-Key", required = false) String key,
            @PathVariable Long id, @RequestBody Map<String, String> body) {
        adminKey.controleer(key);
        return ResponseEntity.ok(service.zetAbonnement(id, body.get("abonnement")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> verwijder(
            @RequestHeader(value = "X-Admin-Key", required = false) String key,
            @PathVariable Long id) {
        adminKey.controleer(key);
        service.verwijder(id);
        return ResponseEntity.noContent().build();
    }
}
