package info.cafferata.alltrexx.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Eenvoudige in-memory sliding-window rate limiter (geen extra dependency).
 * Eén app-container → in-memory is voldoende; bij herstart begint de telling opnieuw.
 *
 * Gebruik: {@code if (!rateLimiter.probeer("sleutel:" + ip, 5, Duration.ofHours(1))) → 429}.
 */
@Component
public class RateLimiter {

    /** Boven dit aantal sleutels ruimen we verlopen vensters op (geheugen begrenzen). */
    private static final int OPRUIM_DREMPEL = 10_000;

    private final Map<String, Deque<Long>> vensters = new ConcurrentHashMap<>();

    /**
     * Registreer één verzoek voor {@code sleutel}. Geeft {@code false} als er binnen
     * {@code venster} al {@code max} verzoeken waren (verzoek wordt dan niet geteld).
     */
    public boolean probeer(String sleutel, int max, Duration venster) {
        long nu = System.currentTimeMillis();
        long grens = nu - venster.toMillis();
        if (vensters.size() > OPRUIM_DREMPEL) {
            ruimOp(grens);
        }
        Deque<Long> tijden = vensters.computeIfAbsent(sleutel, k -> new ArrayDeque<>());
        synchronized (tijden) {
            while (!tijden.isEmpty() && tijden.peekFirst() <= grens) {
                tijden.pollFirst();
            }
            if (tijden.size() >= max) {
                return false;
            }
            tijden.addLast(nu);
            return true;
        }
    }

    private void ruimOp(long grens) {
        vensters.entrySet().removeIf(e -> {
            Deque<Long> d = e.getValue();
            synchronized (d) {
                return d.isEmpty() || d.peekLast() <= grens;
            }
        });
    }

    /**
     * Client-IP achter de nginx reverse proxy: X-Real-IP (door nginx gezet), anders het
     * láátste X-Forwarded-For-element (door onze proxy toegevoegd, niet door de client
     * te vervalsen), anders het directe remote-adres.
     */
    public static String clientIp(HttpServletRequest request) {
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            String[] delen = xff.split(",");
            return delen[delen.length - 1].trim();
        }
        return request.getRemoteAddr();
    }
}
