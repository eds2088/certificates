// As senhas não ficam no código: só guardamos o resultado do PBKDF2
// (SHA-256, 200 000 iterações) e comparamos com o que a pessoa digitou.
// Para trocar uma senha, gere um novo hash com o mesmo SALT e ITERATIONS:
//   node -e 'console.log(require("crypto").pbkdf2Sync("admin:NOVA", Buffer.from("<SALT>", "hex"), 200000, 32, "sha256").toString("hex"))'
// (para o login, use "login:<usuário>:<senha>")

const SALT = "6038bf01c991dc114864cc1705c2d793";
const ITERATIONS = 200_000;

const LOGIN_HASH = "46cfbb3632cf127c47084b7d5ec8a34cf7f035af1b16ee0703c0335a5ea1c35e";
const ADMIN_HASH = "a62f6221e87449e2d3ea460f58500af2b904ff29004724fb0a0156f3083f5144";

const hexToBytes = (hex: string) =>
  new Uint8Array(hex.match(/.{2}/g)!.map((b) => parseInt(b, 16)));

async function derive(input: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(input),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: hexToBytes(SALT), iterations: ITERATIONS },
    key,
    256,
  );
  return Array.from(new Uint8Array(bits), (b) => b.toString(16).padStart(2, "0")).join("");
}

export const checkLogin = async (username: string, password: string) =>
  (await derive(`login:${username}:${password}`)) === LOGIN_HASH;

export const checkAdminPassword = async (password: string) =>
  (await derive(`admin:${password}`)) === ADMIN_HASH;
