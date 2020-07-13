package login.auth.security.jwt;

import login.auth.service.UserDetailsImpl;
import io.jsonwebtoken.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.util.Date;

@Component // Instruct Spring Boot to containerize data
public class JwtUtils {

    private static final Logger logger = LoggerFactory.getLogger(JwtUtils.class); // Build logging messages (such as errors)

    @Value("${cafferata.jwtSecret}") // Call JWT Secret Key from application.properties
    private String jwtSecret;

    @Value("${cafferata.jwtExpirationMs}") // Call JWT Expiration time from application.properties
    private int jwtExpirationMs;

    public String generateJwtToken(Authentication authentication) { // Generate JSON WebToken

        UserDetailsImpl userPrincipal = (UserDetailsImpl) authentication.getPrincipal();

        return Jwts.builder() // Build JWT
                .setSubject((userPrincipal.getUsername())) // Get username
                .setIssuedAt(new Date()) // Set JWT issued date and time
                .setExpiration(new Date((new Date()).getTime() + jwtExpirationMs)) // Set JWT expiration date and time
                .signWith(SignatureAlgorithm.HS512, jwtSecret) // Hash JWT with HS512 algorithm and Code Network secret key
                .compact(); // Make string compact
    }

    public String getUserNameFromJwtToken(String token) {
        return Jwts.parser().setSigningKey(jwtSecret).parseClaimsJws(token).getBody().getSubject(); // Get subject, subject - username
    }

    public boolean validateJwtToken(String authToken) { // Validate JSON WebToken
        try {
            Jwts.parser().setSigningKey(jwtSecret).parseClaimsJws(authToken);
            return true;
        } catch (SignatureException e) {
            logger.error("Invalid JWT signature: {}", e.getMessage());
        } catch (MalformedJwtException e) {
            logger.error("Invalid JWT token: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            logger.error("JWT token is expired: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            logger.error("JWT token is unsupported: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            logger.error("JWT claims string is empty: {}", e.getMessage());
        }

        return false;
    }
}
