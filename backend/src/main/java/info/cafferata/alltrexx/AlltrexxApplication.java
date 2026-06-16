package info.cafferata.alltrexx;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.TimeZone;

@SpringBootApplication
@EnableScheduling
public class AlltrexxApplication {
    public static void main(String[] args) {
        // Vaste NL-tijdzone in de jar zelf → LocalDateTime.now() = CEST/CET, ongeacht
        // of de container-env (TZ) wel/niet wordt herladen door Container Manager.
        TimeZone.setDefault(TimeZone.getTimeZone("Europe/Amsterdam"));
        SpringApplication.run(AlltrexxApplication.class, args);
    }
}
