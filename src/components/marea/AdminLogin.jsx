import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, X } from "lucide-react";

// Acceso discreto de administrador. El admin entra con su combinación secreta
// de usuario y contraseña (ADMIN_USERNAME/ADMIN_PASSWORD); por detrás, la
// función adminLogin valida la combinación e inicia sesión con la cuenta admin
// oculta de Base44, devolviendo un token de sesión admin real. El correo oculto
// nunca se muestra ni se pide al admin.
export default function AdminLogin({ onClose }) {
  const { checkUserAuth } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await base44.functions.invoke("adminLogin", { username, password });
      const token = res?.data?.access_token || res?.access_token;
      if (!token) {
        setError("No se pudo obtener la sesión de administrador.");
        return;
      }
      base44.auth.setToken(token);
      sessionStorage.setItem("marea_admin_session", "1");
      await checkUserAuth();
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || "Combinación inválida.";
      setError(msg);
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
            <p className="mt-1 text-xs text-slate">Acceso privado de editor</p>
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
            <Label htmlFor="admin-user" className="text-xs uppercase tracking-wider text-slate">
              Usuario
            </Label>
            <Input
              id="admin-user"
              type="text"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="h-11"
              placeholder="usuario"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="admin-pass" className="text-xs uppercase tracking-wider text-slate">
              Contraseña
            </Label>
            <Input
              id="admin-pass"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11"
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