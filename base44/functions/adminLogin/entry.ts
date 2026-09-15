import { secrets } from "base44:runtime";

// Puerta secreta del admin (tipo juego): el acceso se abre SOLO con el código
// 197919. Cuando el código coincide, el backend inicia sesión con la cuenta
// admin oculta de Base44 (ADMIN_ACCOUNT_EMAIL/ADMIN_ACCOUNT_PASSWORD) y
// devuelve el access_token real. El correo y la contraseña ocultos nunca salen
// del backend, y no se pide usuario ni contraseña al admin.
//
// Nota: la cuenta oculta sigue siendo necesaria porque el panel de admin hace
// CRUD (productos, empaques, ventas) que requiere una sesión admin real para
// cumplir el RLS. Sin ella, la puerta se abriría pero ningún guardado funcionaría.
export default async function (req: Request): Promise<Response> {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const { code } = body || {};
    if (!code) {
      return Response.json({ error: "Falta el código" }, { status: 400 });
    }

    // Código secreto del admin.
    if (String(code) !== "197919") {
      return Response.json({ error: "Código incorrecto" }, { status: 401 });
    }

    const email = secrets.get("ADMIN_ACCOUNT_EMAIL");
    const accountPass = secrets.get("ADMIN_ACCOUNT_PASSWORD");
    if (!email || !accountPass) {
      return Response.json({ error: "Cuenta admin oculta no configurada" }, { status: 500 });
    }

    // appId determinista: el dispatcher de funciones envía "base44-app-id".
    const appId = req.headers.get("base44-app-id") || secrets.get("BASE44_APP_ID") || "";
    if (!appId) {
      return Response.json({ error: "No se pudo identificar la aplicación" }, { status: 500 });
    }

    // Origen determinista: el dispatcher envía "base44-api-url" con el origen
    // público de la app, el mismo host que el SDK usa para me().
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