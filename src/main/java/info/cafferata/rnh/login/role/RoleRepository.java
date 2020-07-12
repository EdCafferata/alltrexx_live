package login.role;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository // Instruct Spring Boot that this is the Repository
public interface RoleRepository extends JpaRepository<Role, Integer> {

    Optional<Role> getRoleByName(ERole name); // Lookup provided role in the database
}
