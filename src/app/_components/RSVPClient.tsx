"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";

const PANEL_API = "https://panel-invitados.vercel.app/api/confirmar";
const RSVP_URL = "https://boda-ana-y-francisco.vercel.app";
const DEADLINE = new Date(2026, 7, 28, 23, 59, 59, 999);

const C = {
  black: "#0D0D0D",
  wine: "#B02A31",
  gold: "#A66B34",
  goldLight: "#C17D3F",
  mauve: "#83488B",
  gray: "#6B6B6B",
  softGray: "#767676",
  charcoal: "#2C2C2C",
  border: "#E7DDD0",
  cream: "#FAF8F5",
  white: "#FFFFFF",
} as const;

/* ─── Riel floral lateral con parallax de scroll (acuarela, no cubre el centro) ─── */
function FloralSide({ src, side, width = 150, opacity = 0.85, drift = 40 }: { src: string; side: "left" | "right"; width?: number; opacity?: number; drift?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [drift, -drift]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        left: side === "left" ? 0 : undefined,
        right: side === "right" ? 0 : undefined,
        width: `clamp(60px, 18vw, ${width}px)`,
        pointerEvents: "none",
        zIndex: 0,
        overflow: "hidden",
      }}
    >
      {reduce ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity }} />
      ) : (
        <motion.img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity, y }} />
      )}
    </div>
  );
}

/* ─── Ticket ─── */
function PaseTicket({ pases, nombre }: { pases: number; nombre: string }) {
  return (
    <div className="relative mx-auto" style={{ width: "min(300px, 88vw)" }}>
      <div
        className="absolute -inset-6 pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(176,42,49,0.12) 0%, transparent 70%)", filter: "blur(20px)" }}
        aria-hidden="true"
      />
      <div className="relative" style={{ backgroundColor: C.white, border: `1.5px solid ${C.mauve}`, boxShadow: "0 20px 60px rgba(13,13,13,0.08)", overflow: "hidden" }}>
        <div style={{ backgroundColor: C.wine, height: 6 }} />
        <div style={{ padding: "40px 32px 32px", textAlign: "center" }}>
          <div style={{ position: "absolute", top: 20, left: 14, width: 16, height: 16, borderTop: `2px solid ${C.mauve}`, borderLeft: `2px solid ${C.mauve}` }} aria-hidden="true" />
          <div style={{ position: "absolute", top: 20, right: 14, width: 16, height: 16, borderTop: `2px solid ${C.mauve}`, borderRight: `2px solid ${C.mauve}` }} aria-hidden="true" />

          <p style={{ fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: C.wine, textAlign: "center", marginBottom: 16 }}>
            Invitación de boda
          </p>

          <p style={{ fontFamily: "var(--font-script)", color: C.black, fontSize: "clamp(1.1rem, 5.5vw, 1.8rem)", lineHeight: 1.2, fontWeight: 400, textAlign: "center", width: "100%", overflowWrap: "break-word" }}>
            {nombre || "Invitado"}
          </p>

          <div style={{ height: 1, width: 40, backgroundColor: C.gold, opacity: 0.5, margin: "22px auto" }} aria-hidden="true" />

          <p style={{ fontFamily: "var(--font-heading)", fontStyle: "italic", fontWeight: 400, fontSize: 13, color: C.softGray, letterSpacing: "0.04em", marginBottom: 6 }}>
            admite
          </p>
          <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 72, color: C.black, lineHeight: 1, letterSpacing: "0.02em" }}>
            {pases}
          </p>
          <p style={{ fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: C.charcoal, textAlign: "center", marginTop: 8, marginBottom: 28 }}>
            {pases === 1 ? "Persona" : "Personas"}
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 28, marginLeft: -32, marginRight: -32 }} aria-hidden="true">
            <div style={{ height: 1, flex: 1, borderTop: `1px dashed ${C.border}` }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: C.cream, border: `1px solid ${C.border}` }} />
            <div style={{ height: 1, flex: 1, borderTop: `1px dashed ${C.border}` }} />
          </div>

          <p style={{ fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: C.charcoal, textAlign: "center", marginBottom: 4 }}>
            10 · Octubre · 2026
          </p>
          <p style={{ fontFamily: "var(--font-heading)", fontStyle: "italic", fontWeight: 400, fontSize: 13, color: C.gray, textAlign: "center", marginBottom: 20 }}>
            San Juan del Río, Querétaro
          </p>
        </div>
        <div style={{ backgroundColor: C.wine, height: 6 }} />
      </div>
    </div>
  );
}

export function RSVPClient({ pases, nombre }: { pases: number; nombre: string }) {
  const reduceMotion = useReducedMotion();
  const frozen = Date.now() > DEADLINE.getTime();
  const [choice, setChoice] = useState<"yes" | "no" | null>(null);
  const [nombres, setNombres] = useState<string[]>(Array(pases).fill(""));
  const [feedback, setFeedback] = useState("");
  const [feedbackColor, setFeedbackColor] = useState<string>(C.wine);
  const [loading, setLoading] = useState(false);
  const [btnLabel, setBtnLabel] = useState(frozen ? "Fecha límite alcanzada" : "Confirmar asistencia");

  useEffect(() => {
    if (!nombre || frozen) return;
    fetch(`${PANEL_API}?para=${encodeURIComponent(nombre)}&url_boda=${encodeURIComponent(RSVP_URL)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.estado === "confirmado" || d.estado === "declino") {
          const c = d.estado === "confirmado" ? "yes" : "no";
          setChoice(c);
          if (c === "yes" && d.nombres_confirmados?.length) {
            setNombres(d.nombres_confirmados);
          }
          setBtnLabel("Actualizar respuesta");
          setFeedback(
            c === "yes"
              ? "¡Ya tienes confirmada tu asistencia! Puedes actualizar tu respuesta."
              : "Ya tienes registrado que no podrás asistir. Puedes cambiar tu respuesta."
          );
        }
      })
      .catch(() => {});
  }, [nombre, frozen]);

  function handleSelect(c: "yes" | "no") {
    setChoice(c);
    if (c === "yes") setNombres(Array(pases).fill(""));
    setFeedback("");
  }

  async function handleConfirm() {
    if (frozen || loading) return;
    if (!choice) {
      setFeedbackColor("#C0392B");
      setFeedback("Por favor selecciona si asistirás o no.");
      return;
    }
    const nombresFilled = choice === "yes" ? nombres.filter((n) => n.trim()) : [];
    if (choice === "yes" && nombresFilled.length === 0) {
      setFeedbackColor("#C0392B");
      setFeedback("Por favor escribe al menos un nombre.");
      return;
    }
    setLoading(true);
    setBtnLabel("Enviando…");
    setFeedback("");
    try {
      await fetch(PANEL_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre || "Invitado",
          url_boda: RSVP_URL,
          estado: choice === "yes" ? "confirmado" : "declino",
          pases_confirmados: choice === "yes" ? nombresFilled.length : 0,
          nombres_confirmados: choice === "yes" ? nombresFilled : [],
        }),
      });
      setBtnLabel("Actualizar respuesta");
      setFeedbackColor(choice === "yes" ? C.wine : C.softGray);
      setFeedback(
        choice === "yes"
          ? "¡Tu asistencia ha sido confirmada! Nos vemos pronto."
          : "Hemos registrado que no podrás asistir. ¡Gracias por avisarnos!"
      );
    } catch {
      setFeedbackColor("#C0392B");
      setFeedback("Error de conexión. Intenta de nuevo.");
      setBtnLabel("Confirmar asistencia");
    } finally {
      setLoading(false);
    }
  }

  const btnBase: React.CSSProperties = {
    fontFamily: "var(--font-body)",
    fontWeight: 500,
    fontSize: 11,
    letterSpacing: "0.28em",
    textTransform: "uppercase",
    cursor: frozen ? "not-allowed" : "pointer",
    border: "none",
    padding: "16px 40px",
    transition: "opacity .25s",
    opacity: frozen ? 0.45 : 1,
  };

  return (
    <section id="rsvp" className="pt-36 pb-36 md:pt-52 md:pb-52 px-6 text-center" style={{ backgroundColor: C.cream, position: "relative", overflow: "hidden" }}>
      <FloralSide src="/floral/rail-left-rose.webp" side="left" width={150} opacity={0.75} drift={44} />
      <FloralSide src="/floral/rail-right-rose.webp" side="right" width={150} opacity={0.75} drift={44} />
      <div className="max-w-md mx-auto flex flex-col items-center" style={{ position: "relative", zIndex: 1 }}>
        {/* Eyebrow */}
        <p style={{ fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase", color: C.wine, textAlign: "center", marginBottom: 16 }}>
          Confirmar asistencia
        </p>

        <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "clamp(2.5rem, 10vw, 4rem)", letterSpacing: "0.12em", color: C.black, lineHeight: 1, marginBottom: 20 }}>
          RSVP
        </h2>

        {/* Ornament */}
        <div className="flex items-center gap-3 mb-10">
          <div style={{ height: 1.5, width: 36, backgroundColor: C.mauve, opacity: 0.55 }} />
          <svg width="13" height="13" viewBox="0 0 10 10" fill="none">
            <path d="M5 0 L6.2 3.8 L10 5 L6.2 6.2 L5 10 L3.8 6.2 L0 5 L3.8 3.8 Z" fill={C.mauve} />
          </svg>
          <div style={{ height: 1.5, width: 36, backgroundColor: C.mauve, opacity: 0.55 }} />
        </div>

        <p style={{ fontFamily: "var(--font-heading)", fontWeight: 400, fontStyle: "italic", fontSize: "clamp(1rem, 4vw, 1.2rem)", color: C.charcoal, lineHeight: 1.75, marginBottom: 48, maxWidth: 320, textAlign: "center" }}>
          Confirma tu asistencia antes del{" "}
          <span style={{ fontWeight: 600, fontStyle: "normal", color: C.black }}>28 de agosto de 2026</span>.
        </p>

        {/* Ticket with nombre — entra con resorte al hacer scroll */}
        {reduceMotion ? (
          <PaseTicket pases={pases} nombre={nombre} />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 46, scale: 0.94, rotate: -1.5 }}
            whileInView={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ type: "spring", stiffness: 80, damping: 14, mass: 1 }}
          >
            <PaseTicket pases={pases} nombre={nombre} />
          </motion.div>
        )}

        <div style={{ height: 40 }} />

        {/* Toggle */}
        {!frozen && (
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginBottom: 28 }}>
            <button
              onClick={() => handleSelect("yes")}
              style={{
                ...btnBase,
                backgroundColor: choice === "yes" ? C.wine : "transparent",
                color: choice === "yes" ? C.white : C.charcoal,
                border: `1.5px solid ${choice === "yes" ? C.wine : C.border}`,
              }}
            >
              Asistiré
            </button>
            <button
              onClick={() => handleSelect("no")}
              style={{
                ...btnBase,
                backgroundColor: choice === "no" ? C.charcoal : "transparent",
                color: choice === "no" ? C.white : C.charcoal,
                border: `1.5px solid ${choice === "no" ? C.charcoal : C.border}`,
              }}
            >
              No podré asistir
            </button>
          </div>
        )}

        {/* Name fields */}
        {choice === "yes" && (
          <div style={{ width: "100%", maxWidth: 320, display: "flex", flexDirection: "column", gap: 12, marginBottom: 28, textAlign: "left" }}>
            {nombres.map((n, i) => (
              <div key={i}>
                <p style={{ fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: C.softGray, marginBottom: 6 }}>
                  {pases === 1 ? "Tu nombre completo" : `Invitado ${i + 1}`}
                </p>
                <input
                  type="text"
                  value={n}
                  placeholder={`Invitado ${i + 1}`}
                  autoComplete="off"
                  onChange={(e) => {
                    const copy = [...nombres];
                    copy[i] = e.target.value;
                    setNombres(copy);
                  }}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: `1px solid ${C.border}`,
                    backgroundColor: C.white,
                    fontFamily: "var(--font-body)",
                    fontSize: 14,
                    color: C.black,
                    outline: "none",
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Confirm button */}
        <button
          onClick={handleConfirm}
          disabled={loading || frozen}
          style={{
            ...btnBase,
            backgroundColor: C.wine,
            color: C.white,
            paddingLeft: `calc(40px + .28em)`,
          }}
        >
          {btnLabel}
        </button>

        {/* Feedback */}
        {feedback && (
          <p style={{ fontFamily: "var(--font-heading)", fontStyle: "italic", fontSize: 16, color: feedbackColor, marginTop: 20, maxWidth: 320, textAlign: "center", lineHeight: 1.6 }}>
            {feedback}
          </p>
        )}
      </div>
    </section>
  );
}
