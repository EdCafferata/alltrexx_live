package info.cafferata.alltrexx.repository;

import info.cafferata.alltrexx.model.Tracker;
import info.cafferata.alltrexx.model.TrackerType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface TrackerRepository extends JpaRepository<Tracker, Long> {
    List<Tracker> findByActief(boolean actief);
    List<Tracker> findByType(TrackerType type);
    List<Tracker> findByTypeAndActief(TrackerType type, boolean actief);
    Optional<Tracker> findByExterneId(String externeId);
}
