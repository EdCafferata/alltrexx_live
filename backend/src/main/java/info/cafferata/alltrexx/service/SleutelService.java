package info.cafferata.alltrexx.service;

import info.cafferata.alltrexx.model.Tracker;
import info.cafferata.alltrexx.model.TrackerType;
import info.cafferata.alltrexx.repository.TrackerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Self-service inlogsleutel voor ingelogde gebruikers. Een 'sleutel' is een tracker
 * met een unieke token: de mobiele app stuurt posities met die token (zie
 * MobielController). De gratis sleutel krijgt abonnement "FREE"; Pro (betaald)
 * volgt later — dan gate-t 'abonnement' de extra features.
 */
@Service
@RequiredArgsConstructor
public class SleutelService {

    private final TrackerRepository trackerRepo;

    /** Maak een gratis sleutel (token) aan. Geen persoonsgegevens op de server:
     *  alleen een label (naam) en het type; de gebruiker bewaart de token zelf. */
    @Transactional
    public Tracker maakGratisSleutel(String naam, TrackerType type) {
        Tracker tracker = Tracker.builder()
            .naam(naam == null || naam.isBlank() ? "Mijn tracker" : naam.trim())
            .type(type == null ? TrackerType.PERSON : type)
            .token(UUID.randomUUID().toString())
            .abonnement("FREE")
            .actief(true)
            .aangemaakt(LocalDateTime.now())
            .build();
        return trackerRepo.save(tracker);
    }
}
