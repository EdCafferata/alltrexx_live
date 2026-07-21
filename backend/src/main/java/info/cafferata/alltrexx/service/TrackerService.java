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
import java.util.UUID;

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
     * Voeg een tracker toe of werk hem bij op basis van externeId (AIS/MMSI).
     * Bestaat er al een tracker met dat externeId, dan worden de meegegeven velden
     * bijgewerkt; anders wordt een nieuwe aangemaakt.
     */
    @Transactional
    public Tracker opslaanOfBijwerken(Tracker invoer) {
        Tracker doel = (invoer.getExterneId() != null
                ? trackerRepo.findByExterneId(invoer.getExterneId()).orElse(null)
                : null);
        if (doel == null) doel = invoer.getId() != null
                ? trackerRepo.findById(invoer.getId()).orElse(new Tracker())
                : new Tracker();

        if (invoer.getNaam() != null)        doel.setNaam(invoer.getNaam());
        if (invoer.getType() != null)        doel.setType(invoer.getType());
        if (invoer.getExterneId() != null)   doel.setExterneId(invoer.getExterneId());
        if (invoer.getBootnaam() != null)    doel.setBootnaam(invoer.getBootnaam());
        if (invoer.getSchipper() != null)    doel.setSchipper(invoer.getSchipper());
        if (invoer.getTelefoon() != null)    doel.setTelefoon(invoer.getTelefoon());
        if (invoer.getOmschrijving() != null) doel.setOmschrijving(invoer.getOmschrijving());
        if (doel.getNaam() == null) doel.setNaam(invoer.getExterneId()); // fallback
        // Geef elk toestel een eigen token (sleutel voor de mobiele app / abonnement).
        if (doel.getToken() == null || doel.getToken().isBlank()) {
            doel.setToken(UUID.randomUUID().toString());
        }
        doel.setActief(true);
        return trackerRepo.save(doel);
    }

    @Transactional
    public void verwijderTracker(Long id) {
        trackerRepo.deleteById(id);
    }

    /** Wis alle posities (track-historie) van een tracker; de tracker zelf blijft bestaan. */
    @Transactional
    public long verwijderPosities(Long trackerId) {
        return trackerRepo.findById(trackerId)
            .map(positieRepo::deleteByTracker)
            .orElse(0L);
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
        return positieRepo.findLaatstePositiesPerType(type.name())
            .stream()
            .map(PositieDto::van)
            .toList();
    }

    /** Laatste update + aantal per databron (voor de bron-ticker) */
    public List<info.cafferata.alltrexx.repository.PositieRepository.BronStatus> bronnenStatus() {
        return positieRepo.findLaatsteUpdatePerBron();
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
