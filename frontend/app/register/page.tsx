"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { PasswordInput } from "@/components/auth/password-input";

export default function RegisterPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/v1/auth/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        },
      );

      if (!response.ok) {
        const data: unknown = await response.json();
        const message = getErrorMessage(data);
        setErrorMessage(message);
        return;
      }

      setIsRegistered(true);
      event.currentTarget.reset();
    } catch {
      setErrorMessage("Unable to create your account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#fdfdfc] px-4 py-8 sm:px-6">
      <section
        className="w-full max-w-130 rounded-4xl border-[3px] border-[#579266] bg-white px-6 py-8 shadow-[0_18px_38px_rgba(16,40,25,0.10)] sm:px-13"
        aria-labelledby="register-title"
      >
        <h1
          id="register-title"
          className="text-center text-3xl font-black tracking-tight text-[#062f1c] sm:text-[2.5rem]"
        >
          Create your account
        </h1>
        <p className="mt-1 text-center text-lg text-[#68727a]">
          Register to access the inventory workspace.
        </p>

        {isRegistered ? (
          <div className="mt-8 text-center">
            <p className="rounded-xl bg-[#eef7f0] px-4 py-3 text-lg font-medium text-[#075c2d]">
              Your account has been created successfully.
            </p>
            <Link
              href="/login"
              className="mt-5 inline-flex h-14 items-center justify-center rounded-xl bg-[#075c2d] px-8 text-xl font-black text-white"
            >
              Go to Sign In
            </Link>
          </div>
        ) : (
          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
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
                  size={26}
                  className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[#4d5a61]"
                />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  className="h-14 w-full rounded-xl border-2 border-[#d0d6d8] bg-white pl-16 pr-5 text-lg text-[#213238] outline-none transition focus:border-[#579266] focus:ring-4 focus:ring-[#579266]/15 placeholder:text-[#8a96a7]"
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
                autoComplete="new-password"
                minLength={5}
                placeholder="At least 5 characters"
                className="h-14 w-full rounded-xl border-2 border-[#d0d6d8] bg-white pl-16 pr-14 text-lg text-[#213238] outline-none transition focus:border-[#579266] focus:ring-4 focus:ring-[#579266]/15 placeholder:text-[#8a96a7]"
              />
            </div>

            {errorMessage && (
              <p
                className="rounded-xl bg-red-50 px-4 py-3 text-base text-red-700"
                role="alert"
              >
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="h-14 w-full rounded-xl bg-[#075c2d] text-xl font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Creating account..." : "Register"}
            </button>
          </form>
        )}

        <p className="mt-7 text-center text-base text-[#647078]">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-bold text-[#075c2d] hover:underline"
          >
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}

function getErrorMessage(data: unknown) {
  if (
    typeof data === "object" &&
    data !== null &&
    "detail" in data &&
    typeof data.detail === "string"
  ) {
    return data.detail;
  }

  return "Unable to create your account. Please check your details and try again.";
}
