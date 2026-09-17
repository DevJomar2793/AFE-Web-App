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
    <main className="flex h-dvh items-center justify-center overflow-hidden bg-[#fdfdfc] px-4 sm:px-6">
      <section
        className="login-card w-full max-w-182 rounded-4xl border-[3px] border-[#579266] bg-white px-6 py-8 shadow-[0_18px_38px_rgba(16,40,25,0.10)] sm:px-13 sm:py-8"
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

          <LoginForm />

          <div
            className="mt-7 flex items-center gap-4 text-lg text-[#68727a]"
            aria-hidden="true"
          >
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
