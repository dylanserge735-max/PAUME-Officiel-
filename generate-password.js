import crypto from "crypto";

const password = process.argv[2];

if (!password) {
  console.error("Utilisation : node generate-password.js \"VotreMotDePasse\"");
  process.exit(1);
}

const salt = crypto.randomBytes(16).toString("hex");

const hash = crypto
  .scryptSync(password, salt, 64)
  .toString("hex");

console.log("\nHASH À ENREGISTRER DANS NEON :\n");
console.log(`${salt}:${hash}`);
console.log("");
