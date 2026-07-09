"use client";

import { useState } from "react";

const links = [
  { label: "Ceremonia", href: "#ceremonia" },
  { label: "Itinerario", href: "#itinerario" },
  { label: "Hospedaje", href: "#hospedaje" },
  { label: "Regalos", href: "#regalos" },
  { label: "RSVP", href: "#rsvp" },
];

export function NavbarClient() {
  const [open, setOpen] = useState(false);

  return (
    <nav
      style={{ backgroundColor: "#0D0D0D" }}
      className="fixed top-0 left-0 right-0 z-50"
      role="navigation"
      aria-label="Navegación principal"
    >
      <div className="flex items-center justify-between px-6 h-14">
        <span
          className="text-white text-sm tracking-[0.3em] uppercase select-none"
          style={{ fontFamily: "var(--font-body)", fontWeight: 600 }}
        >
          A&F
        </span>

        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          className="relative flex flex-col justify-center items-center w-11 h-11 cursor-pointer"
        >
          <span
            className="absolute block h-[1.5px] w-5 bg-white transition-all duration-200 origin-center"
            style={{ transform: open ? "rotate(45deg)" : "translateY(-4px)" }}
          />
          <span
            className="absolute block h-[1.5px] w-5 bg-white transition-all duration-200"
            style={{ opacity: open ? 0 : 1 }}
          />
          <span
            className="absolute block h-[1.5px] w-5 bg-white transition-all duration-200 origin-center"
            style={{ transform: open ? "rotate(-45deg)" : "translateY(4px)" }}
          />
        </button>
      </div>

      {open && (
        <div
          style={{ backgroundColor: "#0D0D0D" }}
          className="border-t border-white/10 flex flex-col items-center gap-7 py-10"
        >
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setOpen(false)}
              className="text-white/90 hover:text-white text-[13px] tracking-[0.25em] uppercase transition-colors"
              style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}
            >
              {l.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}
