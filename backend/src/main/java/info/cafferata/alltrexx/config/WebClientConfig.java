package info.cafferata.alltrexx.config;

import io.netty.channel.ChannelOption;
import io.netty.handler.timeout.ReadTimeoutHandler;
import io.netty.handler.timeout.WriteTimeoutHandler;
import org.springframework.boot.web.reactive.function.client.WebClientCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

/**
 * Harde time-outs op ALLE WebClient-calls (schedulers + services).
 *
 * <p>Waarom: zonder dit heeft de auto-geconfigureerde WebClient GEEN response-timeout.
 * Een externe bron die de verbinding opent maar niet (volledig) antwoordt — zoals adsb.lol
 * op 29 sep 2026 — laat {@code .block()} voor eeuwig wachten. Omdat alle {@code @Scheduled}-
 * taken standaard op één scheduler-thread draaien, bevriest dat meteen ÁLLE feeds (boten,
 * vliegtuigen, enz.). Zie ook {@link SchedulingConfig} (multi-thread als extra vangnet).
 *
 * <p>Dekking: connect-timeout (verbinding opzetten), responseTimeout (eerste byte van de
 * respons), en read/write-handlers (stilgevallen socket midden in de respons).
 */
@Configuration
public class WebClientConfig {

    private static final int CONNECT_TIMEOUT_MS = 10_000;
    private static final Duration RESPONSE_TIMEOUT = Duration.ofSeconds(15);
    private static final int READ_WRITE_TIMEOUT_S = 20;

    @Bean
    public WebClientCustomizer timeoutWebClientCustomizer() {
        HttpClient httpClient = HttpClient.create()
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, CONNECT_TIMEOUT_MS)
                .responseTimeout(RESPONSE_TIMEOUT)
                .doOnConnected(conn -> conn
                        .addHandlerLast(new ReadTimeoutHandler(READ_WRITE_TIMEOUT_S, TimeUnit.SECONDS))
                        .addHandlerLast(new WriteTimeoutHandler(READ_WRITE_TIMEOUT_S, TimeUnit.SECONDS)));

        return builder -> builder.clientConnector(new ReactorClientHttpConnector(httpClient));
    }
}
