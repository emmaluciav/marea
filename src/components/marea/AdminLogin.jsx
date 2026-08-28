import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, X } from "lucide-react";

// Discreet administrator login. Uses the platform's built-in secure
// authentication (loginViaEmailPassword) — credentials are never stored in
// the app. Only an account with role "admin" gains editor mode; a non-admin
// login is immediately rejected and signed out.
export default function AdminLogin({ onClose }) {
  const { checkUserAuth } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      const me = await base44.auth.me();
      if (!me || me.role !== "admin") {
        await base44.auth.logout();
        setError("This account is not authorized as an administrator.");
        return;
      }
      await checkUserAuth();
      onClose();
    } catch (err) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/40 px-6 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-lg border border-border bg-parchment p-7 shadow-xl reveal">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="font-heading text-xl text-foreground">Enter as administrator</h2>
            <p className="mt-1 text-xs text-slate">Private editor access</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
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
            <Label htmlFor="admin-email" className="text-xs uppercase tracking-wider text-slate">
              Email
            </Label>
            <Input
              id="admin-email"
              type="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="admin-pass" className="text-xs uppercase tracking-wider text-slate">
              Password
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
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying…
              </>
            ) : (
              "Enter"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}