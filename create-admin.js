import { neon } from "@neondatabase/serverless";
import crypto from "crypto";

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Méthode non autorisée"
    });
  }

  try {
    const {
      setupKey,
      username,
      password,
      full_name,
      role_id
    } = req.body || {};

    // Clé temporaire fournie uniquement via Vercel
    if (!setupKey || setupKey !== process.env.ADMIN_SETUP_KEY) {
      return res.status(403).json({
        success: false,
        message: "Accès refusé"
      });
    }

    if (!username || !password || !full_name || !role_id) {
      return res.status(400).json({
        success: false,
        message: "Tous les champs sont requis"
      });
    }

    if (password.length < 12) {
      return res.status(400).json({
        success: false,
        message: "Le mot de passe doit contenir au moins 12 caractères"
      });
    }

    const existing = await sql`
      SELECT id
      FROM admin_users
      WHERE username = ${username}
      LIMIT 1
    `;

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Cet utilisateur existe déjà"
      });
    }

    const salt = crypto.randomBytes(16).toString("hex");

    const hash = crypto
      .scryptSync(password, salt, 64)
      .toString("hex");

    const passwordHash = `${salt}:${hash}`;

    const result = await sql`
      INSERT INTO admin_users
        (username, password_hash, full_name, role_id)
      VALUES
        (${username}, ${passwordHash}, ${full_name}, ${role_id})
      RETURNING id, username, full_name, role_id
    `;

    return res.status(201).json({
      success: true,
      user: result[0]
    });

  } catch (error) {
    console.error("Erreur création admin :", error);

    return res.status(500).json({
      success: false,
      message: "Erreur interne du serveur"
    });
  }
}
