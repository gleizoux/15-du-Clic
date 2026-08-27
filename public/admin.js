let ALL = [];
let MDP = "";

function authHeader() {
  return { Authorization: "Basic " + btoa("admin:" + MDP) };
}

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
    headers: { "Content-Type": "application/json", ...authHeader() },
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
    "<th>Date</th><th>Salle</th><th>Poste</th><th>Statut</th><th>Prénom</th><th>Type</th><th>Description</th>" +
    "</tr></thead><tbody>";

  for (const r of rows) {
    html += `<tr class="${statutClass(r.statut)}">` +
      `<td data-label="Date">${fmtDate(r.created_at)}</td>` +
      `<td data-label="Salle">${r.salle}</td>` +
      `<td data-label="Poste">${r.poste}</td>` +
      `<td data-label="Statut">
        <select class="statut-select" data-id="${r.id}">
          <option value="nouveau" ${r.statut === "nouveau" ? "selected" : ""}>Nouveau</option>
          <option value="en cours" ${r.statut === "en cours" ? "selected" : ""}>En cours</option>
          <option value="résolu" ${r.statut === "résolu" ? "selected" : ""}>Résolu</option>
        </select>
      </td>` +
      `<td data-label="Prénom">${r.prenom || ""}</td>` +
      `<td data-label="Type">${r.type}</td>` +
      `<td data-label="Description">${(r.description || "").replace(/</g, "&lt;")}</td>` +
      `</tr>`;
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
  const res = await fetch("/api/reports", { headers: authHeader() });
  if (res.status === 401) {
    seDeconnecter("Mot de passe incorrect.");
    return;
  }
  ALL = await res.json();
  fillSalleFilter();
  render();
}

function seDeconnecter(erreur) {
  MDP = "";
  sessionStorage.removeItem("15duclic_admin_mdp");
  document.getElementById("admin-content").style.display = "none";
  document.getElementById("login").style.display = "block";
  document.getElementById("login-erreur").textContent = erreur || "";
  document.getElementById("login-mdp").value = "";
  document.getElementById("login-mdp").focus();
}

async function tenterConnexion() {
  const mdp = document.getElementById("login-mdp").value;
  if (!mdp) return;
  MDP = mdp;
  const res = await fetch("/api/reports", { headers: authHeader() });
  if (res.status === 401) {
    MDP = "";
    document.getElementById("login-erreur").textContent = "Mot de passe incorrect.";
    return;
  }
  sessionStorage.setItem("15duclic_admin_mdp", mdp);
  document.getElementById("login").style.display = "none";
  document.getElementById("admin-content").style.display = "block";
  ALL = await res.json();
  fillSalleFilter();
  render();
}

document.getElementById("f-salle").addEventListener("change", render);
document.getElementById("f-statut").addEventListener("change", render);
document.getElementById("btn-refresh").addEventListener("click", charger);
document.getElementById("btn-login").addEventListener("click", tenterConnexion);
document.getElementById("login-mdp").addEventListener("keydown", (e) => {
  if (e.key === "Enter") tenterConnexion();
});

const mdpSauve = sessionStorage.getItem("15duclic_admin_mdp");
if (mdpSauve) {
  document.getElementById("login-mdp").value = mdpSauve;
  tenterConnexion();
} else {
  document.getElementById("login-mdp").focus();
}
