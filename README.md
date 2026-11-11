# Atelier OAuth 2.0 / OpenID Connect

Application locale de gestion des demandes : **React/Vite** (client OIDC public avec Authorization Code + PKCE), **Spring Boot** (API Resource Server JWT) et **Keycloak** (fournisseur OpenID Connect). Les demandes restent en mémoire et sont perdues au redémarrage de l'API, comme demandé dans l'atelier.

## Prérequis

- Docker Desktop avec Compose
- Java 17 ou 21 et Maven 3.9+ (ou Maven Wrapper)
- Node.js 20+ et npm
- Navigateur moderne

## Démarrage

Depuis le dossier `atelier-oauth2` :

1. Lancer Keycloak : `docker compose up -d`.
2. Attendre que Keycloak soit prêt sur <http://localhost:8082> (premier démarrage parfois lent). L'import crée automatiquement le realm `enset-realm`, le client `react-client`, les rôles et les comptes du TP.
3. Dans un terminal : `cd demandes-api` puis `mvn spring-boot:run`.
4. Dans un autre terminal : `cd demandes-front`, `npm install`, puis `npm run dev`.
5. Ouvrir <http://localhost:5173>. Keycloak redirige vers l'écran de connexion.

### Comptes de démonstration

| Login | Mot de passe | Rôles |
| --- | --- | --- |
| `alice` | `alice123` | USER |
| `bob` | `bob123` | USER, ADMIN |

Console d'administration locale : <http://localhost:8082/admin> (`admin` / `admin`). Identifiants réservés à cet atelier local.

## Endpoints

| Méthode | Endpoint | Accès |
| --- | --- | --- |
| GET | `/api/public` | Public |
| GET | `/api/profil` | USER ou ADMIN |
| GET | `/api/demandes` | USER ou ADMIN, demandes du propriétaire connecté |
| POST | `/api/demandes` | USER ou ADMIN, création au nom du compte connecté |
| GET | `/api/admin/demandes` | ADMIN, toutes les demandes |
| PATCH | `/api/admin/demandes/{id}` | ADMIN, statuts `VALIDEE` ou `REFUSEE` |

Les rôles sont lus depuis `realm_access.roles` du JWT Keycloak et convertis en autorités Spring `ROLE_USER` et `ROLE_ADMIN`. Le contrôle d'accès est effectué côté API, même si le panneau d'administration est masqué dans React. CORS n'autorise que `http://localhost:5173`.

## Vérification manuelle

1. Se connecter comme Alice : créer une demande et vérifier qu'elle apparaît dans « Mes demandes », sans panneau Administration.
2. Se connecter comme Bob : vérifier l'accès au panneau et à toutes les demandes; valider ou refuser une demande.
3. Appeler `GET http://localhost:8081/api/demandes` sans jeton : réponse 401.
4. Appeler `GET http://localhost:8081/api/admin/demandes` avec le jeton d'Alice : réponse 403; avec celui de Bob : réponse 200.
5. Envoyer un jeton modifié/invalide : réponse 401.

## Configuration Keycloak

Le realm est importé au premier démarrage dans `keycloak/realm/enset-realm-realm.json`. Le client est public, le flux standard est activé, les flux implicite et mot de passe sont désactivés, PKCE utilise S256 et les URI de redirection/origines sont limitées à localhost. Pour repartir de zéro après modification du realm, arrêter les services et supprimer le volume avec `docker compose down -v` (cela efface les données locales Keycloak).

## Structure

```text
atelier-oauth2/
├── docker-compose.yml
├── keycloak/realm/enset-realm-realm.json
├── demandes-api/       # Spring Boot 3.5, Spring Security Resource Server
└── demandes-front/     # React + Vite + keycloak-js
```

> Les mots de passe et l'administrateur ci-dessus sont uniquement pour un environnement de TP. Ne réutilisez pas ces paramètres pour un déploiement public.
