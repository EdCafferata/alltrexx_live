package login.auth.security.jwt;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

@Component // Instruct Spring Boot to containerize data
public class AuthEntryPointJwt implements AuthenticationEntryPoint {

    private static final Logger logger = LoggerFactory.getLogger(AuthEntryPointJwt.class); // Log message(s) (such as errors)

    @Override // Unauthorized HTTP request handler
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException) throws IOException {
        logger.error("Unauthorized error: {}", authException.getMessage()); // Return unauthorized message

        // Error message status 401 code
        response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Error: Invalid credentials");
    }
}
