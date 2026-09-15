import { secrets } from "base44:runtime";

// Comparación de tiempo constante para no filtrar qué credencial falló.
const timingSafeEqual = (a, b) => {
  const enc = new TextEncoder();
  const ba = enc.encode(String(a));
  const bb = enc.encode(String(b));
  if (ba.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ba.length; i++) diff |= ba[i] ^ bb[i];
  return diff === 0;
};

// El admin entra a Marea con su combinación secreta (ADMIN_USERNAME/ADMIN_PASSWORD).
// Solo si esa combinación coincide, el backend inicia sesión con la cuenta admin
// oculta de Base44 (ADMIN_ACCOUNT_EMAIL/ADMIN_ACCOUNT_PASSWORD) y devuelve el
// access_token real. El correo y la contraseña ocultos nunca salen del backend.
export default async function (req: Request): Promise<Response> {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const { username, password } = body || {};
    if (!username || !password) {
      return Response.json({ error: "Faltan credenciales" }, { status: 400 });
    }

    const adminUser = secrets.get("ADMIN_USERNAME");
    const adminPass = secrets.get("ADMIN_PASSWORD");
    if (!adminUser || !adminPass) {
      return Response.json({ error: "Acceso admin no configurado" }, { status: 500 });
    }

    const valid =
      timingSafeEqual(username, adminUser) && timingSafeEqual(password, adminPass);
    if (!valid) {
      return Response.json({ error: "Combinación inválida" }, { status: 401 });
    }

    const email = secrets.get("ADMIN_ACCOUNT_EMAIL");
    const accountPass = secrets.get("ADMIN_ACCOUNT_PASSWORD");
    if (!email || !accountPass) {
      return Response.json({ error: "Cuenta admin oculta no configurada" }, { status: 500 });
    }

    const appId = secrets.get("BASE44_APP_ID");
    const apiUrl = req.headers.get("Base44-Api-Url") || "https://base44.app";

    const loginRes = await fetch(`${apiUrl}/api/apps/${appId}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: accountPass }),
    });

    if (!loginRes.ok) {
      return Response.json(
        { error: "No se pudo iniciar sesión con la cuenta admin" },
        { status: 502 }
      );
    }

    const data = await loginRes.json();
    if (!data || !data.access_token) {
      return Response.json({ error: "Token no recibido" }, { status: 502 });
    }

    return Response.json({ access_token: data.access_token });
  } catch (error) {
    return Response.json(
      { error: error.message || "Error interno" },
      { status: 500 }
    );
  }
}