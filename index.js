const express  = require('express');
const mysql    = require('mysql');
const cors     = require('cors');
const sha256   = require('js-sha256');
const jwt      = require('jsonwebtoken');
const fs       = require('fs');
const path     = require('path');

const app  = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const DB_CONFIG = {
  host: "localhost", user: "root", password: "", database: "slam_projet"
};

const JWT_SECRET  = "trashtalk_jwt_secret_change_in_prod";  // → .env en prod
const JWT_EXPIRES = "10m";

function getSalt() {
  return "lOPZf76r6otfg8P7R6'0è_guighUYd5oR_yhÔ%ug7Y6";
}

// ─── LOGGER ───────────────────────────────────────────────────────────────────
const LOG_DIR  = path.join(__dirname, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'connexions.log');

if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR);

function logConnexion({ ip, login, success, raison }) {
  const now  = new Date().toISOString();
  const line = `[${now}] IP=${ip} LOGIN="${login}" SUCCES=${success ? 'OUI' : 'NON'} RAISON="${raison}"\n`;
  fs.appendFileSync(LOG_FILE, line, 'utf8');
  console.log(line.trim());
}

// ─── HELPER DB ────────────────────────────────────────────────────────────────
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

// ─── MIDDLEWARE JWT ───────────────────────────────────────────────────────────
function authMiddleware(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ success: false, message: "Token manquant" });

  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError' ? "Session expirée" : "Token invalide";
    return res.status(401).json({ success: false, message: msg, expired: err.name === 'TokenExpiredError' });
  }
}

function adminMiddleware(req, res, next) {
  if (!req.user?.isAdmin)
    return res.status(403).json({ success: false, message: "Accès refusé" });
  next();
}

// ─── GET PUBLICS (lecture seule, pas de JWT requis) ───────────────────────────
// contenant est public pour permettre la carte sans connexion
['emplacement', 'type_dechet', 'contenant'].forEach(table => {
  app.get(`/${table}`, async (req, res) => {
    try { res.json(await query(`SELECT * FROM ${table}`)); }
    catch { res.status(500).json({ success: false, message: "Erreur SQL" }); }
  });
});

// ─── GET PROTÉGÉS ─────────────────────────────────────────────────────────────
['lot', 'utilisateur'].forEach(table => {
  app.get(`/${table}`, authMiddleware, async (req, res) => {
    try { res.json(await query(`SELECT * FROM ${table}`)); }
    catch { res.status(500).json({ success: false, message: "Erreur SQL" }); }
  });
});

// ─── POST /signalement/creer ──────────────────────────────────────────────────
// Accessible à tout utilisateur connecté
app.post('/signalement/creer', authMiddleware, async (req, res) => {
  const { text, Id_emplacement } = req.body;
  if (!text || !Id_emplacement)
    return res.status(400).json({ success: false, message: "Texte et emplacement requis" });

  const Id_utilisateur_1 = req.user.Id_utilisateur;

  try {
    const admins = await query("SELECT Id_utilisateur FROM admin LIMIT 1");
    if (admins.length === 0)
      return res.status(500).json({ success: false, message: "Aucun admin disponible" });

    const Id_admin = admins[0].Id_utilisateur;

    const result = await query(
      `INSERT INTO signalement (text, evalutaion, date_, Id_utilisateur, Id_emplacement, Id_utilisateur_1) VALUES (?, NULL, NOW(), ?, ?, ?)`,
      [text, Id_admin, Id_emplacement, Id_utilisateur_1]
    );

    res.json({ success: true, id: result.insertId, message: "Signalement envoyé ✔" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur SQL" });
  }
});

app.get('/utilisateur/conducteur', authMiddleware, async (req, res) => {
  try { res.json(await query("SELECT * FROM conducteur")); }
  catch { res.status(500).json({ success: false, message: "Erreur SQL" }); }
});

app.get('/utilisateur/admin', authMiddleware, adminMiddleware, async (req, res) => {
  try { res.json(await query("SELECT * FROM admin")); }
  catch { res.status(500).json({ success: false, message: "Erreur SQL" }); }
});

// ─── GET /signalement ─────────────────────────────────────────────────────────
app.get('/signalement', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const sql = `
      SELECT s.Id_signalement, s.text, s.evalutaion, s.date_,
             s.Id_emplacement, s.Id_utilisateur_1,
             e.libelle AS emplacement_libelle, e.code_postal,
             u.login   AS citoyen_login, u.nb_avertissement, u.est_bannie
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
app.post('/signalement/valider', authMiddleware, adminMiddleware, async (req, res) => {
  const { id_signalement } = req.body;
  if (!id_signalement) return res.status(400).json({ success: false, message: "id_signalement manquant" });
  try {
    const [sig] = await query("SELECT * FROM signalement WHERE Id_signalement = ?", [id_signalement]);
    if (!sig) return res.status(404).json({ success: false, message: "Signalement introuvable" });
    await query("UPDATE signalement SET evalutaion = 1 WHERE Id_signalement = ?", [id_signalement]);
    await query(`UPDATE utilisateur SET nb_avertissement = GREATEST(0, CAST(nb_avertissement AS SIGNED) - 1) WHERE Id_utilisateur = ?`, [sig.Id_utilisateur_1]);
    const [user] = await query("SELECT nb_avertissement, est_bannie FROM utilisateur WHERE Id_utilisateur = ?", [sig.Id_utilisateur_1]);
    res.json({ success: true, message: "Signalement validé ✔", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur SQL" });
  }
});

// ─── POST /signalement/rejeter ────────────────────────────────────────────────
app.post('/signalement/rejeter', authMiddleware, adminMiddleware, async (req, res) => {
  const { id_signalement } = req.body;
  if (!id_signalement) return res.status(400).json({ success: false, message: "id_signalement manquant" });
  try {
    const [sig] = await query("SELECT * FROM signalement WHERE Id_signalement = ?", [id_signalement]);
    if (!sig) return res.status(404).json({ success: false, message: "Signalement introuvable" });
    await query("UPDATE signalement SET evalutaion = 0 WHERE Id_signalement = ?", [id_signalement]);
    await query(`UPDATE utilisateur SET nb_avertissement = CAST(nb_avertissement AS SIGNED) + 1 WHERE Id_utilisateur = ?`, [sig.Id_utilisateur_1]);
    await query(`UPDATE utilisateur SET est_bannie = 1 WHERE Id_utilisateur = ? AND CAST(nb_avertissement AS SIGNED) >= 5`, [sig.Id_utilisateur_1]);
    const [user] = await query("SELECT nb_avertissement, est_bannie FROM utilisateur WHERE Id_utilisateur = ?", [sig.Id_utilisateur_1]);
    res.json({
      success: true,
      message: user.est_bannie ? `Utilisateur banni (${user.nb_avertissement} avert.)` : `+1 avertissement (${user.nb_avertissement}/5)`,
      user
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur SQL" });
  }
});

// ─── GET /conducteur/transferts/:id ──────────────────────────────────────────
app.get('/conducteur/transferts/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  if (req.user.Id_utilisateur != id && !req.user.isAdmin)
    return res.status(403).json({ success: false, message: "Accès refusé" });
  try {
    const sql = `
      SELECT t.Id_transfert, t.date_demande, t.date_debut, t.date_fin,
        CASE WHEN t.date_fin IS NOT NULL THEN 'terminé'
             WHEN t.date_debut <= NOW()  THEN 'en cours'
             ELSE 'en attente' END AS statut,
        v.matricule, v.type_vehicule, v.capacite_kg, v.capacite_m2,
        c.Id_centre, c.adresse AS centre_adresse, c.ville AS centre_ville,
        c.code_postal AS centre_code_postal,
        c.latitude AS centre_latitude, c.longitude AS centre_longitude
      FROM transfert t
      JOIN vehicule          v ON t.matricule = v.matricule
      JOIN centre_traitement c ON t.Id_centre = c.Id_centre
      WHERE t.Id_utilisateur = ?
      ORDER BY CASE WHEN t.date_fin IS NOT NULL THEN 2 WHEN t.date_debut <= NOW() THEN 0 ELSE 1 END, t.date_debut DESC
    `;
    res.json(await query(sql, [id]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur SQL", detail: err.message });
  }
});

// ─── GET /transferts/all ──────────────────────────────────────────────────────
app.get('/transferts/all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const sql = `
      SELECT t.Id_transfert, t.date_demande, t.date_debut, t.date_fin,
        CASE WHEN t.date_fin IS NOT NULL THEN 'terminé'
             WHEN t.date_debut <= NOW()  THEN 'en cours'
             ELSE 'en attente' END AS statut,
        v.matricule, v.type_vehicule, v.capacite_kg, v.capacite_m2,
        c.Id_centre, c.adresse AS centre_adresse, c.ville AS centre_ville,
        c.code_postal AS centre_code_postal,
        c.latitude AS centre_latitude, c.longitude AS centre_longitude,
        u.login AS conducteur_login
      FROM transfert t
      JOIN vehicule          v ON t.matricule      = v.matricule
      JOIN centre_traitement c ON t.Id_centre      = c.Id_centre
      JOIN utilisateur       u ON t.Id_utilisateur = u.Id_utilisateur
      ORDER BY CASE WHEN t.date_fin IS NOT NULL THEN 2 WHEN t.date_debut <= NOW() THEN 0 ELSE 1 END, t.date_debut DESC
    `;
    res.json(await query(sql));
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur SQL" });
  }
});

// ─── POST /emplacement/ajouter ────────────────────────────────────────────────
app.post('/emplacement/ajouter', authMiddleware, adminMiddleware, async (req, res) => {
  const { libelle, code_postal, latitude, longitude } = req.body;
  if (!libelle || !code_postal || latitude == null || longitude == null)
    return res.status(400).json({ success: false, message: "Champs manquants" });
  try {
    const result = await query(
      "INSERT INTO emplacement (code_postal, libelle, latitude, longitude) VALUES (?, ?, ?, ?)",
      [code_postal, libelle, latitude, longitude]
    );
    res.json({ success: true, id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur SQL" });
  }
});

// ─── POST /contenant/ajouter ──────────────────────────────────────────────────
app.post('/contenant/ajouter', authMiddleware, adminMiddleware, async (req, res) => {
  const { capacite_kg, poids_actuel_kg, Id_type_dechet, Id_emplacement, scelle } = req.body;
  if (!capacite_kg || !Id_type_dechet || !Id_emplacement)
    return res.status(400).json({ success: false, message: "Champs manquants" });
  try {
    const result = await query(
      `INSERT INTO contenant (capacite_kg, poids_actuel_kg, scelle, date_creation, Id_type_dechet, Id_emplacement)
       VALUES (?, ?, ?, NOW(), ?, ?)`,
      [capacite_kg, poids_actuel_kg || 0, scelle ? 1 : 0, Id_type_dechet, Id_emplacement]
    );
    res.json({ success: true, id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur SQL" });
  }
});

// ─── POST /contenant/assigner ─────────────────────────────────────────────────
app.post('/contenant/assigner', authMiddleware, adminMiddleware, async (req, res) => {
  const { Id_contenant, Id_emplacement } = req.body;
  if (!Id_contenant || !Id_emplacement)
    return res.status(400).json({ success: false, message: "Champs manquants" });
  try {
    await query("UPDATE contenant SET Id_emplacement = ? WHERE Id_contenant = ?", [Id_emplacement, Id_contenant]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur SQL" });
  }
});

// ─── POST /remplirpoubelle ────────────────────────────────────────────────────
app.post('/remplirpoubelle', authMiddleware, async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ success: false, message: "ID manquant" });
  try {
    const [contenant] = await query("SELECT * FROM contenant WHERE Id_contenant = ?", [id]);
    if (!contenant) return res.status(404).json({ success: false, message: "Contenant introuvable" });
    const nouveauPoids = Math.min(parseFloat(contenant.poids_actuel_kg) + 10, parseFloat(contenant.capacite_kg));
    await query("UPDATE contenant SET poids_actuel_kg = ? WHERE Id_contenant = ?", [nouveauPoids, id]);
    res.json({ success: true, poids_actuel_kg: nouveauPoids, capacite_kg: contenant.capacite_kg, plein: nouveauPoids >= contenant.capacite_kg });
  } catch (err) {
    res.status(500).json({ success: false, message: "Erreur SQL" });
  }
});

// ─── POST /login ──────────────────────────────────────────────────────────────
app.post('/login', async (req, res) => {
  const ip    = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'inconnue';
  const { login, password } = req.body;

  if (!login || !password) {
    logConnexion({ ip, login: login || '?', success: false, raison: "Champs manquants" });
    return res.status(400).json({ success: false, message: "Champs manquants" });
  }

  const passwordHash = sha256(password + getSalt());

  try {
    const results = await query(
      "SELECT * FROM utilisateur WHERE login = ? AND password = ?",
      [login, passwordHash]
    );

    if (results.length === 0) {
      logConnexion({ ip, login, success: false, raison: "Identifiants incorrects" });
      return res.json({ success: false, message: "Identifiants incorrects" });
    }

    const user = results[0];

    if (user.est_bannie) {
      logConnexion({ ip, login, success: false, raison: "Compte banni" });
      return res.json({ success: false, message: "Compte banni" });
    }

    const adminCheck      = await query("SELECT * FROM admin      WHERE Id_utilisateur = ?", [user.Id_utilisateur]);
    const conducteurCheck = await query("SELECT * FROM conducteur WHERE Id_utilisateur = ?", [user.Id_utilisateur]);
    const isAdmin      = adminCheck.length > 0;
    const isConducteur = conducteurCheck.length > 0;

    // Génère le JWT
    const payload = {
      Id_utilisateur: user.Id_utilisateur,
      login:          user.login,
      isAdmin,
      isConducteur
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });

    logConnexion({ ip, login, success: true, raison: "OK" });

    const { password: _pwd, ...userSafe } = user;
    res.json({ success: true, token, user: { ...userSafe, isAdmin, isConducteur } });

  } catch (err) {
    console.error(err);
    logConnexion({ ip, login, success: false, raison: "Erreur SQL" });
    res.status(500).json({ success: false, message: "Erreur SQL" });
  }
});

// ─── POST /auth/refresh ───────────────────────────────────────────────────────
// Renouvelle le token si encore valide → remet le compteur à 10 min
app.post('/auth/refresh', authMiddleware, async (req, res) => {
  try {
    const { Id_utilisateur, login, isAdmin, isConducteur } = req.user;
    const newToken = jwt.sign({ Id_utilisateur, login, isAdmin, isConducteur }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    res.json({ success: true, token: newToken });
  } catch (err) {
    res.status(500).json({ success: false, message: "Erreur" });
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
      [icon || "https://cdn-icons-png.flaticon.com/512/149/149071.png", login, passwordHash, 0, 0]
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