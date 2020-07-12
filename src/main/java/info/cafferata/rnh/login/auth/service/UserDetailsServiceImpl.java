package login.auth.service;

import login.user.User;
import login.user.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service // Instruct Spring Boot that this is the Service layer
public class UserDetailsServiceImpl implements UserDetailsService {

    // Import Methods from other Class
    public final UserRepository userRepository; // Call UserService method(s)

    // Make methods accessible via this constructor
    public UserDetailsServiceImpl() {
        userRepository = null;
    }

    @Override // Override functions/methods
    @Transactional // Execute transaction methods without stating them
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException { // Call function loadUserByUsername
        assert userRepository != null;
        User user = userRepository.getUserByUsername(username) // Execute method getUserByUsername from UserRepository.java
                .orElseThrow(() -> new UsernameNotFoundException("User Not Found with username: " + username)); // User not found exception handling

        return UserDetailsImpl.build(user); // Return user
    }
}
