// GET /api/reports — liste des signalements (protégé par mot de passe partagé).
function checkAuth(request, env) {
  const auth = request.headers.get("Authorization") || "";
  const expected = "Basic " + btoa(`admin:${env.ADMIN_PASSWORD}`);
  if (auth !== expected) {
    return new Response("Accès restreint", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Le 15 du Clic - admin"' },
    });
  }
  return null;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const denied = checkAuth(request, env);
  if (denied) return denied;

  const { results } = await env.DB.prepare(
    "SELECT id, salle, poste, prenom, type, description, photo_key, statut, created_at FROM reports ORDER BY created_at DESC"
  ).all();

  return new Response(JSON.stringify(results), {
    headers: { "Content-Type": "application/json" },
  });
}
