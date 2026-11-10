package info.cafferata.alltrexx.repository;

import info.cafferata.alltrexx.model.Melding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MeldingRepository extends JpaRepository<Melding, Long> {

    /**
     * Tracker-ID's met minstens {@code drempel} openstaande (niet-afgehandelde)
     * meldingen. Eén goedkope aggregatie over de kleine meldingen-tabel — bewust
     * géén gecorreleerde subquery per positie-rij (zie CLAUDE.md-waarschuwing).
     */
    @Query("select m.trackerId from Melding m where m.afgehandeld = false " +
           "group by m.trackerId having count(m) >= :drempel")
    List<Long> trackerIdsVanafDrempel(@Param("drempel") long drempel);

    /** Openstaande meldingen voor het beheerscherm (nieuwste eerst). */
    List<Melding> findByAfgehandeldFalseOrderByTijdstipDesc();

    long countByTrackerIdAndAfgehandeldFalse(Long trackerId);
}
