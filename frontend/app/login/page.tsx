import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in | Adamos Fresh Eggs",
  description: "Sign in to the Adamos Fresh Eggs inventory workspace.",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh overflow-x-hidden overflow-y-auto bg-[#fdfdfc] px-3 py-3 sm:px-6 sm:py-5">
      <section
        className="mx-auto my-auto w-full max-w-150 rounded-3xl border-[3px] border-[#579266] bg-white px-5 py-5 shadow-[0_18px_38px_rgba(16,40,25,0.10)] sm:rounded-4xl sm:px-9 sm:py-6"
        aria-labelledby="login-title"
      >
        <div className="mx-auto max-w-156">
          <div className="flex flex-col items-center text-center">
            <div className="size-18 overflow-hidden rounded-2xl border border-[#8eb18d] bg-white p-1 sm:size-22">
              <Image
                src="/adamos-fresh-eggs-logo.jpg"
                alt="Adamos Fresh Eggs"
                width={480}
                height={480}
                className="size-full object-cover"
                priority
              />
            </div>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-[#062f1c] sm:text-3xl">
              Adamos Fresh Eggs
            </h1>
            <p className="mt-0.5 text-sm text-[#68727a] sm:text-base">
              Inventory workspace
            </p>
          </div>

          <div className="mt-4 sm:mt-5">
            <h2
              id="login-title"
              className="text-center text-xl font-black tracking-tight text-[#062f1c] sm:text-3xl"
            >
              Sign in to your account
            </h2>
            <p className="mt-1 text-center text-sm text-[#68727a] sm:text-base">
              Access your inventory, sales, and returns
            </p>
          </div>

          <LoginForm />

          <div
            className="mt-5 flex items-center gap-4 text-base text-[#68727a]"
            aria-hidden="true"
          >
            <span className="h-px flex-1 bg-[#cfd5d7]" />
            <span>or</span>
            <span className="h-px flex-1 bg-[#cfd5d7]" />
          </div>

          <Link
            href="/register"
            className="mt-4 flex h-13 w-full items-center justify-center rounded-xl border-2 border-[#075c2d] text-lg font-black text-[#075c2d] transition hover:bg-[#eef7f0] focus:outline-none focus:ring-4 focus:ring-[#579266]/20 sm:h-14"
          >
            Register
          </Link>

          <p className="mt-5 text-center text-xs text-[#647078] sm:text-sm">
            © 2026 Adamos Fresh Eggs. Built by{" "}
            <span className="font-bold text-[#075c2d]">DevJomar</span>
          </p>
        </div>
      </section>
    </main>
  );
}
