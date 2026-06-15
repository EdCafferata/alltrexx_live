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

    /** Laatste bekende positie per tracker */
    Optional<Positie> findTopByTrackerOrderByTijdstipDesc(Tracker tracker);

    /** Posities binnen een tijdvenster */
    List<Positie> findByTrackerAndTijdstipBetweenOrderByTijdstip(
        Tracker tracker, LocalDateTime van, LocalDateTime tot);

    /** Alle laatste posities van actieve trackers (live kaart) */
    @Query("""
        SELECT p FROM Positie p
        WHERE p.tijdstip = (
            SELECT MAX(p2.tijdstip) FROM Positie p2
            WHERE p2.tracker = p.tracker
        )
        AND p.tracker.actief = true
    """)
    List<Positie> findLaatstePositiesActieveTrackers();

    /** Laatste posities per tracker type */
    @Query("""
        SELECT p FROM Positie p
        WHERE p.tijdstip = (
            SELECT MAX(p2.tijdstip) FROM Positie p2
            WHERE p2.tracker = p.tracker
        )
        AND p.tracker.actief = true
        AND p.tracker.type = :type
    """)
    List<Positie> findLaatstePositiesPerType(@Param("type") info.cafferata.alltrexx.model.TrackerType type);

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
