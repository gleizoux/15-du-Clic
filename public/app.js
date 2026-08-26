const CELL_W = 0.68;
const CELL_H = 0.58;
const PAGE = { portrait: [8.27, 11.69], landscape: [11.69, 8.27] };
const HEX_OFFSETS = [
  [0.5, 0.14], [0.80, 0.32], [0.80, 0.68],
  [0.5, 0.86], [0.20, 0.68], [0.20, 0.32],
];

let LAB_ROOMS = [];
let CLASSIC_ROOMS = [];
let current = null; // { salle, poste } en attente de signalement

const svgns = "http://www.w3.org/2000/svg";

function el(tag, attrs = {}, children = []) {
  const e = document.createElementNS(svgns, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  for (const c of children) e.appendChild(c);
  return e;
}

function renderGrid(svg, roomCode, elDef) {
  const rows = elDef.grid;
  rows.forEach((row, ri) => {
    row.forEach((val, ci) => {
      if (val === null || val === undefined) return;
      const x = elDef.x + ci * CELL_W;
      const y = elDef.y + ri * CELL_H;
      const isVpi = typeof val === "string" && val.startsWith("VPI");
      const g2 = el("g", { class: "seat" + (isVpi ? " vpi" : "") });
      g2.appendChild(el("rect", { x, y, width: CELL_W, height: CELL_H, rx: 0.04 }));
      const num = isVpi ? val : String(val).padStart(2, "0");
      const t1 = el("text", { x: x + CELL_W / 2, y: y + CELL_H * 0.42, "font-size": isVpi ? CELL_H * 0.28 : CELL_H * 0.36 });
      t1.textContent = num;
      g2.appendChild(t1);
      if (!isVpi) {
        const t2 = el("text", { x: x + CELL_W / 2, y: y + CELL_H * 0.75, class: "code", "font-size": CELL_H * 0.16 });
        t2.textContent = `${roomCode}-P${String(val).padStart(2, "0")}`;
        g2.appendChild(t2);
      }
      const posteName = isVpi ? `${roomCode}-${val}` : `${roomCode}-P${String(val).padStart(2, "0")}`;
      g2.addEventListener("click", () => openModal(roomCode, posteName));
      svg.appendChild(g2);
    });
  });
  if (elDef.caption) {
    const ncols = Math.max(...rows.map(r => r.length));
    const cap = el("text", { x: elDef.x + (ncols * CELL_W) / 2, y: elDef.y - 0.12, class: "caption" });
    cap.textContent = elDef.caption;
    svg.appendChild(cap);
  }
}

function hexPathPoints(x, y, w, h) {
  const pts = [
    [x + 0.5 * w, y],
    [x + w, y + 0.28 * h],
    [x + w, y + 0.72 * h],
    [x + 0.5 * w, y + h],
    [x, y + 0.72 * h],
    [x, y + 0.28 * h],
  ];
  return pts.map(p => p.join(",")).join(" ");
}

function renderHexpod(svg, roomCode, elDef) {
  const { x, y, w, h, values } = elDef;
  const poly = el("polygon", { points: hexPathPoints(x, y, w, h) });
  svg.appendChild(poly);
  values.forEach((val, i) => {
    const [fx, fy] = HEX_OFFSETS[i];
    const cx = x + fx * w, cy = y + fy * h;
    const g = el("g", { class: "seat" });
    if (val === null || val === undefined) {
      const t = el("text", { x: cx, y: cy, "font-size": h * 0.13, fill: "#808080" });
      t.textContent = "×";
      g.appendChild(t);
      svg.appendChild(g);
      return;
    }
    const t1 = el("text", { x: cx, y: cy - h * 0.02, "font-size": h * 0.1, fill: "#1f3864", "font-weight": "bold" });
    t1.textContent = String(val).padStart(2, "0");
    const t2 = el("text", { x: cx, y: cy + h * 0.09, "font-size": h * 0.055, fill: "#1f3864" });
    const posteName = `${roomCode}-P${String(val).padStart(2, "0")}`;
    t2.textContent = posteName;
    g.appendChild(t1); g.appendChild(t2);
    g.addEventListener("click", () => openModal(roomCode, posteName));
    svg.appendChild(g);
  });
  if (elDef.caption) {
    const cap = el("text", { x: x + w / 2, y: y - 0.12, class: "caption" });
    cap.textContent = elDef.caption;
    svg.appendChild(cap);
  }
}

function renderFreecells(svg, roomCode, elDef) {
  if (elDef.caption) {
    const [cx, cy] = elDef.caption_xy || [elDef.cells[0][0], elDef.cells[0][1] - 0.3];
    const cap = el("text", { x: cx, y: cy, class: "caption", "text-anchor": "start" });
    cap.textContent = elDef.caption;
    svg.appendChild(cap);
  }
  for (const [x, y, val] of elDef.cells) {
    const isVpi = typeof val === "string" && val.startsWith("VPI");
    const g2 = el("g", { class: "seat" + (isVpi ? " vpi" : "") });
    g2.appendChild(el("rect", { x, y, width: CELL_W, height: CELL_H, rx: 0.04 }));
    const num = isVpi ? val : String(val).padStart(2, "0");
    const t1 = el("text", { x: x + CELL_W / 2, y: y + CELL_H * 0.42, "font-size": CELL_H * 0.36 });
    t1.textContent = num;
    g2.appendChild(t1);
    if (!isVpi) {
      const t2 = el("text", { x: x + CELL_W / 2, y: y + CELL_H * 0.75, class: "code", "font-size": CELL_H * 0.16 });
      t2.textContent = `${roomCode}-P${String(val).padStart(2, "0")}`;
      g2.appendChild(t2);
    }
    const posteName = isVpi ? `${roomCode}-${val}` : `${roomCode}-P${String(val).padStart(2, "0")}`;
    g2.addEventListener("click", () => openModal(roomCode, posteName));
    svg.appendChild(g2);
  }
}

function renderLabRoom(room) {
  const [pw, ph] = PAGE[room.orientation] || PAGE.portrait;
  const svg = document.createElementNS(svgns, "svg");
  svg.setAttribute("id", "plan");
  svg.setAttribute("viewBox", `0 0 ${pw} ${ph}`);
  for (const elDef of room.elements) {
    if (elDef.kind === "grid") renderGrid(svg, room.code, elDef);
    else if (elDef.kind === "hexpod") renderHexpod(svg, room.code, elDef);
    else if (elDef.kind === "freecells") renderFreecells(svg, room.code, elDef);
  }
  const wrap = document.getElementById("plan-wrap");
  wrap.innerHTML = "";
  wrap.appendChild(svg);
}

function renderToolbar(roomCode, vp, son) {
  const bar = document.getElementById("toolbar");
  bar.innerHTML = "";
  if (vp) {
    const b = document.createElement("button");
    b.className = "btn-equip";
    b.textContent = "📽️ Signaler le vidéoprojecteur";
    b.onclick = () => openModal(roomCode, `${roomCode}-VPI`);
    bar.appendChild(b);
  }
  if (son) {
    const b = document.createElement("button");
    b.className = "btn-equip";
    b.textContent = "🔊 Signaler le son";
    b.onclick = () => openModal(roomCode, `${roomCode}-SON`);
    bar.appendChild(b);
  }
}

function onSalleChange() {
  const value = document.getElementById("salle").value;
  if (!value) {
    document.getElementById("plan-wrap").innerHTML = '<div class="empty-msg">Sélectionnez une salle ci-dessus.</div>';
    document.getElementById("toolbar").innerHTML = "";
    return;
  }
  const [kind, code] = value.split(":");
  if (kind === "lab") {
    const room = LAB_ROOMS.find(r => r.code === code);
    renderToolbar(room.code, true, true);
    renderLabRoom(room);
  } else {
    const room = CLASSIC_ROOMS.find(r => r.code === code);
    document.getElementById("plan-wrap").innerHTML =
      '<div class="empty-msg">Salle sans plan de postes numérotés — utilisez les boutons ci-dessus.</div>';
    renderToolbar(room.code, !!room.vp, !!room.son);
  }
}

function openModal(salle, poste) {
  current = { salle, poste };
  document.getElementById("modal-title").textContent = `Signalement — ${salle} / ${poste}`;
  document.getElementById("description").value = "";
  document.getElementById("photo").value = "";
  document.getElementById("prenom").value = localStorage.getItem("15duclic_prenom") || "";
  document.querySelector('input[name="type"][value="Panne matériel"]').checked = true;
  document.getElementById("modal").showModal();
}

function showToast(msg, isError) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = isError ? "error" : "";
  t.style.display = "block";
  setTimeout(() => { t.style.display = "none"; }, 3500);
}

async function envoyerSignalement() {
  const prenom = document.getElementById("prenom").value.trim();
  if (!prenom) { showToast("Merci d'indiquer votre prénom.", true); return; }
  const type = document.querySelector('input[name="type"]:checked').value;
  const description = document.getElementById("description").value.trim();
  const photoInput = document.getElementById("photo");

  localStorage.setItem("15duclic_prenom", prenom);

  const fd = new FormData();
  fd.append("salle", current.salle);
  fd.append("poste", current.poste);
  fd.append("prenom", prenom);
  fd.append("type", type);
  fd.append("description", description);
  if (photoInput.files[0]) fd.append("photo", photoInput.files[0]);

  const btn = document.getElementById("btn-envoyer");
  btn.disabled = true; btn.textContent = "Envoi...";
  try {
    const res = await fetch("/api/report", { method: "POST", body: fd });
    if (!res.ok) throw new Error("Erreur serveur");
    document.getElementById("modal").close();
    showToast("Signalement envoyé, merci !");
  } catch (e) {
    showToast("Échec de l'envoi — réessayez.", true);
  } finally {
    btn.disabled = false; btn.textContent = "Envoyer";
  }
}

async function init() {
  const [labs, classics] = await Promise.all([
    fetch("/data/rooms.json").then(r => r.json()),
    fetch("/data/classic_rooms.json").then(r => r.json()),
  ]);
  LAB_ROOMS = labs;
  CLASSIC_ROOMS = classics;

  const select = document.getElementById("salle");
  select.innerHTML = '<option value="">-- Choisir --</option>';

  const gLab = document.createElement("optgroup");
  gLab.label = "Salles informatiques";
  for (const r of [...LAB_ROOMS].sort((a, b) => a.code.localeCompare(b.code))) {
    const o = document.createElement("option");
    o.value = `lab:${r.code}`;
    o.textContent = r.code;
    gLab.appendChild(o);
  }
  select.appendChild(gLab);

  const gClassic = document.createElement("optgroup");
  gClassic.label = "Salles classiques";
  for (const r of [...CLASSIC_ROOMS].sort((a, b) => a.label.localeCompare(b.label))) {
    const o = document.createElement("option");
    o.value = `classic:${r.code}`;
    o.textContent = r.label;
    gClassic.appendChild(o);
  }
  select.appendChild(gClassic);

  select.addEventListener("change", onSalleChange);
  document.getElementById("btn-annuler").addEventListener("click", () => document.getElementById("modal").close());
  document.getElementById("btn-envoyer").addEventListener("click", envoyerSignalement);
}

init();
