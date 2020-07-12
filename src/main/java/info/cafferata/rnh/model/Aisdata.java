package model;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.ManyToOne;

@Entity
@Builder(toBuilder = true)
@Data
@AllArgsConstructor(access = AccessLevel.PACKAGE)
@NoArgsConstructor(access = AccessLevel.PACKAGE)
@Setter(value = AccessLevel.PACKAGE)
@Getter

public class Aisdata {
    @Id
    @GeneratedValue
    private Long id;
    private int aisnummer;
    private int course;
    private int heading;
    private String invoerder;
    private double lat;
    private double lon;
    private int schipid;
    private int speed;
    private int status;
    private String timestamp;

    @ManyToOne()
    private Schip schip;
    public Aisdata(int aisnummer, int course, int heading, String invoerder, double lat, double lon, int schipid, int speed, int status, String timestamp) {
        this.setAisnummer(aisnummer);
        this.setCourse(course);
        this.setHeading(heading);
        this.setInvoerder(invoerder);
        this.setLat(lat);
        this.setLon(lon);
        this.setSchipid(schipid);
        this.setSpeed(speed);
        this.setStatus(status);
        this.setTimestamp(timestamp);
    }
    private void setCourse(int course) {
    }
    private void setAisnummer(int aisnummer) {
    }
    private void setHeading(int heading) {
    }
    private void setInvoerder(String invoerder) {
    }
    private void setLat(double lat) {
    }
    private void setLon(double lon) {
    }
    private void setSchipid(int schipid) {
    }
    private void setSpeed(int speed) {
    }
    private void setStatus(int status) {
    }
    private void setTimestamp(String timestamp) {
    }
    public Aisdata(Long id) {
    }
}    
