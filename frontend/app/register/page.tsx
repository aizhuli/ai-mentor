"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { register, setToken, setUsername as saveUsername, ApiError } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { token, username: name } = await register(username, email, password);
      setToken(token);
      saveUsername(name);
      router.push("/chat");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError("That username or email is already taken.");
      } else if (err instanceof ApiError && err.status === 400) {
        setError("Please check your inputs and try again.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-khaki flex flex-col items-center justify-center p-6">
      {/* Logo / heading */}
      <div className="mb-8 text-center">
        <h1
          className="font-heading text-crimson text-6xl tracking-widest leading-none"
          style={{ letterSpacing: "0.15em" }}
        >
          NUCLEAR MENTOR
        </h1>
        <div className="mt-2 h-1 bg-crimson w-full" />
        <p className="mt-3 font-body text-crimson text-sm tracking-widest uppercase">
          Advanced Nuclear Engineering Education
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm border-2 border-crimson bg-cream p-8">
        <h2
          className="font-heading text-crimson text-3xl tracking-widest mb-6 uppercase"
          style={{ letterSpacing: "0.1em" }}
        >
          Request Access
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-body text-xs tracking-widest uppercase text-crimson mb-1">
              Username
            </label>
            <input
              type="text"
              required
              minLength={3}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-khaki border-2 border-crimson text-crimson placeholder-sand px-3 py-2 font-body text-sm focus:outline-none focus:border-teal"
              placeholder="comrade_engineer"
            />
          </div>

          <div>
            <label className="block font-body text-xs tracking-widest uppercase text-crimson mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-khaki border-2 border-crimson text-crimson placeholder-sand px-3 py-2 font-body text-sm focus:outline-none focus:border-teal"
              placeholder="engineer@reactor.gov"
            />
          </div>

          <div>
            <label className="block font-body text-xs tracking-widest uppercase text-crimson mb-1">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-khaki border-2 border-crimson text-crimson px-3 py-2 font-body text-sm focus:outline-none focus:border-teal"
            />
            <p className="mt-1 font-body text-xs text-slate opacity-70">
              Minimum 6 characters
            </p>
          </div>

          {error && (
            <p className="font-body text-xs text-crimson-dark bg-khaki border border-crimson px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-crimson text-cream font-body text-sm tracking-widest uppercase px-4 py-3 hover:bg-crimson-dark disabled:opacity-50 transition-colors"
          >
            {loading ? "REGISTERING…" : "ENLIST NOW"}
          </button>
        </form>

        <div className="mt-6 border-t border-sand pt-4">
          <p className="font-body text-xs text-slate text-center">
            Already enlisted?{" "}
            <Link
              href="/login"
              className="text-crimson underline hover:text-crimson-dark"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Bottom rule */}
      <div className="mt-8 w-full max-w-sm">
        <div className="h-px bg-crimson opacity-40" />
        <p className="mt-2 font-body text-xs text-crimson opacity-50 text-center tracking-widest">
          CLASSIFIED EDUCATIONAL SYSTEM — AUTHORIZED USERS ONLY
        </p>
      </div>
    </div>
  );
}
