const { neon } = require("@neondatabase/serverless");
const crypto = require("crypto");

const sql = neon(process.env.DATABASE_URL);

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Méthode non autorisée"
    });
  }

  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: "Nom d'utilisateur et mot de passe requis"
      });
    }

    const users = await sql`
      SELECT id, username, password_hash, role, full_name, role_id
      FROM admin_users
      WHERE username = ${username}
      LIMIT 1
    `;

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        error: "Identifiants incorrects"
      });
    }

    const user = users[0];

    const parts = user.password_hash.split(":");

    if (parts.length !== 2) {
      return res.status(500).json({
        success: false,
        error: "Configuration sécurisée du compte incorrecte"
      });
    }

    const salt = parts[0];
    const storedHash = parts[1];

    const calculatedHash = hashPassword(password, salt);

    const storedBuffer = Buffer.from(storedHash, "hex");
    const calculatedBuffer = Buffer.from(calculatedHash, "hex");

    const valid =
      storedBuffer.length === calculatedBuffer.length &&
      crypto.timingSafeEqual(
        storedBuffer,
        calculatedBuffer
      );

    if (!valid) {
      return res.status(401).json({
        success: false,
        error: "Identifiants incorrects"
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        role_id: user.role_id,
        full_name: user.full_name
      }
    });

  } catch (error) {
    console.error("Erreur login :", error);

    return res.status(500).json({
      success: false,
      error: "Erreur interne du serveur"
    });
  }
};
