"use client";

import { useState } from "react";

import { useAuth } from "@acme/auth/react";
import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";

export function AuthShowcase() {
  const { session, status, login, logout } = useAuth();
  const [email, setEmail] = useState("demo@example.com");
  const [password, setPassword] = useState("password");
  const [error, setError] = useState<string | null>(null);

  if (status === "loading") {
    return (
      <section className="bg-card/80 min-h-full rounded-md border border-white/10 p-5 shadow-xl shadow-black/20">
        <p className="text-muted-foreground text-sm">Checking session...</p>
      </section>
    );
  }

  if (!session) {
    return (
      <section className="bg-card/80 flex min-h-full w-full flex-col gap-4 rounded-md border border-white/10 p-5 shadow-xl shadow-black/20">
        <div>
          <p className="text-accent text-xs font-semibold uppercase">
            Auth flow
          </p>
          <h2 className="text-foreground mt-1 text-xl font-semibold">
            Sign in to unlock CRUD
          </h2>
          <p className="text-muted-foreground mt-2 text-sm leading-6">
            Demo credentials are prefilled so every app can prove the same
            cookie-backed access model.
          </p>
        </div>
        <Input
          type="email"
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          type="password"
          autoComplete="current-password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error ? (
          <p className="text-destructive text-center text-sm">{error}</p>
        ) : null}
        <Button
          className="mt-auto"
          onClick={async () => {
            setError(null);
            try {
              await login(email, password);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Login failed");
            }
          }}
        >
          Sign in
        </Button>
      </section>
    );
  }

  return (
    <section className="bg-card/80 flex min-h-full w-full flex-col justify-between gap-5 rounded-md border border-white/10 p-5 shadow-xl shadow-black/20">
      <div>
        <p className="text-accent text-xs font-semibold uppercase">
          Authenticated
        </p>
        <h2 className="text-foreground mt-1 text-xl font-semibold">
          {session.user.name}
        </h2>
        <p className="text-muted-foreground mt-2 text-sm leading-6">
          This session can create, edit, and delete posts across the boilerplate
          flow.
        </p>
      </div>

      <Button variant="secondary" onClick={() => void logout()}>
        Sign out
      </Button>
    </section>
  );
}
