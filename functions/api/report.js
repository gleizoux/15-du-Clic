// POST /api/report — signalement d'un incident (public, aucune auth requise :
// c'est l'endpoint que les collègues utilisent depuis l'app).
export async function onRequestPost(context) {
  const { request, env } = context;

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
  const photo = form.get("photo");

  if (!salle || !poste || !prenom || !type) {
    return new Response("Champs obligatoires manquants", { status: 400 });
  }

  let photoKey = null;
  if (photo && typeof photo === "object" && photo.size > 0) {
    if (photo.size > 8 * 1024 * 1024) {
      return new Response("Photo trop volumineuse (8 Mo max)", { status: 400 });
    }
    photoKey = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${photo.name || "photo.jpg"}`;
    await env.PHOTOS.put(photoKey, await photo.arrayBuffer(), {
      httpMetadata: { contentType: photo.type || "image/jpeg" },
    });
  }

  await env.DB.prepare(
    `INSERT INTO reports (salle, poste, prenom, type, description, photo_key)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(salle, poste, prenom, type, description, photoKey).run();

  return new Response("OK", { status: 201 });
}
