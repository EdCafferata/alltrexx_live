package info.cafferata.alltrexx.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ResponseStatusException;

/**
 * Vliegtuig-specifiek: zoek de ICAO 24-bit hex bij een registratie (bv. PH-USN) via
 * hexdb.io. Los gehouden van de generieke beheer-/tracker-logica.
 */
@Service
@RequiredArgsConstructor
public class VliegtuigService {

    private final WebClient.Builder webClientBuilder;

    @Value("${app.icao.lookup-url:https://hexdb.io/reg-hex}")
    private String icaoLookupUrl;

    /** Geeft de lowercase ICAO-hex voor een registratie (PH-USN → 484a8b). */
    public String zoekIcaoHex(String reg) {
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
        return hex.toLowerCase();
    }
}
