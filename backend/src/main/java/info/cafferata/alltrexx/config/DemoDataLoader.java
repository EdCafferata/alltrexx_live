package info.cafferata.alltrexx.config;

import info.cafferata.alltrexx.model.TrackerType;
import info.cafferata.alltrexx.service.TrackerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * Laadt demo-trackers bij opstarten in DEV modus.
 * Alleen actief als spring.profiles.active != prod
 */
@Component
@Profile("!prod")
@RequiredArgsConstructor
@Slf4j
public class DemoDataLoader implements ApplicationRunner {

    private final TrackerService trackerService;

    @Override
    public void run(ApplicationArguments args) {
        log.info("Demo data laden...");

        // ── Boten ──────────────────────────────────────────────────────────────
        trackerService.slaPositieOp("MMSI-244001", TrackerType.BOAT,
            "Zeilboot Vrijheid",
            52.4585, 4.5615, 7.4, 135, 0, "DEMO");

        trackerService.slaPositieOp("MMSI-244002", TrackerType.BOAT,
            "MS Rotterdam",
            51.9050, 4.4700, 12.1, 270, 0, "DEMO");

        trackerService.slaPositieOp("MMSI-244003", TrackerType.BOAT,
            "Waddenveer Texel",
            53.0035, 4.7500, 15.3, 0, 0, "DEMO");

        trackerService.slaPositieOp("MMSI-244004", TrackerType.BOAT,
            "Riviera Cruiser",
            52.1200, 5.3800, 8.9, 45, 0, "DEMO");

        // ── Fietsen ────────────────────────────────────────────────────────────
        trackerService.slaPositieOp("BIKE-001", TrackerType.BIKE,
            "Ed — Racefiets",
            52.3702, 4.8952, 31.2, 180, 3, "DEMO");

        trackerService.slaPositieOp("BIKE-002", TrackerType.BIKE,
            "Jim — Mountainbike",
            51.4416, 5.4697, 22.5, 90, 18, "DEMO");

        // ── Auto ───────────────────────────────────────────────────────────────
        trackerService.slaPositieOp("CAR-001", TrackerType.CAR,
            "Onderweg A2",
            52.0900, 5.1050, 118.0, 200, 5, "DEMO");

        // ── Vliegtuig ──────────────────────────────────────────────────────────
        trackerService.slaPositieOp("KLM1234", TrackerType.PLANE,
            "KLM1234 Amsterdam–Londen",
            52.5000, 4.2000, 850.0, 270, 9500, "DEMO");

        // ── Persoon ────────────────────────────────────────────────────────────
        trackerService.slaPositieOp("RUN-001", TrackerType.PERSON,
            "Hardloper Vondelpark",
            52.3580, 4.8736, 11.5, 60, 2, "DEMO");

        log.info("✅ Demo data geladen: 4 boten, 2 fietsen, 1 auto, 1 vliegtuig, 1 persoon");
    }
}
