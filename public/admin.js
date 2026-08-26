let ALL = [];

function statutClass(s) {
  return "statut-" + s.replace(/\s+/g, "-").normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function fmtDate(iso) {
  try {
    return new Date(iso + "Z").toLocaleString("fr-FR");
  } catch (e) { return iso; }
}

async function changerStatut(id, statut) {
  const res = await fetch(`/api/report/${id}/statut`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ statut }),
  });
  if (!res.ok) alert("Échec de la mise à jour du statut.");
}

function render() {
  const fSalle = document.getElementById("f-salle").value;
  const fStatut = document.getElementById("f-statut").value;
  const rows = ALL.filter(r => (!fSalle || r.salle === fSalle) && (!fStatut || r.statut === fStatut));

  if (rows.length === 0) {
    document.getElementById("table-wrap").innerHTML = "<p>Aucun signalement.</p>";
    return;
  }

  let html = "<table><thead><tr>" +
    "<th>Date</th><th>Salle</th><th>Poste</th><th>Prénom</th><th>Type</th><th>Description</th><th>Photo</th><th>Statut</th>" +
    "</tr></thead><tbody>";

  for (const r of rows) {
    html += `<tr class="${statutClass(r.statut)}">` +
      `<td>${fmtDate(r.created_at)}</td>` +
      `<td>${r.salle}</td>` +
      `<td>${r.poste}</td>` +
      `<td>${r.prenom || ""}</td>` +
      `<td>${r.type}</td>` +
      `<td>${(r.description || "").replace(/</g, "&lt;")}</td>` +
      `<td>${r.photo_key ? `<a class="photo-link" target="_blank" href="/api/photo/${encodeURIComponent(r.photo_key)}">Voir</a>` : "—"}</td>` +
      `<td>
        <select class="statut-select" data-id="${r.id}">
          <option value="nouveau" ${r.statut === "nouveau" ? "selected" : ""}>Nouveau</option>
          <option value="en cours" ${r.statut === "en cours" ? "selected" : ""}>En cours</option>
          <option value="résolu" ${r.statut === "résolu" ? "selected" : ""}>Résolu</option>
        </select>
      </td></tr>`;
  }
  html += "</tbody></table>";
  document.getElementById("table-wrap").innerHTML = html;

  document.querySelectorAll(".statut-select").forEach(sel => {
    sel.addEventListener("change", async (e) => {
      const id = e.target.dataset.id;
      const statut = e.target.value;
      await changerStatut(id, statut);
      const item = ALL.find(r => String(r.id) === String(id));
      if (item) item.statut = statut;
      render();
    });
  });
}

function fillSalleFilter() {
  const salles = [...new Set(ALL.map(r => r.salle))].sort();
  const sel = document.getElementById("f-salle");
  const current = sel.value;
  sel.innerHTML = '<option value="">Toutes les salles</option>' +
    salles.map(s => `<option value="${s}">${s}</option>`).join("");
  sel.value = current;
}

async function charger() {
  document.getElementById("table-wrap").textContent = "Chargement…";
  const res = await fetch("/api/reports");
  if (res.status === 401) {
    document.getElementById("table-wrap").innerHTML =
      "<p>Authentification requise — rechargez la page et entrez le mot de passe partagé.</p>";
    return;
  }
  ALL = await res.json();
  fillSalleFilter();
  render();
}

document.getElementById("f-salle").addEventListener("change", render);
document.getElementById("f-statut").addEventListener("change", render);
document.getElementById("btn-refresh").addEventListener("click", charger);

charger();
