package info.cafferata.alltrexx.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Een tracker-object: boot, fiets, auto, vliegtuig of persoon.
 * Heeft een naam, type en optioneel een externe ID (bijv. MMSI voor boten).
 */
@Entity
@Table(name = "trackers")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Tracker {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String naam;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private TrackerType type;

    /** Externe ID — MMSI/AIS-nummer voor boten, vluchtnummer voor vliegtuigen, etc. */
    private String externeId;

    /** Bootnaam — afkomstig van MarineTraffic (SHIPNAME); kan afwijken van 'naam'. */
    private String bootnaam;

    /** Schipper — handmatig of via de RNH/mobile-app ingevoerd (niet van MarineTraffic). */
    private String schipper;

    /** Omschrijving / extra info */
    private String omschrijving;

    /** URL naar een afbeelding van de tracker */
    private String afbeeldingUrl;

    private boolean actief = true;

    @Column(updatable = false)
    private LocalDateTime aangemaakt = LocalDateTime.now();
}
