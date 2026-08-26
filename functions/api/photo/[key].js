// GET /api/photo/:key — sert une photo stockée dans R2 (protégé).
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
  const { request, env, params } = context;
  const denied = checkAuth(request, env);
  if (denied) return denied;

  const object = await env.PHOTOS.get(params.key);
  if (!object) return new Response("Introuvable", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("Cache-Control", "private, max-age=600");
  return new Response(object.body, { headers });
}
