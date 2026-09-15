import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

// Puerta secreta del admin (easter egg tipo juego): un solo campo. Si el
// código es 197919, se desbloquea el panel /admin/inventario inmediatamente,
// sin email, usuario, contraseña ni segundo login. Todo es frontend: no hay
// backend, Secrets ni cuentas de Base44. La marca de desbloqueo vive en
// sessionStorage (persiste al recargar, se borra al cerrar la pestaña o con
// "Salir del modo administrador").
const SECRET_CODE = "197919";

export default function AdminLogin({ onClose }) {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (code === SECRET_CODE) {
      sessionStorage.setItem("marea_admin_session", "1");
      navigate("/admin/inventario");
      onClose();
    } else {
      setError("Código incorrecto");
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
          <Button type="submit" className="h-11 w-full bg-obsidian text-parchment">
            Entrar
          </Button>
        </form>
      </div>
    </div>
  );
}