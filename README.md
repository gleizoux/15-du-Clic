# Le 15 du Clic

Petite app pour signaler un problème matériel (panne, bug, lenteur,
dégradation) sur un poste, un vidéoprojecteur ou le son d'une salle, à partir
des plans de salle réels du lycée. Hébergée entièrement sur Cloudflare
(Worker avec assets statiques + base de données D1), rien n'est hébergé en
local.

## Mise en route (une seule fois)

1. **Le projet Cloudflare** est déjà créé et connecté au dépôt GitHub
   `15-du-Clic` : chaque `git push` sur la branche principale redéploie
   automatiquement le site (build via `wrangler deploy`, config dans
   `wrangler.jsonc`).

2. **La base D1** (`le_15_du_clic_db`) est déjà créée et déclarée dans
   `wrangler.jsonc`. Il faut juste y initialiser le schéma une fois (depuis un
   terminal, avec `wrangler` installé et connecté au compte Cloudflare) :
   ```
   npx wrangler d1 execute le_15_du_clic_db --remote --file=schema/schema.sql
   ```

3. **Définir le mot de passe admin** : dans le tableau de bord Cloudflare,
   ouvrir le Worker `15-du-clic` → Settings → Variables and Secrets → ajouter
   une variable **`ADMIN_PASSWORD`** (type "Secret") avec le mot de passe
   partagé donné à vous et votre collègue pour accéder à `/admin.html`.

Pas de photo dans cette première version (pour rester 100% gratuit, sans
carte bancaire à fournir pour du stockage R2) — à revoir plus tard si besoin.

## Utilisation

- **`/`** : l'app pour signaler un problème (choix de la salle, clic sur le
  poste/VPI/son concerné, prénom + type de problème + description). Un poste
  ayant un signalement non résolu apparaît en **rouge** sur le plan (et sur
  les boutons vidéoprojecteur/son) ; il redevient normal dès que
  l'admin marque le signalement comme "résolu". L'affichage se rafraîchit
  automatiquement toutes les 20 secondes.
- **`/admin.html`** : consultation des signalements (identifiant : nom
  d'utilisateur libre, mot de passe = `ADMIN_PASSWORD`). Filtrage par salle
  et par statut, changement de statut (nouveau / en cours / résolu).

## Données des plans de salle

`public/data/rooms.json` (salles informatiques avec plan de postes) et
`public/data/classic_rooms.json` (salles classiques avec juste un
vidéoprojecteur et/ou une sono) sont générés à partir des plans de salle et
de l'inventaire du parc informatique du lycée. Pour les régénérer après une
mise à jour des plans, il faudra redemander l'export.
