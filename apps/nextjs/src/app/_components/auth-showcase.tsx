"use client";

import { useState } from "react";

import { useAuth } from "@acme/auth";
import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";

export function AuthShowcase() {
  const { session, status, login, logout } = useAuth();
  const [email, setEmail] = useState("demo@example.com");
  const [password, setPassword] = useState("password");
  const [error, setError] = useState<string | null>(null);

  if (status === "loading") {
    return <p className="text-muted-foreground text-sm">Checking session…</p>;
  }

  if (!session) {
    return (
      <div className="bg-muted flex min-h-full w-full flex-col gap-3 rounded-md border p-4">
        <p className="text-muted-foreground text-sm font-medium">Auth flow</p>
        <p className="text-sm">
          Sign in with the demo credentials, then sign out to verify cookie
          session handling.
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
    <div className="bg-muted flex min-h-full w-full flex-col justify-between gap-4 rounded-md border p-4">
      <p className="text-muted-foreground text-sm font-medium">Auth flow</p>
      <p className="text-lg font-semibold">
        <span>Logged in as {session.user.name}</span>
      </p>

      <Button onClick={() => void logout()}>Sign out</Button>
    </div>
  );
}
