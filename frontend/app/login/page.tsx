import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Mail } from "lucide-react";
import { PasswordInput } from "@/components/auth/password-input";

export const metadata: Metadata = {
  title: "Sign in | Adamos Fresh Eggs",
  description: "Sign in to the Adamos Fresh Eggs inventory workspace.",
};

export default function LoginPage() {
  return (
    <main className="flex h-dvh items-center justify-center overflow-hidden bg-[#fdfdfc] px-4 sm:px-6">
      <section
        className="login-card w-full max-w-182 rounded-[2rem] border-[3px] border-[#579266] bg-white px-6 py-8 shadow-[0_18px_38px_rgba(16,40,25,0.10)] sm:px-13 sm:py-8"
        aria-labelledby="login-title"
      >
        <div className="mx-auto max-w-156">
          <div className="flex flex-col items-center text-center">
            <div className="size-32 overflow-hidden rounded-[1.75rem] border border-[#8eb18d] bg-white p-1 sm:size-36">
              <Image
                src="/adamos-fresh-eggs-logo.jpg"
                alt="Adamos Fresh Eggs"
                width={480}
                height={480}
                className="size-full object-cover"
                priority
              />
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-[#062f1c] sm:text-[2.5rem]">
              Adamos Fresh Eggs
            </h1>
            <p className="mt-1 text-xl text-[#68727a] sm:text-2xl">
              Inventory workspace
            </p>
          </div>

          <div className="mt-8 sm:mt-9">
            <h2
              id="login-title"
              className="text-center text-3xl font-black tracking-tight text-[#062f1c] sm:text-[2.5rem]"
            >
              Sign in to your account
            </h2>
            <p className="mt-1 text-center text-lg text-[#68727a] sm:text-xl">
              Access your inventory, sales, and returns
            </p>
          </div>

          <div className="mt-7 space-y-5">
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
                className="h-16 w-full rounded-xl border-2 border-[#d0d6d8] bg-white px-18 text-lg text-[#213238] outline-none transition focus:border-[#579266] focus:ring-4 focus:ring-[#579266]/15 placeholder:text-[#8a96a7] sm:text-xl"
              />
            </div>
          </div>

          <p className="mt-4 text-right text-lg font-medium text-[#075d2b]">
            Forgot password?
          </p>

          <button
            type="button"
            className="mt-5 h-17 w-full rounded-xl bg-[#075c2d] text-2xl font-black text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
          >
            Sign In
          </button>

          <div className="mt-7 flex items-center gap-4 text-lg text-[#68727a]" aria-hidden="true">
            <span className="h-px flex-1 bg-[#cfd5d7]" />
            <span>or</span>
            <span className="h-px flex-1 bg-[#cfd5d7]" />
          </div>

          <Link
            href="/register"
            className="mt-5 flex h-14 w-full items-center justify-center rounded-xl border-2 border-[#075c2d] text-xl font-black text-[#075c2d] transition hover:bg-[#eef7f0] focus:outline-none focus:ring-4 focus:ring-[#579266]/20"
          >
            Register
          </Link>

          <p className="mt-7 text-center text-base text-[#647078] sm:text-lg">
            © 2026 Adamos Fresh Eggs. Built by{" "}
            <span className="font-bold text-[#075c2d]">DevJomar</span>
          </p>
        </div>
      </section>
    </main>
  );
}
