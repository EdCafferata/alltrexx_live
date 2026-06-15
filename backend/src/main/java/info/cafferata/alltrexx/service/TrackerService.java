package info.cafferata.alltrexx.service;

import info.cafferata.alltrexx.dto.PositieDto;
import info.cafferata.alltrexx.model.*;
import info.cafferata.alltrexx.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class TrackerService {

    private final TrackerRepository trackerRepo;
    private final PositieRepository positieRepo;

    // ── Trackers ──────────────────────────────────────────────────────────────

    public List<Tracker> alleActieveTrackers() {
        return trackerRepo.findByActief(true);
    }

    public List<Tracker> trackerPerType(TrackerType type) {
        return trackerRepo.findByTypeAndActief(type, true);
    }

    public Optional<Tracker> vindPerExterneId(String externeId) {
        return trackerRepo.findByExterneId(externeId);
    }

    @Transactional
    public Tracker slaTrackerOp(Tracker tracker) {
        return trackerRepo.save(tracker);
    }

    /**
     * Werk de scheepsgegevens van een tracker bij (op externeId/MMSI).
     * Lege waarden worden genegeerd zodat bestaande gegevens niet worden gewist.
     * Bootnaam komt doorgaans van MarineTraffic (SHIPNAME), schipper handmatig/via app.
     */
    @Transactional
    public void werkScheepsgegevensBij(String externeId, String bootnaam, String schipper) {
        trackerRepo.findByExterneId(externeId).ifPresent(t -> {
            boolean gewijzigd = false;
            if (bootnaam != null && !bootnaam.isBlank() && !bootnaam.equals(t.getBootnaam())) {
                t.setBootnaam(bootnaam);
                gewijzigd = true;
            }
            if (schipper != null && !schipper.isBlank() && !schipper.equals(t.getSchipper())) {
                t.setSchipper(schipper);
                gewijzigd = true;
            }
            if (gewijzigd) trackerRepo.save(t);
        });
    }

    // ── Posities ──────────────────────────────────────────────────────────────

    /**
     * Sla een nieuwe positie op. Vindt de tracker op externeId.
     * Maakt de tracker automatisch aan als die nog niet bestaat.
     */
    @Transactional
    public Positie slaPositieOp(String externeId, TrackerType type, String naam,
                                 double lat, double lon, double snelheid,
                                 double koers, double hoogte, String bron) {
        Tracker tracker = trackerRepo.findByExterneId(externeId)
            .orElseGet(() -> {
                log.info("Nieuwe tracker aangemaakt: {} ({})", naam, type);
                return trackerRepo.save(Tracker.builder()
                    .naam(naam)
                    .type(type)
                    .externeId(externeId)
                    .actief(true)
                    .build());
            });

        Positie positie = Positie.builder()
            .tracker(tracker)
            .lat(lat)
            .lon(lon)
            .snelheid(snelheid)
            .koers(koers)
            .hoogte(hoogte)
            .tijdstip(LocalDateTime.now())
            .bron(bron)
            .build();

        return positieRepo.save(positie);
    }

    /** Alle laatste posities voor de live kaart */
    public List<PositieDto> liveKaart() {
        return positieRepo.findLaatstePositiesActieveTrackers()
            .stream()
            .map(PositieDto::van)
            .toList();
    }

    /** Laatste posities gefilterd op type */
    public List<PositieDto> liveKaartPerType(TrackerType type) {
        return positieRepo.findLaatstePositiesPerType(type)
            .stream()
            .map(PositieDto::van)
            .toList();
    }

    /** Route van een tracker over de afgelopen X uur */
    public List<PositieDto> route(Long trackerId, int uur) {
        return trackerRepo.findById(trackerId)
            .map(tracker -> positieRepo.findRoute(trackerId,
                    LocalDateTime.now().minusHours(uur))
                .stream()
                .map(PositieDto::van)
                .toList())
            .orElse(List.of());
    }
}
