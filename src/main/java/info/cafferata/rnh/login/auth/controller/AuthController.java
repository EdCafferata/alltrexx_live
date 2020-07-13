package login.auth.controller;

import lombok.RequiredArgsConstructor;
import login.auth.payload.request.LoginRequest;
import login.auth.payload.request.RegisterRequest;
import login.auth.payload.response.JwtResponse;
import login.auth.payload.response.MessageResponse;
import login.auth.security.jwt.JwtUtils;
import login.auth.service.UserDetailsImpl;
import login.role.ERole;
import login.role.Role;
import login.role.RoleRepository;
import login.user.User;
import login.user.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RequiredArgsConstructor // Lombok to create the Required Args Constructor
@CrossOrigin(origins = "http://localhost:3000", maxAge = 3600) // Cross origin allowed for port 3000
@RestController // Instruct Spring Boot that this is the REST Controller
@RequestMapping("/api/auth") // Link to access GET/POST/PUT/DELETE requests
public class AuthController {

    // Import Methods from other Class
    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder encoder;
    private final JwtUtils jwtUtils;

    @PostMapping("/login") // Handle HTTP POST login request
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) { // Handle login

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword())); // Authenticate username and password

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication); // Generate JWT token

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        List<String> roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        return ResponseEntity.ok(new JwtResponse(jwt,
                userDetails.getId(),
                userDetails.getUsername(),
                userDetails.getEmail(),
                roles));
    }

    @PostMapping("/register") // Handle HTTP POST register request
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest registerRequest) { // Handle registration
        if (userRepository.existsByUsername(registerRequest.getUsername())) { // Check if username already exists in the database
            return ResponseEntity
                    .badRequest() // If username already exists
                    .body(new MessageResponse("Error: Username is already taken!")); // Return message
        } // Else continue

        if (userRepository.existsByEmail(registerRequest.getEmail())) { // Check if email address already exists in the database
            return ResponseEntity
                    .badRequest() // If email address already exists
                    .body(new MessageResponse("Error: Email is already in use!")); // Return message
        } // Else continue

        // Create new user's account
        User user = new User(registerRequest.getUsername(),// Get provided username
                registerRequest.getEmail(), // Get provided email address
                encoder.encode(registerRequest.getPassword())); // Get provided password

        Set<String> strRoles = registerRequest.getRole(); // Set role
        Set<Role> roles = new HashSet<>(); // Assign role

        if (strRoles == null) { // When no role
            Role userRole = roleRepository.getRoleByName(ERole.ROLE_USER) // Find role USER
                    .orElseThrow(() -> new RuntimeException("Error: Role is not found.")); // Else error
            roles.add(userRole); // Assign role USER
        } else {
            strRoles.forEach(role -> {
                switch (role) {
                    case "admin":
                        Role adminRole = roleRepository.getRoleByName(ERole.ROLE_ADMIN)
                                .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
                        roles.add(adminRole);

                        break;
                    case "mod":
                        Role modRole = roleRepository.getRoleByName(ERole.ROLE_SCHIPPER)
                                .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
                        roles.add(modRole);

                        break;
                    default:
                        Role userRole = roleRepository.getRoleByName(ERole.ROLE_USER)
                                .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
                        roles.add(userRole);
                }
            });
        }

        user.setRoles(roles); // Set role
        userRepository.save(user); // Save user to database via UserRepository.java function

        return ResponseEntity.ok(new MessageResponse("User registered successfully!")); // Return registered successfully message
    }

}