package login.auth.security.jwt;

import login.auth.service.UserDetailsServiceImpl;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

@Component // Instruct Spring Boot to containerize data
public class AuthTokenFilter extends OncePerRequestFilter {

    // Import Methods from other Class
    @Autowired
    private JwtUtils jwtUtils;

    // Import Methods from other Class
    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    private static final Logger logger = LoggerFactory.getLogger(AuthTokenFilter.class); // Build logging messages (such as errors)

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) // Handle HTTP request and start the chain
            throws ServletException, IOException {
        try {
            String jwt = parseJwt(request); // Assign JSON WebToken to variable jwt
            if (jwt != null && jwtUtils.validateJwtToken(jwt)) { // If JWT provided, start validation
                String username = jwtUtils.getUserNameFromJwtToken(jwt); // Get username provided with JWT

                UserDetails userDetails = userDetailsService.loadUserByUsername(username); // Load username
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken( // Authenticate username and password
                        userDetails, null, userDetails.getAuthorities()); // Get user authorities
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request)); // Authenticate details from request

                SecurityContextHolder.getContext().setAuthentication(authentication); // Authenticate
            }
        } catch (Exception e) {
            logger.error("Cannot set user authentication: {user}", e); // Authentication failed error
        }

        filterChain.doFilter(request, response); // Continue the filter chain
    }

    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization"); // Get header from request

        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) { // Header contains text with Prefix Bearer
            return headerAuth.substring(7); // Remove prefix Bearer and return JSON WebToken only
        }

        return null; // Else return null
    }
}
