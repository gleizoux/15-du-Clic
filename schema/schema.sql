CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  salle TEXT NOT NULL,
  poste TEXT NOT NULL,
  prenom TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  statut TEXT NOT NULL DEFAULT 'nouveau',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_reports_salle ON reports(salle);
CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at);
CREATE INDEX IF NOT EXISTS idx_reports_statut ON reports(statut);

-- Questions libres ("Autre question" dans le menu), hors plan de salle :
-- publiques dès leur envoi, seule la réponse doit passer par l'admin.
CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  prenom TEXT NOT NULL,
  question TEXT NOT NULL,
  reponse TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  reponse_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_questions_created ON questions(created_at);
