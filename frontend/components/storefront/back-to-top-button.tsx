"use client";

import { ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";

const SHOW_BUTTON_AFTER_PX = 600;

export function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => {
      setIsVisible(window.scrollY > SHOW_BUTTON_AFTER_PX);
    };

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    return () => window.removeEventListener("scroll", updateVisibility);
  }, []);

  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed bottom-5 right-5 z-40 inline-flex icon-button border-[#173b24] bg-[#173b24] text-white shadow-xl transition duration-300 ${
        isVisible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <ChevronUp aria-hidden="true" />
    </button>
  );
}
