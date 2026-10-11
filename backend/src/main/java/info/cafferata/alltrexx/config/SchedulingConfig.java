package info.cafferata.alltrexx.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.SchedulingConfigurer;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.scheduling.config.ScheduledTaskRegistrar;

/**
 * Multi-threaded scheduler i.p.v. Spring's default single thread ({@code scheduling-1}).
 *
 * <p>Waarom: standaard draaien ALLE {@code @Scheduled}-taken (AISHub, ADS-B, Kpler,
 * MarineTraffic) op één thread. Als één taak lang blijft hangen (bv. een externe API die
 * niet antwoordt) komen de andere feeds ook stil te liggen — precies wat op 29 sep 2026
 * gebeurde. Met een pool van meerdere threads blokkeert één trage/hangende bron de rest
 * niet. Samen met de harde time-outs uit {@link WebClientConfig} kan een hangende call
 * bovendien niet eens meer voorkomen.
 */
@Configuration
public class SchedulingConfig implements SchedulingConfigurer {

    @Override
    public void configureTasks(ScheduledTaskRegistrar taskRegistrar) {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(4);
        scheduler.setThreadNamePrefix("alltrexx-sched-");
        scheduler.setWaitForTasksToCompleteOnShutdown(false);
        scheduler.setAwaitTerminationSeconds(20);
        scheduler.initialize();
        taskRegistrar.setTaskScheduler(scheduler);
    }
}
