
import bcrypt from "bcryptjs";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  // Autoriser uniquement POST
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Méthode non autorisée"
    });
  }

  try {
    const { username, password } = req.body || {};

    // Vérification des champs
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Identifiant et mot de passe requis"
      });
    }

    // Recherche de l'utilisateur
    const users = await sql`
      SELECT
        u.id,
        u.username,
        u.password_hash,
        u.full_name,
        u.role_id,
        r.role_code,
        r.role_name
      FROM admin_users u
      LEFT JOIN admin_roles r
        ON u.role_id = r.id
      WHERE u.username = ${username}
      LIMIT 1
    `;

    // Ne pas révéler si l'utilisateur existe
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Identifiant ou mot de passe incorrect"
      });
    }

    const user = users[0];

    // Vérification du mot de passe avec le hash
    const validPassword = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: "Identifiant ou mot de passe incorrect"
      });
    }

    // Connexion réussie
    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role_id: user.role_id,
        role_code: user.role_code,
        role_name: user.role_name
      }
    });

  } catch (error) {

    console.error("Erreur de connexion :", error);

    return res.status(500).json({
      success: false,
      message: "Erreur interne du serveur"
    });
  }
}
