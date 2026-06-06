"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { isAdminAuthenticated, loginAdmin } from "@/lib/admin-auth";
import { Lock, Settings } from "lucide-react";

interface AdminGateProps {
  children: React.ReactNode;
}

export function AdminGate({ children }: AdminGateProps) {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAdminAuthenticated()) setAuthenticated(true);
  }, []);

  const handleLogin = () => {
    if (loginAdmin(password)) {
      setAuthenticated(true);
      setError("");
      setPassword("");
    } else {
      setError("Incorrect password");
    }
  };

  if (!authenticated) {
    return (
      <main className="min-h-dvh flex items-center justify-center px-6 bg-ivory">
        <div className="w-full max-w-sm p-6 rounded-3xl bg-white wedding-shadow border border-champagne/10">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-blush mx-auto mb-4">
            <Settings className="w-7 h-7 text-champagne" />
          </div>
          <h1 className="font-serif text-2xl text-center text-charcoal mb-1">Admin Login</h1>
          <p className="text-sm text-warm-gray text-center mb-6">
            Enter the admin password to manage weddings and settings.
          </p>
          <div className="space-y-3">
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="Admin password"
              autoComplete="current-password"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button variant="gold" className="w-full" onClick={handleLogin}>
              <Lock className="w-4 h-4" />
              Sign In
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
