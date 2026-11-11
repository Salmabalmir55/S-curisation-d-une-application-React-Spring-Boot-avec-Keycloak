package ma.formation.demandesapi;

import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicLong;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class DemandeController {
    public record Demande(long id, String owner, String username, String objet, String statut) {}
    public record NouvelleDemande(@NotBlank String objet) {}
    public record StatutDemande(@NotBlank String statut) {}

    private final AtomicLong sequence = new AtomicLong();
    private final List<Demande> demandes = new CopyOnWriteArrayList<>();

    @GetMapping("/api/public")
    public Map<String, String> publicApi() {
        return Map.of("message", "API publique accessible");
    }

    @GetMapping("/api/profil")
    public Map<String, String> profil(@AuthenticationPrincipal Jwt jwt) {
        return Map.of("id", jwt.getSubject(), "username", username(jwt));
    }

    @GetMapping("/api/demandes")
    public List<Demande> mesDemandes(@AuthenticationPrincipal Jwt jwt) {
        return demandes.stream().filter(d -> d.owner().equals(jwt.getSubject())).toList();
    }

    @PostMapping("/api/demandes")
    public Demande creer(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody NouvelleDemande nouvelle) {
        String objet = nouvelle.objet().trim();
        if (objet.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "L'objet est obligatoire");
        }
        Demande demande = new Demande(sequence.incrementAndGet(), jwt.getSubject(), username(jwt), objet, "EN_ATTENTE");
        demandes.add(demande);
        return demande;
    }

    @GetMapping("/api/admin/demandes")
    public List<Demande> toutesLesDemandes() {
        return List.copyOf(demandes);
    }

    @PatchMapping("/api/admin/demandes/{id}")
    public Demande changerStatut(@PathVariable long id, @Valid @RequestBody StatutDemande body) {
        if (!List.of("VALIDEE", "REFUSEE").contains(body.statut())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Statut invalide");
        }
        for (Demande demande : demandes) {
            if (demande.id() == id) {
                Demande modifiee = new Demande(demande.id(), demande.owner(), demande.username(), demande.objet(), body.statut());
                demandes.remove(demande);
                demandes.add(modifiee);
                return modifiee;
            }
        }
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Demande introuvable");
    }

    private String username(Jwt jwt) {
        String username = jwt.getClaimAsString("preferred_username");
        return username == null || username.isBlank() ? jwt.getSubject() : username;
    }
}
