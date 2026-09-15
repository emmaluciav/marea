import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, X } from "lucide-react";

// Acceso discreto de administrador tipo "puerta secreta": el admin entra con un
// código secreto (197919). La función adminLogin valida el código e inicia
// sesión con la cuenta admin oculta de Base44, devolviendo un token admin real.
// No se pide correo, usuario ni contraseña al admin.
export default function AdminLogin({ onClose }) {
  const { checkUserAuth } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await base44.functions.invoke("adminLogin", { code });
      const token = res?.data?.access_token || res?.access_token;
      if (!token) {
        setError("Código incorrecto");
        return;
      }
      base44.auth.setToken(token);
      sessionStorage.setItem("marea_admin_session", "1");
      // Valida la sesión admin sobre el mismo origen antes de propagarla al
      // contexto. Si no valida, se limpia el token a mano (sin logout() del
      // SDK, que haría window.location.href y dejaría la pantalla en blanco).
      try {
        const me = await base44.auth.me();
        if (!me || me.role !== "admin") throw new Error("not_admin");
      } catch {
        try { localStorage.removeItem("base44_access_token"); } catch { /* ignore */ }
        try { localStorage.removeItem("token"); } catch { /* ignore */ }
        sessionStorage.removeItem("marea_admin_session");
        setError("No se pudo abrir el panel. Intenta de nuevo.");
        return;
      }
      await checkUserAuth();
      // Código correcto → abre el panel automáticamente, sin pasos extra.
      navigate("/admin/inventario");
      onClose();
    } catch (err) {
      // 401 = código incorrecto. Otros errores (p.ej. falla el mint de la
      // cuenta oculta) no deben decir "código incorrecto".
      if (err?.response?.status === 401) {
        setError("Código incorrecto");
      } else {
        setError("No se pudo abrir el panel. Intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/40 px-6 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-lg border border-border bg-parchment p-7 shadow-xl reveal">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="font-heading text-xl text-foreground">Entrar como administrador</h2>
            <p className="mt-1 text-xs text-slate">Ingresa el código secreto</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-slate hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-sm bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="admin-code" className="text-xs uppercase tracking-wider text-slate">
              Código
            </Label>
            <Input
              id="admin-code"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="h-11 tracking-[0.3em]"
              placeholder="••••••"
              required
            />
          </div>
          <Button type="submit" disabled={loading} className="h-11 w-full bg-obsidian text-parchment">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verificando…
              </>
            ) : (
              "Entrar"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}