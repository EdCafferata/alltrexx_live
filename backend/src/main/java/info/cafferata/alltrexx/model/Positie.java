package info.cafferata.alltrexx.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Een gemeten positie van een tracker op een bepaald tijdstip.
 * Bevat coördinaten, snelheid, koers en hoogte (voor vliegtuigen).
 */
@Entity
@Table(name = "posities", indexes = {
    @Index(name = "idx_tracker_tijd", columnList = "tracker_id, tijdstip"),
    @Index(name = "idx_tijdstip",     columnList = "tijdstip")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Positie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tracker_id", nullable = false)
    private Tracker tracker;

    /** Breedtegraad */
    @Column(nullable = false)
    private double lat;

    /** Lengtegraad */
    @Column(nullable = false)
    private double lon;

    /** Snelheid in km/u (of knopen voor boten) */
    private double snelheid;

    /** Koers in graden (0-360) */
    private double koers;

    /** Hoogte in meters (relevant voor vliegtuigen) */
    private double hoogte;

    /** Tijdstip van de meting */
    @Column(nullable = false)
    private LocalDateTime tijdstip;

    /** Bron van de data: "APP", "MARINETRAFFIC", "MANUAL", etc. */
    private String bron;

    /** Ruwe JSON van de externe API (voor debug / herverwerking) */
    @Column(columnDefinition = "TEXT")
    private String rawData;
}
