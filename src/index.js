// Worker unique : sert les fichiers statiques (public/) et gère les routes
// /api/* pour "Le 15 du Clic". Format "Workers avec assets" (et non l'ancien
// modèle Pages + dossier functions/).

function checkAuth(request, env) {
  const auth = request.headers.get("Authorization") || "";
  if (auth.startsWith("Basic ")) {
    try {
      const decoded = atob(auth.slice(6));
      const password = decoded.slice(decoded.indexOf(":") + 1);
      if (password === env.ADMIN_PASSWORD) return null;
    } catch (e) {
      // identifiants mal formés -> refusé ci-dessous
    }
  }
  // Pas de WWW-Authenticate ici : on ne veut jamais que le navigateur affiche
  // sa propre popup native, la page admin gère l'authentification elle-même
  // via un formulaire (fiable sur tous les navigateurs, y compris mobile).
  return new Response("Accès restreint", { status: 401 });
}

async function handleReportPost(request, env) {
  let form;
  try {
    form = await request.formData();
  } catch (e) {
    return new Response("Requête invalide", { status: 400 });
  }

  const salle = (form.get("salle") || "").toString().trim();
  const poste = (form.get("poste") || "").toString().trim();
  const prenom = (form.get("prenom") || "").toString().trim();
  const type = (form.get("type") || "").toString().trim();
  const description = (form.get("description") || "").toString().trim();

  if (!salle || !poste || !prenom || !type) {
    return new Response("Champs obligatoires manquants", { status: 400 });
  }

  await env.DB.prepare(
    `INSERT INTO reports (salle, poste, prenom, type, description)
     VALUES (?, ?, ?, ?, ?)`
  ).bind(salle, poste, prenom, type, description).run();

  return new Response("OK", { status: 201 });
}

async function handleReportsGet(request, env) {
  const denied = checkAuth(request, env);
  if (denied) return denied;

  const { results } = await env.DB.prepare(
    "SELECT id, salle, poste, prenom, type, description, statut, created_at FROM reports ORDER BY created_at DESC"
  ).all();

  return new Response(JSON.stringify(results), { headers: { "Content-Type": "application/json" } });
}

// Endpoint public (pas d'auth) : liste des postes ayant un signalement non
// résolu, pour que l'app affiche un repère visuel (rouge) sur le plan.
async function handleStatutsGet(request, env) {
  const { results } = await env.DB.prepare(
    "SELECT salle, poste, statut FROM reports WHERE statut != 'résolu'"
  ).all();

  return new Response(JSON.stringify(results), { headers: { "Content-Type": "application/json" } });
}

const STATUTS_VALIDES = ["nouveau", "en cours", "résolu"];

async function handleStatutPost(request, env, id) {
  const denied = checkAuth(request, env);
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  const statut = body && body.statut;
  if (!STATUTS_VALIDES.includes(statut)) {
    return new Response("Statut invalide", { status: 400 });
  }

  await env.DB.prepare("UPDATE reports SET statut = ? WHERE id = ?").bind(statut, id).run();
  return new Response("OK");
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (path === "/api/report" && method === "POST") {
      return handleReportPost(request, env);
    }
    if (path === "/api/reports" && method === "GET") {
      return handleReportsGet(request, env);
    }
    if (path === "/api/statuts" && method === "GET") {
      return handleStatutsGet(request, env);
    }
    // TEMPORAIRE (diagnostic) : ne révèle jamais la valeur, juste sa présence.
    if (path === "/api/debug-env" && method === "GET") {
      return new Response(JSON.stringify({
        present: typeof env.ADMIN_PASSWORD !== "undefined",
        length: (env.ADMIN_PASSWORD || "").length,
      }), { headers: { "Content-Type": "application/json" } });
    }
    const statutMatch = path.match(/^\/api\/report\/([^/]+)\/statut$/);
    if (statutMatch && method === "POST") {
      return handleStatutPost(request, env, statutMatch[1]);
    }

    // tout le reste : fichiers statiques (public/)
    return env.ASSETS.fetch(request);
  },
};
