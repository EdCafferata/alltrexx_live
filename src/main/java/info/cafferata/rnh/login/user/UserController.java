package login.user;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;
import java.util.Optional;

@RequiredArgsConstructor // Lombok to create the Required Args Constructor
@CrossOrigin(origins = "http://localhost:3000", maxAge = 3600) // Cross origin allowed for port 3000
@RestController // Instruct Spring Boot that this is the REST Controller
@RequestMapping("/api/users") // Link to access GET/POST/PUT/DELETE requests
public class UserController {

    // Import Methods from other Class
    private final UserService userService; // Class from which methods are being imported

    // Get all users
    @GetMapping // GET request handler
    @PreAuthorize("hasRole('ADMIN')") // Access granted for Admin Role
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }

    // Get user by ID
    @GetMapping("/{id}") // GET request handler by ID
    @PreAuthorize("hasRole('USER') or hasRole('SCHIPPER') or hasRole('ADMIN')") // Access granted for all roles
    public Optional<User> getUserById(@PathVariable Long id) {
        return userService.getUserById(id);
    }

    // Update user
    @PutMapping // PUT request handler
    @PreAuthorize("hasRole('ADMIN')") // Access granted for Admin Role
    public void updateUser(@Valid @RequestBody User user) {
        userService.updateUser(user);
    }

    // Delete user
    @DeleteMapping("/{id}") // DELETE request handler by ID
    @PreAuthorize("hasRole('ADMIN')") // Access granted for Admin Role
    public void deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
    }

}
