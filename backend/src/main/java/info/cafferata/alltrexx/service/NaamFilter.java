package info.cafferata.alltrexx.service;

import org.springframework.stereotype.Component;

import java.text.Normalizer;
import java.util.Set;

/**
 * Eenvoudige inhoudsfilter voor door gebruikers gekozen tracker-namen
 * (App Store Guideline 1.2: objectionable content proactief filteren). Weigert
 * duidelijk aanstootgevende namen (scheldwoorden, haatzaaien, seksueel expliciet)
 * in NL + EN.
 *
 * Bewust conservatief om valse positieven (het "Scunthorpe-probleem") te vermijden:
 * - normaliseert diacritieken + simpele leetspeak,
 * - matcht primair op hele woord-tokens (exact), zodat onschuldige woorden die een
 *   verboden term als substring bevatten (bv. "therapist", "Lullaby", "negeren")
 *   NIET worden geweigerd,
 * - substring-matching alleen voor een korte lijst zeer herkenbare termen die vrijwel
 *   nooit binnen een onschuldig woord voorkomen (bv. aan elkaar geplakte invoer).
 */
@Component
public class NaamFilter {

    /** Exacte woord-tokens (na normalisatie). Veilig tegen valse positieven. */
    private static final Set<String> VERBODEN_TOKEN = Set.of(
        // scheldwoorden EN
        "fuck", "shit", "bitch", "asshole", "bastard", "cunt", "pussy", "dick",
        "cock", "whore", "slut", "rape", "rapist", "retard",
        // slurs EN
        "nigger", "nigga", "faggot", "fag", "kike", "spic", "chink",
        // scheldwoorden/slurs NL
        "kut", "lul", "hoer", "hoerenjong", "neuken", "klootzak", "teringlijer",
        "tyfus", "tering", "kanker", "mongool", "flikker", "nikker", "neger",
        "pedo", "pedofiel", "verkrachter",
        // extremisme
        "hitler", "nazi", "isis", "kkk"
    );

    /**
     * Zeer herkenbare termen waar ook substring-matching veilig is (vrijwel nooit
     * onderdeel van een onschuldig woord), om aan-elkaar-geplakte invoer te vangen
     * zoals "fuckyou" of "kankerhoer".
     */
    private static final Set<String> VERBODEN_SUBSTRING = Set.of(
        "fuck", "nigger", "nigga", "faggot", "motherfucker", "kanker",
        "verkrachting", "kinderporno", "childporn", "chingchong"
    );

    public boolean isToegestaan(String naam) {
        if (naam == null || naam.isBlank()) return true; // leeg → service kiest "Mijn tracker"
        String g = normaliseer(naam);
        if (g.isBlank()) return true;
        for (String token : g.split(" ")) {
            if (VERBODEN_TOKEN.contains(token)) return false;
        }
        String compact = g.replace(" ", "");
        for (String verboden : VERBODEN_SUBSTRING) {
            if (compact.contains(verboden)) return false;
        }
        return true;
    }

    private String normaliseer(String s) {
        String n = Normalizer.normalize(s, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .toLowerCase();
        n = n.replace('0', 'o').replace('1', 'i').replace('3', 'e')
             .replace('4', 'a').replace('5', 's').replace('7', 't')
             .replace('@', 'a').replace('$', 's');
        n = n.replaceAll("[^a-z]+", " ").trim();
        return n;
    }
}
