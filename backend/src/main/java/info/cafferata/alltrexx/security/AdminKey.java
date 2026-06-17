package info.cafferata.alltrexx.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/**
 * Herbruikbare admin-key-check: vergelijkt de header X-Admin-Key met app.admin.api-key.
 * Klein en los zodat elke beheer-controller 'm kan injecteren (geen duplicatie).
 */
@Component
public class AdminKey {

    @Value("${app.admin.api-key:}")
    private String adminKey;

    public void controleer(String key) {
        if (adminKey == null || adminKey.isBlank() || !adminKey.equals(key)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Ongeldige of ontbrekende admin-key");
        }
    }
}
