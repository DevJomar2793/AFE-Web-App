"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { saveAccessToken } from "@/lib/auth";
import { login } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await login(email.trim(), password);
      saveAccessToken(response.access_token);
      router.replace("/dashboard");
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Unable to sign in. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-[#f4f6f1] px-4 py-8">
      <section className="w-full max-w-md rounded-3xl border border-[#dfe5dd] bg-white p-7 shadow-sm sm:p-9">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-[#a85620]">
          Adamos Fresh Eggs
        </p>
        <h1 className="mt-3 text-3xl font-black text-[#173b24]">
          Sign in to the dashboard
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#657068]">
          Use the staff email and password provided by your administrator.
        </p>

        <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
          <label className="block text-sm font-bold text-[#243b28]">
            Email address
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 h-12 w-full rounded-xl border border-[#cfd8ce] px-3 text-base outline-none focus:border-[#173b24] focus:ring-2 focus:ring-[#173b24]/15"
            />
          </label>
          <label className="block text-sm font-bold text-[#243b28]">
            Password
            <input
              required
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 h-12 w-full rounded-xl border border-[#cfd8ce] px-3 text-base outline-none focus:border-[#173b24] focus:ring-2 focus:ring-[#173b24]/15"
            />
          </label>

          {error && (
            <p className="rounded-xl bg-[#fff0ea] px-3 py-2 text-sm font-semibold text-[#9d3f1d]" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-12 w-full rounded-xl bg-[#173b24] px-4 text-sm font-black text-white hover:bg-[#285333] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <Link href="/" className="mt-7 block text-center text-sm font-bold text-[#526b57] hover:text-[#173b24]">
          Back to storefront
        </Link>
      </section>
    </main>
  );
}
