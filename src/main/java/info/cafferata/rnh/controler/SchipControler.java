package controler;
import model.Schip;
import Repository.SchipRepository;
import org.springframework.web.bind.annotation.*;
import java.util.Optional;

@CrossOrigin(origins = "http://localhost:3000", maxAge = 3600) // Cross origin allowed for port 3000
@RestController
public class SchipControler {
    SchipRepository schips;
    public SchipControler(SchipRepository schips) {
        this.schips = schips;
    }
    //ophalen alle schips
    @GetMapping(value="/api/schips/")
    public Iterable<Schip> getSchips() {
        return schips.findAll();
    }
    //ophalen 1 schips
    @GetMapping(value = "/api/schip/{id}")
    public Schip getSchip(@PathVariable("id") Long id){
        Optional<Schip> _schip = schips.findById(id);
        return _schip.orElse(null);
    }
    //toevoegen schip
    @PostMapping(value = "/api/schip/")
    public Schip addSchips(@RequestParam("id") Long id){
        Schip schip = new Schip((long) Math.toIntExact(id));
        return schips.save(schip);
    }}
