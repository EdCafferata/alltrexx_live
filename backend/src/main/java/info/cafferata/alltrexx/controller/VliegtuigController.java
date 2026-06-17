package info.cafferata.alltrexx.controller;

import info.cafferata.alltrexx.security.AdminKey;
import info.cafferata.alltrexx.service.VliegtuigService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Vliegtuig-specifieke beheer-endpoints — los van AdminController.
 * Valt onder /api/admin/** (admin-key in header X-Admin-Key).
 */
@RestController
@RequestMapping("/api/admin/vliegtuig")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class VliegtuigController {

    private final VliegtuigService vliegtuigService;
    private final AdminKey adminKey;

    /** GET /api/admin/vliegtuig/icao?reg=PH-USN → { "reg": "PH-USN", "hex": "484a8b" } */
    @GetMapping("/icao")
    public ResponseEntity<Map<String, String>> icaoLookup(
            @RequestHeader(value = "X-Admin-Key", required = false) String key,
            @RequestParam String reg) {
        adminKey.controleer(key);
        return ResponseEntity.ok(Map.of(
                "reg", reg.trim().toUpperCase(),
                "hex", vliegtuigService.zoekIcaoHex(reg)));
    }
}
