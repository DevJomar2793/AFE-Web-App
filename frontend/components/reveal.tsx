"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

type RevealElement = "div" | "article" | "figure" | "section" | "footer" | "p" | "h1" | "dl";

type RevealProps = {
  children: ReactNode;
  as?: RevealElement;
  className?: string;
  delay?: number;
  once?: boolean;
  variant?: "up" | "left" | "right" | "fade" | "scale";
};

export function Reveal({
  children,
  as: Component = "div",
  className = "",
  delay = 0,
  once = false,
  variant = "up",
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const revealProps = {
    className: `reveal reveal-${variant} ${isVisible ? "is-visible" : ""} ${className}`,
    style: { "--reveal-delay": `${delay}ms` } as CSSProperties,
  };
  const setRef = (node: HTMLElement | null) => {
    ref.current = node;
  };

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) {
            observer.unobserve(entry.target);
          }

          return;
        }

        if (!once) {
          setIsVisible(false);
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.14 },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [once]);

  if (Component === "article") {
    return (
      <article ref={setRef} {...revealProps}>
        {children}
      </article>
    );
  }

  if (Component === "figure") {
    return (
      <figure ref={setRef} {...revealProps}>
        {children}
      </figure>
    );
  }

  if (Component === "section") {
    return (
      <section ref={setRef} {...revealProps}>
        {children}
      </section>
    );
  }

  if (Component === "footer") {
    return (
      <footer ref={setRef} {...revealProps}>
        {children}
      </footer>
    );
  }

  if (Component === "p") {
    return (
      <p ref={setRef} {...revealProps}>
        {children}
      </p>
    );
  }

  if (Component === "h1") {
    return (
      <h1 ref={setRef} {...revealProps}>
        {children}
      </h1>
    );
  }

  if (Component === "dl") {
    return (
      <dl ref={setRef} {...revealProps}>
        {children}
      </dl>
    );
  }

  return (
    <div ref={setRef} {...revealProps}>
      {children}
    </div>
  );
}
