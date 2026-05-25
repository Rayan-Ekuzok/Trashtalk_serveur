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

// ─── HELPER : ouvre, query, ferme ─────────────────────────────────────────────
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
// Signalement correct → citoyen -1 avertissement (min 0)
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
// Signalement incorrect → citoyen +1 avertissement, ban si >= 5
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
  console.log("LOGIN REÇU :", login);
  console.log("MDP HASHÉ  :", passwordHash);

  try {
    const results = await query(
      "SELECT * FROM utilisateur WHERE login = ? AND password = ?",
      [login, passwordHash]
    );

    if (results.length === 0) return res.json({ success: false, message: "Identifiants incorrects" });

    const user = results[0];
    if (user.est_bannie) return res.json({ success: false, message: "Compte banni" });

    // Vérifie si l'utilisateur est admin
    const adminCheck = await query("SELECT * FROM admin WHERE Id_utilisateur = ?", [user.Id_utilisateur]);
    const isAdmin = adminCheck.length > 0;

    const { password: _pwd, ...userSafe } = user;
    res.json({ success: true, user: { ...userSafe, isAdmin } });

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