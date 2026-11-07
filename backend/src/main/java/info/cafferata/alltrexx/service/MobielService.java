package info.cafferata.alltrexx.service;

import info.cafferata.alltrexx.model.Positie;
import info.cafferata.alltrexx.model.Tracker;
import info.cafferata.alltrexx.repository.PositieRepository;
import info.cafferata.alltrexx.repository.TrackerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Mobiele Alltrexx-app: posities binnenhalen op basis van de per-toestel token.
 * Los gehouden van TrackerService (die puur over trackers/posities-beheer gaat).
 */
@Service
@RequiredArgsConstructor
public class MobielService {

    private final TrackerRepository trackerRepo;
    private final PositieRepository positieRepo;

    /**
     * Sla een positie op aan de hand van de toestel-token. Matcht de token op een
     * actieve tracker; gooit een fout als de token onbekend of inactief is.
     */
    @Transactional
    public Positie slaPositieOpViaToken(String token, double lat, double lon,
                                        double snelheid, double koers, double hoogte) {
        Tracker tracker = trackerRepo.findByToken(token)
            .filter(Tracker::isActief)
            .orElseThrow(() -> new IllegalArgumentException("Onbekende of inactieve token"));

        Positie positie = Positie.builder()
            .tracker(tracker)
            .lat(lat).lon(lon)
            .snelheid(snelheid).koers(koers).hoogte(hoogte)
            .tijdstip(LocalDateTime.now())
            .bron("MOBIEL")
            .build();
        return positieRepo.save(positie);
    }

    /**
     * In-app dataverwijdering (App Store 5.1.1(v)): wis de tracker die bij deze
     * toestel-token hoort, inclusief al zijn posities. Alleen de houder van de token
     * kan dit; onbekende token → IllegalArgumentException.
     *
     * @return het aantal verwijderde posities
     */
    @Transactional
    public long verwijderViaToken(String token) {
        Tracker tracker = trackerRepo.findByToken(token)
            .orElseThrow(() -> new IllegalArgumentException("Onbekende token"));
        long posities = positieRepo.deleteByTracker(tracker);
        trackerRepo.delete(tracker);
        return posities;
    }
}
