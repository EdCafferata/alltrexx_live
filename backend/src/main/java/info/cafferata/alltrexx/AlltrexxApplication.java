package info.cafferata.alltrexx;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class AlltrexxApplication {
    public static void main(String[] args) {
        SpringApplication.run(AlltrexxApplication.class, args);
    }
}
