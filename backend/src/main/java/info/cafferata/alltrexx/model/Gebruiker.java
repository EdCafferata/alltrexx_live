package info.cafferata.alltrexx.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Minimale serverkant van een gebruiker (privacy-by-design): alleen een opaak
 * CloudKit-account-ID + abonnementsstatus. Geen e-mail; naam is optioneel (label
 * voor het beheerscherm). De server bewaart verder geen persoonsgegevens.
 */
@Entity
@Table(name = "gebruikers")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Gebruiker {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Opaak CloudKit userRecordName — herkent het account zonder persoonsgegevens. */
    @Column(unique = true, nullable = false)
    private String externeId;

    /** Optioneel label voor het beheerscherm (kan null zijn). */
    private String naam;

    /** Abonnement: "FREE" (eigen data + logboek) of "PRO" (alle opties, onbeperkt). */
    @Builder.Default
    private String abonnement = "FREE";

    /** Beheerder (uit de inlog herkend); krijgt automatisch PRO. */
    @Builder.Default
    private boolean beheerder = false;

    @Column(updatable = false)
    @Builder.Default
    private LocalDateTime aangemaakt = LocalDateTime.now();

    private LocalDateTime laatsteLogin;
}
