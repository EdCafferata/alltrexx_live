package model;

import lombok.*;
import javax.persistence.*;
import java.util.List;

@Entity
@Builder(toBuilder = true)
@AllArgsConstructor(access = AccessLevel.PACKAGE)
@NoArgsConstructor(access = AccessLevel.PACKAGE)
@Setter(value = AccessLevel.PACKAGE)
@Getter
@SequenceGenerator(name = "bootCounter")
public class Schip {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "bootCounter")
    private Long id;
    private int aisnummer;
    private String klasse;
    private String naamschip;
    private String naamschipper;
    private String scheepstype;
    private double swrating;

    @OneToMany(mappedBy = "schip")
    private List<Aisdata> aisdatas;

    public Schip(int aisnummer, String klasse, String naamschip, String naamschipper, String scheepstype, double swrating) {
        this.aisnummer = aisnummer;
        this.klasse = klasse;
        this.naamschip = naamschip;
        this.naamschipper = naamschipper;
        this.scheepstype = scheepstype;
        this.swrating = swrating;
    }

    public Schip(Long id) {
    }
}
