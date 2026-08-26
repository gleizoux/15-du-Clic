# Le 15 du Clic

Petite app pour signaler un problème matériel (panne, bug, lenteur,
dégradation) sur un poste, un vidéoprojecteur ou le son d'une salle, à partir
des plans de salle réels du lycée. Hébergée entièrement sur Cloudflare Pages
(front-end statique + fonctions serverless + base de données), rien n'est
hébergé en local.

## Mise en route (une seule fois, depuis le tableau de bord Cloudflare)

1. **Créer le projet Pages** : Workers & Pages → Create → Pages → connecter
   le dépôt GitHub `15-du-Clic`. Dossier de sortie (build output) :
   `public`. Pas de commande de build nécessaire (site 100% statique côté
   front, les fonctions sont dans `functions/`).

2. **Créer la base D1** : Workers & Pages → D1 → Create database (ex. nom
   `le15duclic-db`). Puis, dans les paramètres du projet Pages → Functions →
   D1 database bindings : ajouter une liaison nommée **`DB`** pointant vers
   cette base.

   Initialiser le schéma (depuis un terminal, une fois `wrangler` installé
   et connecté à votre compte) :
   ```
   npx wrangler d1 execute le15duclic-db --remote --file=schema/schema.sql
   ```

3. **Créer le bucket R2** (pour les photos) : Workers & Pages → R2 → Create
   bucket (ex. nom `le15duclic-photos`). Puis, dans les paramètres du projet
   Pages → Functions → R2 bucket bindings : ajouter une liaison nommée
   **`PHOTOS`** pointant vers ce bucket.

4. **Définir le mot de passe admin** : Paramètres du projet Pages →
   Environment variables → ajouter une variable **`ADMIN_PASSWORD`** (cocher
   "Encrypt"/secret) avec le mot de passe partagé que vous donnerez à votre
   collègue et vous-même pour accéder à `/admin.html`.

5. Chaque `git push` sur la branche principale redéploie automatiquement le
   site.

## Utilisation

- **`/`** : l'app pour signaler un problème (choix de la salle, clic sur le
  poste/VPI/son concerné, prénom + type de problème + description + photo
  facultative).
- **`/admin.html`** : consultation des signalements (identifiant : nom
  d'utilisateur libre, mot de passe = `ADMIN_PASSWORD`). Filtrage par salle
  et par statut, changement de statut (nouveau / en cours / résolu).

## Données des plans de salle

`public/data/rooms.json` (salles informatiques avec plan de postes) et
`public/data/classic_rooms.json` (salles classiques avec juste un
vidéoprojecteur et/ou une sono) sont générés à partir des plans de salle et
de l'inventaire du parc informatique du lycée. Pour les régénérer après une
mise à jour des plans, il faudra redemander l'export.
