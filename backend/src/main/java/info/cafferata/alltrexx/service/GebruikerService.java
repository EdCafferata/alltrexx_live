package info.cafferata.alltrexx.service;

import info.cafferata.alltrexx.model.Gebruiker;
import info.cafferata.alltrexx.repository.GebruikerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Minimale gebruikers-administratie voor abonnement (FREE/PRO) en beheer.
 * Identificatie via opaak CloudKit-ID; geen persoonsgegevens nodig.
 */
@Service
@RequiredArgsConstructor
public class GebruikerService {

    private final GebruikerRepository repo;

    /** Upsert bij login: maakt het account aan (FREE) of werkt naam/laatsteLogin bij.
     *  Beheerders krijgen automatisch PRO zodat ze alles kunnen gebruiken/testen. */
    @Transactional
    public Gebruiker aanmelden(String externeId, String naam, boolean beheerder) {
        Gebruiker g = repo.findByExterneId(externeId).orElseGet(() ->
            Gebruiker.builder().externeId(externeId).abonnement("FREE").build());
        if (naam != null && !naam.isBlank()) g.setNaam(naam.trim());
        g.setBeheerder(beheerder);
        if (beheerder) g.setAbonnement("PRO"); // beheerder = volledige toegang
        g.setLaatsteLogin(LocalDateTime.now());
        return repo.save(g);
    }

    public List<Gebruiker> alle() {
        return repo.findAll();
    }

    /** Abonnement zetten/verwijderen (Pro-vlag) — alleen "PRO" of "FREE". */
    @Transactional
    public Gebruiker zetAbonnement(Long id, String abonnement) {
        Gebruiker g = repo.findById(id).orElseThrow(
            () -> new IllegalArgumentException("Gebruiker niet gevonden"));
        g.setAbonnement("PRO".equalsIgnoreCase(abonnement) ? "PRO" : "FREE");
        return repo.save(g);
    }

    @Transactional
    public void verwijder(Long id) {
        repo.deleteById(id);
    }
}
