package info.cafferata.alltrexx.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Een melding (report) van een aanstootgevende tracker-naam op de publieke kaart.
 * Hiermee kunnen bezoekers de enige user-generated content (de zelfgekozen
 * tracker-naam) rapporteren, zoals App Store Guideline 1.2 vereist. Bij genoeg
 * openstaande meldingen maskeert de kaart de naam automatisch (zie TrackerService),
 * en een beheerder kan de tracker beoordelen/verwijderen (MeldController / AdminController).
 */
@Entity
@Table(name = "meldingen")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Melding {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Welke tracker gemeld wordt (verwijst naar trackers.id). */
    @Column(nullable = false)
    private Long trackerId;

    /** Optionele reden/toelichting van de melder. */
    @Column(length = 500)
    private String reden;

    /** Client-IP van de melder (voor rate-limiting / misbruikdetectie). */
    private String ip;

    /** Door een beheerder afgehandeld (beoordeeld of verwijderd). */
    @Builder.Default
    private boolean afgehandeld = false;

    @Column(updatable = false)
    @Builder.Default
    private LocalDateTime tijdstip = LocalDateTime.now();
}
