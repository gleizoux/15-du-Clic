// POST /api/report/:id/statut — met à jour le statut d'un signalement (protégé).
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

const STATUTS_VALIDES = ["nouveau", "en cours", "résolu"];

export async function onRequestPost(context) {
  const { request, env, params } = context;
  const denied = checkAuth(request, env);
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  const statut = body && body.statut;
  if (!STATUTS_VALIDES.includes(statut)) {
    return new Response("Statut invalide", { status: 400 });
  }

  await env.DB.prepare("UPDATE reports SET statut = ? WHERE id = ?").bind(statut, params.id).run();
  return new Response("OK");
}
