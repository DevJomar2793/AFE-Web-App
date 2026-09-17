"use client";

import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useState } from "react";

interface PasswordInputProps {
  id: string;
  name: string;
  autoComplete: string;
  placeholder: string;
  className: string;
  minLength?: number;
}

export function PasswordInput({
  id,
  name,
  autoComplete,
  placeholder,
  className,
  minLength,
}: PasswordInputProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <div className="relative">
      <LockKeyhole
        aria-hidden="true"
        size={30}
        className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[#4d5a61]"
      />
      <input
        id={id}
        name={name}
        type={isPasswordVisible ? "text" : "password"}
        autoComplete={autoComplete}
        required
        minLength={minLength}
        placeholder={placeholder}
        className={className}
      />
      <button
        type="button"
        onClick={() => setIsPasswordVisible(!isPasswordVisible)}
        className="absolute right-4 top-1/2 -translate-y-1/2 rounded p-1 text-[#6b7780] hover:text-[#075c2d] focus:outline-none focus:ring-2 focus:ring-[#579266]"
        aria-label={isPasswordVisible ? "Hide password" : "Show password"}
      >
        {isPasswordVisible ? <Eye size={30} /> : <EyeOff size={30} />}
      </button>
    </div>
  );
}
