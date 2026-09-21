"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { LoaderCircle, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { PasswordInput } from "@/components/auth/password-input";
import { loginUser, saveAccessToken } from "@/lib/api";

export function LoginForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    try {
      const loginResponse = await loginUser({ email, password });
      saveAccessToken(loginResponse.accessToken);
      router.push("/dashboard");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to sign in. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="mt-7" onSubmit={handleSubmit}>
      <div className="space-y-5">
        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-lg font-bold text-[#082d20]"
          >
            Email Address
          </label>
          <div className="relative">
            <Mail
              aria-hidden="true"
              size={30}
              className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[#4d5a61]"
            />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={isSubmitting}
              placeholder="you@example.com"
              className="h-16 w-full rounded-xl border-2 border-[#d0d6d8] bg-white pl-18 pr-5 text-lg text-[#213238] outline-none transition focus:border-[#579266] focus:ring-4 focus:ring-[#579266]/15 placeholder:text-[#8a96a7] sm:text-xl"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-lg font-bold text-[#082d20]"
          >
            Password
          </label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            disabled={isSubmitting}
            className="h-16 w-full rounded-xl border-2 border-[#d0d6d8] bg-white px-18 text-lg text-[#213238] outline-none transition focus:border-[#579266] focus:ring-4 focus:ring-[#579266]/15 placeholder:text-[#8a96a7] sm:text-xl"
          />
        </div>
      </div>

      <p className="mt-4 text-right text-lg font-medium text-[#075d2b]">
        Forgot password?
      </p>

      {errorMessage && (
        <p
          className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-base text-red-700"
          role="alert"
        >
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-5 h-17 w-full rounded-xl bg-[#075c2d] text-2xl font-black text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <LoaderCircle size={22} className="animate-spin" aria-hidden="true" />
            Signing in...
          </span>
        ) : (
          "Sign In"
        )}
      </button>
    </form>
  );
}
