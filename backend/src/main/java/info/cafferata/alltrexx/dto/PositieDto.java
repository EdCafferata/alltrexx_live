package info.cafferata.alltrexx.dto;

import info.cafferata.alltrexx.model.Positie;
import info.cafferata.alltrexx.model.TrackerType;
import lombok.Data;
import java.time.LocalDateTime;

/** Lichtgewicht DTO voor de kaart — stuurt alleen wat de frontend nodig heeft */
@Data
public class PositieDto {
    private Long trackerId;
    private String trackerNaam;
    private TrackerType type;
    private String externeId;
    private double lat;
    private double lon;
    private double snelheid;
    private double koers;
    private double hoogte;
    private LocalDateTime tijdstip;

    public static PositieDto van(Positie p) {
        PositieDto dto = new PositieDto();
        dto.setTrackerId(p.getTracker().getId());
        dto.setTrackerNaam(p.getTracker().getNaam());
        dto.setType(p.getTracker().getType());
        dto.setExterneId(p.getTracker().getExterneId());
        dto.setLat(p.getLat());
        dto.setLon(p.getLon());
        dto.setSnelheid(p.getSnelheid());
        dto.setKoers(p.getKoers());
        dto.setHoogte(p.getHoogte());
        dto.setTijdstip(p.getTijdstip());
        return dto;
    }
}
