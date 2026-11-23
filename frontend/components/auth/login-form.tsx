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
  const [rememberMe, setRememberMe] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    try {
      const loginResponse = await loginUser({ email, password, rememberMe });
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
    <form className="mt-5 sm:mt-6" onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-base font-bold text-[#082d20] sm:text-lg"
          >
            Email Address
          </label>
          <div className="relative">
            <Mail
              aria-hidden="true"
              size={24}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#4d5a61]"
            />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={isSubmitting}
              placeholder="you@example.com"
              className="h-13 w-full rounded-xl border-2 border-[#d0d6d8] bg-white pl-13 pr-4 text-base text-[#213238] outline-none transition focus:border-[#579266] focus:ring-4 focus:ring-[#579266]/15 placeholder:text-[#8a96a7] sm:h-14 sm:text-lg"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-base font-bold text-[#082d20] sm:text-lg"
          >
            Password
          </label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            placeholder="Password"
            disabled={isSubmitting}
            className="h-13 w-full rounded-xl border-2 border-[#d0d6d8] bg-white pl-13 pr-13 text-base text-[#213238] outline-none transition focus:border-[#579266] focus:ring-4 focus:ring-[#579266]/15 placeholder:text-[#8a96a7] sm:h-14 sm:text-lg"
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-[#213238] sm:text-base">
          <input
            checked={rememberMe}
            disabled={isSubmitting}
            onChange={(event) => setRememberMe(event.target.checked)}
            type="checkbox"
            className="size-4.5 accent-[#075c2d]"
          />
          Remember Me
        </label>
        <p className="text-right text-sm font-medium text-[#075d2b] sm:text-base">
          Forgot password?
        </p>
      </div>

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
        className="mt-5 h-13 w-full rounded-xl bg-[#075c2d] text-lg font-black text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] disabled:cursor-not-allowed disabled:opacity-60 sm:h-14 sm:text-xl"
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
