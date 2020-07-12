package controler;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMapping;

@CrossOrigin(origins = "http://localhost:3000", maxAge = 3600) // Cross origin allowed for port 3000
@Controller
public class HomeController {
    @RequestMapping(value = "/")
    public String index() {

        return "index";
    }
}
