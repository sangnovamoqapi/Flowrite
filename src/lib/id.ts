/**
 * Generates an 8-character base62 ID.
 * ~218 trillion possible combinations, collision-free for local/app use.
 */
export function generateId(length: number = 8): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const cryptoObj = typeof window !== "undefined" ? window.crypto : require("crypto").webcrypto;
  const randomBytes = new Uint8Array(length);
  cryptoObj.getRandomValues(randomBytes);
  
  for (let i = 0; i < length; i++) {
    result += chars[randomBytes[i] % chars.length];
  }
  return result;
}
