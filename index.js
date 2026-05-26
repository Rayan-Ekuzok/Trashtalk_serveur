const express = require('express');
const mysql   = require('mysql');
const cors    = require('cors');
const sha256  = require('js-sha256');

const app  = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const DB_CONFIG = {
  host:     "localhost",
  user:     "root",
  password: "",
  database: "slam_projet"
};

function getSalt() {
  return "lOPZf76r6otfg8P7R6'0è_guighUYd5oR_yhÔ%ug7Y6";
}

// ─── HELPER ───────────────────────────────────────────────────────────────────
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    const con = mysql.createConnection(DB_CONFIG);
    con.connect(err => {
      if (err) return reject(err);
      con.query(sql, params, (err, results) => {
        con.end();
        if (err) return reject(err);
        resolve(results);
      });
    });
  });
}

// ─── GET SIMPLES ──────────────────────────────────────────────────────────────
['lot', 'emplacement', 'contenant', 'type_dechet', 'utilisateur'].forEach(table => {
  app.get(`/${table}`, async (req, res) => {
    try { res.json(await query(`SELECT * FROM ${table}`)); }
    catch (err) { res.status(500).json({ success: false, message: "Erreur SQL" }); }
  });
});

app.get('/utilisateur/conducteur', async (req, res) => {
  try { res.json(await query("SELECT * FROM conducteur")); }
  catch (err) { res.status(500).json({ success: false, message: "Erreur SQL" }); }
});

app.get('/utilisateur/admin', async (req, res) => {
  try { res.json(await query("SELECT * FROM admin")); }
  catch (err) { res.status(500).json({ success: false, message: "Erreur SQL" }); }
});

// ─── GET /conducteur/transferts/:id ──────────────────────────────────────────
// Calcule un statut dynamique depuis les dates :
//   - date_fin non nulle                  → "terminé"
//   - date_debut <= maintenant, pas de fin → "en cours"
//   - date_debut dans le futur             → "en attente"
app.get('/conducteur/transferts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const sql = `
      SELECT
        t.Id_transfert,
        t.date_demande,
        t.date_debut,
        t.date_fin,
        CASE
          WHEN t.date_fin IS NOT NULL               THEN 'terminé'
          WHEN t.date_debut <= NOW()                THEN 'en cours'
          ELSE                                           'en attente'
        END AS statut,
        v.matricule,
        v.type_vehicule,
        v.capacite_kg,
        v.capacite_m2,
        c.Id_centre,
        c.adresse     AS centre_adresse,
        c.ville       AS centre_ville,
        c.code_postal AS centre_code_postal,
        c.latitude    AS centre_latitude,
        c.longitude   AS centre_longitude
      FROM transfert t
      JOIN vehicule          v ON t.matricule  = v.matricule
      JOIN centre_traitement c ON t.Id_centre  = c.Id_centre
      WHERE t.Id_utilisateur = ?
      ORDER BY
        CASE
          WHEN t.date_fin IS NOT NULL THEN 2
          WHEN t.date_debut <= NOW()  THEN 0
          ELSE                             1
        END,
        t.date_debut DESC
    `;
    res.json(await query(sql, [id]));
  } catch (err) {
    console.error('Erreur /conducteur/transferts :', err);
    res.status(500).json({ success: false, message: "Erreur SQL", detail: err.message });
  }
});

// ─── GET /signalement ─────────────────────────────────────────────────────────
app.get('/signalement', async (req, res) => {
  try {
    const sql = `
      SELECT
        s.Id_signalement,
        s.text,
        s.evalutaion,
        s.date_,
        s.Id_emplacement,
        s.Id_utilisateur_1,
        e.libelle     AS emplacement_libelle,
        e.code_postal,
        u.login       AS citoyen_login,
        u.nb_avertissement,
        u.est_bannie
      FROM signalement s
      JOIN emplacement  e ON s.Id_emplacement   = e.Id_emplacement
      JOIN utilisateur  u ON s.Id_utilisateur_1 = u.Id_utilisateur
      ORDER BY s.date_ DESC
    `;
    res.json(await query(sql));
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur SQL" });
  }
});

// ─── POST /signalement/valider ────────────────────────────────────────────────
app.post('/signalement/valider', async (req, res) => {
  const { id_signalement } = req.body;
  if (!id_signalement) return res.status(400).json({ success: false, message: "id_signalement manquant" });

  try {
    const [sig] = await query("SELECT * FROM signalement WHERE Id_signalement = ?", [id_signalement]);
    if (!sig) return res.status(404).json({ success: false, message: "Signalement introuvable" });

    await query("UPDATE signalement SET evalutaion = 1 WHERE Id_signalement = ?", [id_signalement]);

    await query(`
      UPDATE utilisateur
      SET nb_avertissement = GREATEST(0, CAST(nb_avertissement AS SIGNED) - 1)
      WHERE Id_utilisateur = ?
    `, [sig.Id_utilisateur_1]);

    const [user] = await query(
      "SELECT nb_avertissement, est_bannie FROM utilisateur WHERE Id_utilisateur = ?",
      [sig.Id_utilisateur_1]
    );

    res.json({ success: true, message: "Signalement validé ✔", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur SQL" });
  }
});

// ─── POST /signalement/rejeter ────────────────────────────────────────────────
app.post('/signalement/rejeter', async (req, res) => {
  const { id_signalement } = req.body;
  if (!id_signalement) return res.status(400).json({ success: false, message: "id_signalement manquant" });

  try {
    const [sig] = await query("SELECT * FROM signalement WHERE Id_signalement = ?", [id_signalement]);
    if (!sig) return res.status(404).json({ success: false, message: "Signalement introuvable" });

    await query("UPDATE signalement SET evalutaion = 0 WHERE Id_signalement = ?", [id_signalement]);

    await query(`
      UPDATE utilisateur
      SET nb_avertissement = CAST(nb_avertissement AS SIGNED) + 1
      WHERE Id_utilisateur = ?
    `, [sig.Id_utilisateur_1]);

    await query(`
      UPDATE utilisateur
      SET est_bannie = 1
      WHERE Id_utilisateur = ? AND CAST(nb_avertissement AS SIGNED) >= 5
    `, [sig.Id_utilisateur_1]);

    const [user] = await query(
      "SELECT nb_avertissement, est_bannie FROM utilisateur WHERE Id_utilisateur = ?",
      [sig.Id_utilisateur_1]
    );

    res.json({
      success: true,
      message: user.est_bannie
        ? `Utilisateur banni (${user.nb_avertissement} avertissements)`
        : `+1 avertissement (${user.nb_avertissement}/5)`,
      user
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur SQL" });
  }
});

// ─── POST /login ──────────────────────────────────────────────────────────────
app.post('/login', async (req, res) => {
  const { login, password } = req.body;
  if (!login || !password) return res.status(400).json({ success: false, message: "Champs manquants" });

  const passwordHash = sha256(password + getSalt());

  try {
    const results = await query(
      "SELECT * FROM utilisateur WHERE login = ? AND password = ?",
      [login, passwordHash]
    );

    if (results.length === 0) return res.json({ success: false, message: "Identifiants incorrects" });

    const user = results[0];
    if (user.est_bannie) return res.json({ success: false, message: "Compte banni" });

    const adminCheck     = await query("SELECT * FROM admin     WHERE Id_utilisateur = ?", [user.Id_utilisateur]);
    const conducteurCheck= await query("SELECT * FROM conducteur WHERE Id_utilisateur = ?", [user.Id_utilisateur]);

    const { password: _pwd, ...userSafe } = user;
    res.json({
      success: true,
      user: {
        ...userSafe,
        isAdmin:      adminCheck.length > 0,
        isConducteur: conducteurCheck.length > 0
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur SQL" });
  }
});

// ─── POST /register ───────────────────────────────────────────────────────────
app.post('/register', async (req, res) => {
  const { login, password, icon } = req.body;
  if (!login || !password) return res.status(400).json({ success: false, message: "Champs manquants" });

  const passwordHash = sha256(password + getSalt());

  try {
    await query(
      "INSERT INTO utilisateur (icon, login, password, nb_avertissement, est_bannie) VALUES (?, ?, ?, ?, ?)",
      [
        icon || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
        login,
        passwordHash,
        0,
        0
      ]
    );
    res.json({ success: true, message: "Compte créé" });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: "Login déjà utilisé" });
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur création compte" });
  }
});

// ─── START ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => console.log(`✅  Serveur démarré sur http://localhost:${PORT}`));