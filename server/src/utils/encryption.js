import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

function getKey() {
  const keyHex = process.env.TOKEN_ENCRYPTION_KEY;

  if (!keyHex || keyHex.length !== 64) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY must be a 64 character hex string (32 bytes). Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
    );
  }

  return Buffer.from(keyHex, "hex");
}

// Used to store Spotify access/refresh tokens encrypted at rest in MongoDB,
// instead of as plain text.
export function encrypt(text) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [iv.toString("hex"), authTag.toString("hex"), encrypted.toString("hex")].join(":");
}

export function decrypt(payload) {
  const [ivHex, authTagHex, encryptedHex] = payload.split(":");
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, "hex")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
} 