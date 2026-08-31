import { neon } from "@neondatabase/serverless";
import crypto from "crypto";

const sql = neon(process.env.DATABASE_URL);

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({
        error: "Nom d'utilisateur et mot de passe requis"
      });
    }

    const users = await sql`
      SELECT id, username, password_hash, role, full_name
      FROM admin_users
      WHERE username = ${username}
      LIMIT 1
    `;

    if (users.length === 0) {
      return res.status(401).json({
        error: "Identifiants incorrects"
      });
    }

    const user = users[0];

    /*
     * Le format attendu du hash est :
     * salt:hash
     */
    const parts = user.password_hash.split(":");

    if (parts.length !== 2) {
      return res.status(500).json({
        error: "Configuration sécurisée du compte incorrecte"
      });
    }

    const salt = parts[0];
    const storedHash = parts[1];

    const calculatedHash = hashPassword(password, salt);

    const valid = crypto.timingSafeEqual(
      Buffer.from(storedHash, "hex"),
      Buffer.from(calculatedHash, "hex")
    );

    if (!valid) {
      return res.status(401).json({
        error: "Identifiants incorrects"
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        full_name: user.full_name
      }
    });

  } catch (error) {
    console.error("Erreur login :", error);

    return res.status(500).json({
      error: "Erreur interne du serveur"
    });
  }
}
