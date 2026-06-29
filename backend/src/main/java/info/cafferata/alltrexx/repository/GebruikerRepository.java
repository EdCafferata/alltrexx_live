package info.cafferata.alltrexx.repository;

import info.cafferata.alltrexx.model.Gebruiker;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface GebruikerRepository extends JpaRepository<Gebruiker, Long> {
    Optional<Gebruiker> findByExterneId(String externeId);
}
