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

    // appId determinista: el dispatcher de funciones envía "base44-app-id"
    // en cada invocación. No dependemos de un secret (BASE44_APP_ID) que no
    // está configurado.
    const appId = req.headers.get("base44-app-id") || secrets.get("BASE44_APP_ID") || "";
    if (!appId) {
      return Response.json({ error: "No se pudo identificar la aplicación" }, { status: 500 });
    }

    // Origen determinista: el dispatcher envía "base44-api-url" con el origen
    // público de la app, que es el mismo host que el SDK usa para me() (rutas
    // relativas). Así el token se minta sobre el mismo host que luego lo
    // valida. No usamos req.url (es una URL interna del dispatcher) ni
    // X-Origin-URL (frágil).
    const apiUrl = req.headers.get("base44-api-url") || new URL(req.url).origin;

    const loginRes = await fetch(`${apiUrl}/api/apps/${appId}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-App-Id": appId || "",
      },
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