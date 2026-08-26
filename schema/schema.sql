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
