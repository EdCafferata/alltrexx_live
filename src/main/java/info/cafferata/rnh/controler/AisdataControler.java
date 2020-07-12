package controler;
import model.Aisdata;
import Repository.AisdataRepository;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import java.util.Optional;

@CrossOrigin(origins = "http://localhost:3000", maxAge = 3600) // Cross origin allowed for port 3000
@RestController
public class AisdataControler {

    AisdataRepository aisdatas;
    public AisdataControler(AisdataRepository aisdatas) {
        this.aisdatas = aisdatas;
    }
    //ophalen alle aisdata
    @RequestMapping(path="/api/aisdatas/")
    public Iterable<Aisdata> getAisDatas() {
        return aisdatas.findAll();
    }
    //ophalen 1 aisdata
    @RequestMapping(path = "/api/aisdatas/{id}")
    public Aisdata getAisData(@PathVariable("id") Long id){
        Optional<Aisdata> _aisdata = aisdatas.findById(id);
        return _aisdata.orElse(null);
    }
    //toevoegen aisdata
    @RequestMapping(path = "/api/aisdatas/")
    public Aisdata addAisDatas(@RequestParam("id") Long id){
        Aisdata aisdata = new Aisdata(id);
        return aisdatas.save(aisdata);
    }
}
