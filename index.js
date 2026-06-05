const express = require('express');
const mysql   = require('mysql');
const cors    = require('cors');
const sha256  = require('js-sha256');
const jwt     = require('jsonwebtoken');
const fs      = require('fs');
const path    = require('path');

const app = express();

app.use(cors());
app.use(express.json());

//-----------------------------------------------------------------------
// Config : clé JWT et sel de hashage
const JWT_SECRET = "lhn_çyt'éfhyàç_é_yfZEHFOIZEFHZOEIFGHUZIG";

function getSalt() {
  return "lOPZf76r6otfg8P7R6'0è_guighUYd5oR_yhÔ%ug7Y6";
}

//------------------------------------------------------------------------------------
// Logger : enregistrement des tentatives de connexion dans un fichier
const LOG_DIR  = path.join(__dirname, 'logs');
const LOG_FILE = path.join(LOG_DIR, 'connexions.log');

if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR);

function logConnexion({ ip, login, success, raison }) {
  const now  = new Date().toISOString();
  const line = `[${now}] IP=${ip} LOGIN="${login}" SUCCES=${success ? 'OUI' : 'NON'} RAISON="${raison}"\n`;
  fs.appendFileSync(LOG_FILE, line, 'utf8');
  console.log(line.trim());
}

//-------------------------------------------------------------
// Helper DB : exécution d'une requête SQL avec une connexion temporaire
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    const con = mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      database: "slam_projet"
    });
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

//------------------------------------------------------------------------------
//  JWT : vérification du token 
function authMiddleware(req, res, next) {
  const header = req.headers['authorization'];

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: "Token manquant" });
  }

  const token = header.split(' ')[1];

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    let message = "Token invalide";
    let expired = false;

    if (err.name === 'TokenExpiredError') {
      message = "Session expirée";
      expired = true;
    }

    return res.status(401).json({ success: false, message, expired });
  }
}

//------------------------------------------------------------------
// Middleware Admin : vérifie que l'utilisateur connecté est admin
function adminMiddleware(req, res, next) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ success: false, message: "Accès refusé" });
  }
  next();
}

//---------------------------------------------------------------------------------
// GET /emplacement : retourne tous les emplacements
app.get('/emplacement', async (req, res) => {
  try {
    const emplacements = await query("SELECT * FROM emplacement");
    res.json(emplacements);
  } catch (err) {
    res.status(500).json({ success: false, message: "Erreur SQL" });
  }
});

//--------------------------------------------------------------------
// GET /type_dechet : retourne tous les types de déchets
app.get('/type_dechet', async (req, res) => {
  try {
    const types = await query("SELECT * FROM type_dechet");
    res.json(types);
  } catch (err) {
    res.status(500).json({ success: false, message: "Erreur SQL" });
  }
});

//------------------------------------------------------------------------------------
// GET /contenant : retourne tous les contenants
app.get('/contenant', async (req, res) => {
  try {
    const contenants = await query("SELECT * FROM contenant");
    res.json(contenants);
  } catch (err) {
    res.status(500).json({ success: false, message: "Erreur SQL" });
  }
});

//---------------------------------------------------------------
// GET /lot : retourne tous les lots (authentification requise)
app.get('/lot', authMiddleware, async (req, res) => {
  try {
    const lots = await query("SELECT * FROM lot");
    res.json(lots);
  } catch (err) {
    res.status(500).json({ success: false, message: "Erreur SQL" });
  }
});

//--------------------------------------------------------------------------
// GET /utilisateur : retourne tous les utilisateurs (authentification requise)
app.get('/utilisateur', authMiddleware, async (req, res) => {
  try {
    const utilisateurs = await query("SELECT * FROM utilisateur");
    res.json(utilisateurs);
  } catch (err) {
    res.status(500).json({ success: false, message: "Erreur SQL" });
  }
});

//-----------------------------------------------------------------------------------
// GET /utilisateur/conducteur : retourne tous les conducteurs
app.get('/utilisateur/conducteur', authMiddleware, async (req, res) => {
  try {
    const conducteurs = await query("SELECT * FROM conducteur");
    res.json(conducteurs);
  } catch (err) {
    res.status(500).json({ success: false, message: "Erreur SQL" });
  }
});

//---------------------------------------------------------------------
// GET /utilisateur/admin : retourne tous les admins (admin requis)
app.get('/utilisateur/admin', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const admins = await query("SELECT * FROM admin");
    res.json(admins);
  } catch (err) {
    res.status(500).json({ success: false, message: "Erreur SQL" });
  }
});

//------------------------------------------------------------------------------
// GET /signalement : retourne tous les signalements enrichis (admin requis)
app.get('/signalement', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const signalements = await query(
      `SELECT Id_signalement, text, evalutaion, date_, Id_emplacement, Id_utilisateur_1, Id_utilisateur
       FROM signalement
       ORDER BY date_ DESC`
    );

    for (let i = 0; i < signalements.length; i++) {
      const sig = signalements[i];

      const emplacements = await query(
        "SELECT libelle, code_postal FROM emplacement WHERE Id_emplacement = ?",
        [sig.Id_emplacement]
      );

      const utilisateurs = await query(
        "SELECT login, nb_avertissement, est_bannie FROM utilisateur WHERE Id_utilisateur = ?",
        [sig.Id_utilisateur_1]
      );

      sig.emplacement_libelle  = emplacements[0].libelle;
      sig.code_postal          = emplacements[0].code_postal;
      sig.citoyen_login        = utilisateurs[0].login;
      sig.nb_avertissement     = utilisateurs[0].nb_avertissement;
      sig.est_bannie           = utilisateurs[0].est_bannie;
    }

    res.json(signalements);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur SQL" });
  }
});

//------------------------------------------------------------------------
// POST /signalement/creer : crée un nouveau signalement pour un emplacement
app.post('/signalement/creer', authMiddleware, async (req, res) => {
  const { text, Id_emplacement } = req.body;

  if (!text || !Id_emplacement) {
    return res.status(400).json({ success: false, message: "Texte et emplacement requis" });
  }

  const Id_utilisateur_1 = req.user.Id_utilisateur;

  try {
    const admins = await query("SELECT Id_utilisateur FROM admin LIMIT 1");

    if (admins.length === 0) {
      return res.status(500).json({ success: false, message: "Aucun admin disponible" });
    }

    const Id_admin = admins[0].Id_utilisateur;

    const result = await query(
      `INSERT INTO signalement (text, evalutaion, date_, Id_utilisateur, Id_emplacement, Id_utilisateur_1)
       VALUES (?, NULL, NOW(), ?, ?, ?)`,
      [text, Id_admin, Id_emplacement, Id_utilisateur_1]
    );

    res.json({ success: true, id: result.insertId, message: "Signalement envoyé ✔" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur SQL" });
  }
});

//-----------------------------------------------------------------------------------
// POST /signalement/valider : valide un signalement et réduit les avertissements (admin requis)
app.post('/signalement/valider', authMiddleware, adminMiddleware, async (req, res) => {
  const { id_signalement } = req.body;

  if (!id_signalement) {
    return res.status(400).json({ success: false, message: "id_signalement manquant" });
  }

  try {
    const signalements = await query(
      "SELECT * FROM signalement WHERE Id_signalement = ?",
      [id_signalement]
    );

    if (signalements.length === 0) {
      return res.status(404).json({ success: false, message: "Signalement introuvable" });
    }

    const sig = signalements[0];

    await query(
      "UPDATE signalement SET evalutaion = 1 WHERE Id_signalement = ?",
      [id_signalement]
    );

    await query(
      `UPDATE utilisateur SET nb_avertissement = GREATEST(0, CAST(nb_avertissement AS SIGNED) - 1)
       WHERE Id_utilisateur = ?`,
      [sig.Id_utilisateur_1]
    );

    const utilisateurs = await query(
      "SELECT nb_avertissement, est_bannie FROM utilisateur WHERE Id_utilisateur = ?",
      [sig.Id_utilisateur_1]
    );

    res.json({ success: true, message: "Signalement validé ✔", user: utilisateurs[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur SQL" });
  }
});

//---------------------------------------------------------------------
// POST /signalement/rejeter : rejette un signalement et ajoute un avertissement (admin requis)
app.post('/signalement/rejeter', authMiddleware, adminMiddleware, async (req, res) => {
  const { id_signalement } = req.body;

  if (!id_signalement) {
    return res.status(400).json({ success: false, message: "id_signalement manquant" });
  }

  try {
    const signalements = await query(
      "SELECT * FROM signalement WHERE Id_signalement = ?",
      [id_signalement]
    );

    if (signalements.length === 0) {
      return res.status(404).json({ success: false, message: "Signalement introuvable" });
    }

    const sig = signalements[0];

    await query(
      "UPDATE signalement SET evalutaion = 0 WHERE Id_signalement = ?",
      [id_signalement]
    );

    await query(
      `UPDATE utilisateur SET nb_avertissement = CAST(nb_avertissement AS SIGNED) + 1
       WHERE Id_utilisateur = ?`,
      [sig.Id_utilisateur_1]
    );

    await query(
      `UPDATE utilisateur SET est_bannie = 1
       WHERE Id_utilisateur = ? AND CAST(nb_avertissement AS SIGNED) >= 5`,
      [sig.Id_utilisateur_1]
    );

    const utilisateurs = await query(
      "SELECT nb_avertissement, est_bannie FROM utilisateur WHERE Id_utilisateur = ?",
      [sig.Id_utilisateur_1]
    );

    const user = utilisateurs[0];

    let message = "";
    if (user.est_bannie) {
      message = `Utilisateur banni (${user.nb_avertissement} avert.)`;
    } else {
      message = `+1 avertissement (${user.nb_avertissement}/5)`;
    }

    res.json({ success: true, message, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur SQL" });
  }
});

//-----------------------------------------------------------------------------
// GET /conducteur/transferts/:id : retourne les transferts d'un conducteur
app.get('/conducteur/transferts/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  if (req.user.Id_utilisateur != id && !req.user.isAdmin) {
    return res.status(403).json({ success: false, message: "Accès refusé" });
  }

  try {
    const transferts = await query(
      `SELECT Id_transfert, date_demande, date_debut, date_fin, matricule, Id_centre
       FROM transfert
       WHERE Id_utilisateur = ?
       ORDER BY
         CASE WHEN date_fin IS NOT NULL THEN 2 WHEN date_debut <= NOW() THEN 0 ELSE 1 END,
         date_debut DESC`,
      [id]
    );

    for (let i = 0; i < transferts.length; i++) {
      const t = transferts[i];

      // Calcul du statut
      if (t.date_fin !== null) {
        t.statut = 'terminé';
      } else if (t.date_debut <= new Date()) {
        t.statut = 'en cours';
      } else {
        t.statut = 'en attente';
      }

      // Récupération du véhicule
      const vehicules = await query(
        "SELECT matricule, type_vehicule, capacite_kg, capacite_m2 FROM vehicule WHERE matricule = ?",
        [t.matricule]
      );
      t.vehicule = vehicules[0];

      // Récupération du centre de traitement
      const centres = await query(
        `SELECT Id_centre, adresse AS centre_adresse, ville AS centre_ville,
                code_postal AS centre_code_postal, latitude AS centre_latitude, longitude AS centre_longitude
         FROM centre_traitement WHERE Id_centre = ?`,
        [t.Id_centre]
      );
      t.centre = centres[0];
    }

    res.json(transferts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur SQL", detail: err.message });
  }
});

//------------------------------------------------------------------------------------
// GET /transferts/all : retourne tous les transferts avec détails conducteur (admin requis)
app.get('/transferts/all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const transferts = await query(
      `SELECT Id_transfert, date_demande, date_debut, date_fin, matricule, Id_centre, Id_utilisateur
       FROM transfert
       ORDER BY
         CASE WHEN date_fin IS NOT NULL THEN 2 WHEN date_debut <= NOW() THEN 0 ELSE 1 END,
         date_debut DESC`
    );

    for (let i = 0; i < transferts.length; i++) {
      const t = transferts[i];

      // Calcul du statut
      if (t.date_fin !== null) {
        t.statut = 'terminé';
      } else if (t.date_debut <= new Date()) {
        t.statut = 'en cours';
      } else {
        t.statut = 'en attente';
      }

      // Récupération du véhicule
      const vehicules = await query(
        "SELECT matricule, type_vehicule, capacite_kg, capacite_m2 FROM vehicule WHERE matricule = ?",
        [t.matricule]
      );
      t.vehicule = vehicules[0];

      // Récupération du centre de traitement
      const centres = await query(
        `SELECT Id_centre, adresse AS centre_adresse, ville AS centre_ville,
                code_postal AS centre_code_postal, latitude AS centre_latitude, longitude AS centre_longitude
         FROM centre_traitement WHERE Id_centre = ?`,
        [t.Id_centre]
      );
      t.centre = centres[0];

      // Récupération du login du conducteur
      const utilisateurs = await query(
        "SELECT login FROM utilisateur WHERE Id_utilisateur = ?",
        [t.Id_utilisateur]
      );
      t.conducteur_login = utilisateurs[0].login;
    }

    res.json(transferts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur SQL" });
  }
});

//----------------------------------------------------------------------
// POST /emplacement/ajouter : ajoute un nouvel emplacement (admin requis)
app.post('/emplacement/ajouter', authMiddleware, adminMiddleware, async (req, res) => {
  const { libelle, code_postal, latitude, longitude } = req.body;

  if (!libelle || !code_postal || latitude == null || longitude == null) {
    return res.status(400).json({ success: false, message: "Champs manquants" });
  }

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

//-----------------------------------------------------------------------------------
// POST /contenant/ajouter : crée un nouveau contenant et l'assigne à un emplacement (admin requis)
app.post('/contenant/ajouter', authMiddleware, adminMiddleware, async (req, res) => {
  const { capacite_kg, poids_actuel_kg, Id_type_dechet, Id_emplacement, scelle } = req.body;

  if (!capacite_kg || !Id_type_dechet || !Id_emplacement) {
    return res.status(400).json({ success: false, message: "Champs manquants" });
  }

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

//------------------------------------------------------------------------
// POST /contenant/assigner : réassigne un contenant à un emplacement (admin requis)
app.post('/contenant/assigner', authMiddleware, adminMiddleware, async (req, res) => {
  const { Id_contenant, Id_emplacement } = req.body;

  if (!Id_contenant || !Id_emplacement) {
    return res.status(400).json({ success: false, message: "Champs manquants" });
  }

  try {
    await query(
      "UPDATE contenant SET Id_emplacement = ? WHERE Id_contenant = ?",
      [Id_emplacement, Id_contenant]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur SQL" });
  }
});

//---------------------------------------------------------------
// POST /remplirpoubelle : incrémente le poids d'un contenant de 10 kg
app.post('/remplirpoubelle', authMiddleware, async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ success: false, message: "ID manquant" });
  }

  try {
    const contenants = await query(
      "SELECT * FROM contenant WHERE Id_contenant = ?",
      [id]
    );

    if (contenants.length === 0) {
      return res.status(404).json({ success: false, message: "Contenant introuvable" });
    }

    const contenant = contenants[0];

    const nouveauPoids = Math.min(
      parseFloat(contenant.poids_actuel_kg) + 10,
      parseFloat(contenant.capacite_kg)
    );

    await query(
      "UPDATE contenant SET poids_actuel_kg = ? WHERE Id_contenant = ?",
      [nouveauPoids, id]
    );

    res.json({
      success: true,
      poids_actuel_kg: nouveauPoids,
      capacite_kg: contenant.capacite_kg,
      plein: nouveauPoids >= contenant.capacite_kg
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Erreur SQL" });
  }
});

//------------------------------------------------------------------------------------
// POST /login : authentifie un utilisateur et retourne un token JWT
app.post('/login', async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'inconnue';
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

    const adminCheck      = await query(
      "SELECT * FROM admin WHERE Id_utilisateur = ?",
      [user.Id_utilisateur]
    );
    const conducteurCheck = await query(
      "SELECT * FROM conducteur WHERE Id_utilisateur = ?",
      [user.Id_utilisateur]
    );

    const isAdmin      = adminCheck.length > 0;
    const isConducteur = conducteurCheck.length > 0;

    const token = jwt.sign(
      {
        Id_utilisateur: user.Id_utilisateur,
        login:          user.login,
        isAdmin,
        isConducteur
      },
      JWT_SECRET,
      { expiresIn: "10m" }
    );

    logConnexion({ ip, login, success: true, raison: "OK" });

    const { password: _pwd, ...userSafe } = user;
    res.json({ success: true, token, user: { ...userSafe, isAdmin, isConducteur } });

  } catch (err) {
    console.error(err);
    logConnexion({ ip, login, success: false, raison: "Erreur SQL" });
    res.status(500).json({ success: false, message: "Erreur SQL" });
  }
});

//---------------------------------------------------------------------
// POST /auth/refresh : renouvelle le token JWT d'une session active
app.post('/auth/refresh', authMiddleware, async (req, res) => {
  try {
    const { Id_utilisateur, login, isAdmin, isConducteur } = req.user;

    const newToken = jwt.sign(
      { Id_utilisateur, login, isAdmin, isConducteur },
      JWT_SECRET,
      { expiresIn: "10m" }
    );

    res.json({ success: true, token: newToken });
  } catch (err) {
    res.status(500).json({ success: false, message: "Erreur" });
  }
});

//--------------------------------------------------------------------------
// POST /register : crée un nouveau compte utilisateur
app.post('/register', async (req, res) => {
  const { login, password, icon } = req.body;

  if (!login || !password) {
    return res.status(400).json({ success: false, message: "Champs manquants" });
  }

  const passwordHash = sha256(password + getSalt());

  try {
    await query(
      "INSERT INTO utilisateur (icon, login, password, nb_avertissement, est_bannie) VALUES (?, ?, ?, ?, ?)",
      [icon || "https://cdn-icons-png.flaticon.com/512/149/149071.png", login, passwordHash, 0, 0]
    );
    res.json({ success: true, message: "Compte créé" });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: "Login déjà utilisé" });
    }
    console.error(err);
    res.status(500).json({ success: false, message: "Erreur création compte" });
  }
});



//--------------------------------------------------------------------------

// GET / : page de statut du serveur
app.get('/', (req, res) => {
  res.send(`
  <p > Serveur opérationnel </p>
`);
});
                                                                                                                                                               





//------------------------------------------------------------------
//  Test demarrage Pour alwyas data et en localk
//const HOST = process.env.HOST ;
const HOST = "localhost";

//const PORT = parseInt(process.env.PORT);
const PORT = 3000;


app.listen(PORT, HOST, () => {
  console.log(`Serveur démarré sur http://${HOST}:${PORT}`);
});