package info.cafferata.alltrexx.repository;

import info.cafferata.alltrexx.model.Positie;
import info.cafferata.alltrexx.model.Tracker;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface PositieRepository extends JpaRepository<Positie, Long> {

    /** Alle posities van een tracker, nieuwste eerst */
    List<Positie> findByTrackerOrderByTijdstipDesc(Tracker tracker);

    /** Alle posities (track-historie) van een tracker wissen; geeft het aantal terug */
    long deleteByTracker(Tracker tracker);

    /** Laatste bekende positie per tracker */
    Optional<Positie> findTopByTrackerOrderByTijdstipDesc(Tracker tracker);

    /** Posities binnen een tijdvenster */
    List<Positie> findByTrackerAndTijdstipBetweenOrderByTijdstip(
        Tracker tracker, LocalDateTime van, LocalDateTime tot);

    /**
     * Alle laatste posities van actieve trackers (live kaart).
     * Native query met een niet-gecorreleerde JOIN (i.p.v. een per-rij DEPENDENT
     * SUBQUERY) — bij groei van de posities-tabel (100k+ rijen) werd de oude
     * gecorreleerde-subquery-variant onbruikbaar traag (bleef hangen, zie #14).
     * Deze GROUP BY + JOIN-vorm gebruikt idx_tracker_tijd efficiënt en blijft
     * ook bij veel data snel.
     */
    @Query(value = """
        SELECT p.* FROM posities p
        INNER JOIN (
            SELECT tracker_id, MAX(tijdstip) AS max_tijdstip
            FROM posities
            GROUP BY tracker_id
        ) laatste ON laatste.tracker_id = p.tracker_id AND laatste.max_tijdstip = p.tijdstip
        INNER JOIN trackers t ON t.id = p.tracker_id
        WHERE t.actief = true
    """, nativeQuery = true)
    List<Positie> findLaatstePositiesActieveTrackers();

    /** Laatste posities per tracker type — zelfde niet-gecorreleerde JOIN-vorm. */
    @Query(value = """
        SELECT p.* FROM posities p
        INNER JOIN (
            SELECT tracker_id, MAX(tijdstip) AS max_tijdstip
            FROM posities
            GROUP BY tracker_id
        ) laatste ON laatste.tracker_id = p.tracker_id AND laatste.max_tijdstip = p.tijdstip
        INNER JOIN trackers t ON t.id = p.tracker_id
        WHERE t.actief = true AND t.type = :type
    """, nativeQuery = true)
    List<Positie> findLaatstePositiesPerType(@Param("type") String type);

    /** Route van de afgelopen X uur */
    @Query("""
        SELECT p FROM Positie p
        WHERE p.tracker.id = :trackerId
        AND p.tijdstip >= :vanaf
        ORDER BY p.tijdstip ASC
    """)
    List<Positie> findRoute(@Param("trackerId") Long trackerId,
                            @Param("vanaf") LocalDateTime vanaf);

    /** Laatste update + aantal posities per bron (AISHUB, KPLER, APP, ...) */
    @Query("""
        SELECT p.bron AS bron, MAX(p.tijdstip) AS laatste, COUNT(p) AS aantal
        FROM Positie p
        WHERE p.bron IS NOT NULL
        GROUP BY p.bron
    """)
    List<BronStatus> findLaatsteUpdatePerBron();

    /** Projectie voor de bron-status (laatste update per databron) */
    interface BronStatus {
        String getBron();
        LocalDateTime getLaatste();
        long getAantal();
    }
}
