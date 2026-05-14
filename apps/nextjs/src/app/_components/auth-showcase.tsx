"use client";

import { useState } from "react";

import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";

import { useAuth } from "@acme/auth";

export function AuthShowcase() {
  const { session, status, login, logout } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (status === "loading") {
    return <p className="text-muted-foreground text-sm">Checking session…</p>;
  }

  if (!session) {
    return (
      <div className="flex w-full max-w-sm flex-col gap-3">
        <p className="text-muted-foreground text-center text-sm">
          Demo login (configure <code className="text-xs">AUTH_DEMO_EMAIL</code>{" "}
          and <code className="text-xs">AUTH_DEMO_PASSWORD</code> in{" "}
          <code className="text-xs">.env</code>).
        </p>
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
          size="lg"
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
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <p className="text-center text-2xl">
        <span>Logged in as {session.user.name}</span>
      </p>

      <Button size="lg" onClick={() => void logout()}>
        Sign out
      </Button>
    </div>
  );
}
