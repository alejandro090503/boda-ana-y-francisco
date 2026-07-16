"use client";

import { useState, useEffect } from "react";

const PANEL_API = "https://panel-invitados.vercel.app/api/confirmar";
const RSVP_URL = "https://boda-ana-y-francisco.vercel.app";
const DEADLINE = new Date(2026, 7, 28, 23, 59, 59, 999);

const C = {
  black: "#0D0D0D",
  wine: "#B02A31",
  wineDeep: "#8A2027",
  gold: "#A66B34",
  goldDeep: "#8A5426",
  goldLight: "#C17D3F",
  green: "#4F7A47",
  greenDeep: "#2F5A28",
  gray: "#6B6B6B",
  softGray: "#767676",
  charcoal: "#2C2C2C",
  border: "#E7DDD0",
  cream: "#FAF8F5",
  white: "#FFFFFF",
} as const;

export function RSVPClient({ pases, nombre }: { pases: number; nombre: string }) {
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
          setFeedbackColor(c === "yes" ? C.greenDeep : C.softGray);
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
      setFeedbackColor(choice === "yes" ? C.greenDeep : C.softGray);
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

  const toggleBase: React.CSSProperties = {
    flex: 1,
    padding: "14px 8px",
    border: `1.5px solid ${C.border}`,
    background: "rgba(255,255,255,0.6)",
    cursor: frozen ? "not-allowed" : "pointer",
    fontFamily: "var(--font-heading)",
    fontStyle: "italic",
    fontSize: 17,
    color: C.charcoal,
    borderRadius: 8,
    transition: "all .25s",
  };

  return (
    <section
      id="rsvp"
      style={{ position: "relative", overflow: "hidden", backgroundColor: C.cream, padding: "clamp(72px,14vw,120px) 20px" }}
    >
      {/* Fondo floral dorado con desvanecimiento en los bordes */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url(/floral/bg-rsvp.webp)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.5,
          pointerEvents: "none",
          zIndex: 0,
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, black 14%, black 86%, transparent 100%)",
          maskImage:
            "linear-gradient(to bottom, transparent 0%, black 14%, black 86%, transparent 100%)",
        }}
      />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 560, margin: "0 auto" }}>
        <div
          style={{
            position: "relative",
            background: "rgba(255,255,255,0.86)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            border: `1px solid ${C.gold}55`,
            padding: "clamp(44px,7vw,72px) clamp(26px,5vw,60px)",
            boxShadow: "0 24px 64px rgba(138,32,39,0.10), 0 4px 20px rgba(166,107,52,0.14)",
          }}
        >
          {/* Marco interior */}
          <div aria-hidden="true" style={{ position: "absolute", inset: 10, border: `1px solid ${C.gold}33`, pointerEvents: "none" }} />

          {/* Esquinas decorativas */}
          {[
            { top: 0, left: 0, transform: "none" },
            { top: 0, right: 0, transform: "scaleX(-1)" },
            { bottom: 0, left: 0, transform: "scaleY(-1)" },
            { bottom: 0, right: 0, transform: "scale(-1,-1)" },
          ].map((pos, i) => (
            <svg
              key={i}
              viewBox="0 0 52 52"
              fill="none"
              aria-hidden="true"
              style={{ position: "absolute", width: 48, height: 48, pointerEvents: "none", ...pos }}
            >
              <path d="M2 50 L2 2 L50 2" stroke={C.gold} strokeWidth="0.9" opacity="0.6" />
              <circle cx="2" cy="2" r="2.5" fill={C.gold} opacity="0.5" />
            </svg>
          ))}

          <div style={{ textAlign: "center", position: "relative" }}>
            {/* Ornamento superior */}
            <svg viewBox="0 0 320 56" fill="none" aria-hidden="true" style={{ display: "block", margin: "0 auto 26px", width: "min(280px,72vw)", height: "auto" }}>
              <g stroke={C.gold} strokeWidth="0.9" opacity="0.85" fill="none">
                <path d="M18 28 Q50 10 82 28 Q106 42 130 28" />
                <path d="M190 28 Q214 42 238 28 Q270 10 302 28" />
                <circle cx="160" cy="28" r="5.5" />
                <circle cx="160" cy="28" r="2" fill={C.gold} stroke="none" />
                <path d="M154 20 Q160 13 166 20" opacity="0.55" />
                <path d="M154 36 Q160 43 166 36" opacity="0.55" />
              </g>
            </svg>

            <p style={{ fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase", color: C.wine, marginBottom: 16 }}>
              Confirmar asistencia
            </p>

            <h2 style={{ fontFamily: "var(--font-heading)", fontStyle: "italic", fontWeight: 500, fontSize: "clamp(2rem,6vw,3.1rem)", color: C.black, lineHeight: 1.15, marginBottom: 18 }}>
              Tu presencia <em style={{ color: C.gold, fontStyle: "italic" }}>lo es</em> todo
            </h2>

            <p style={{ fontFamily: "var(--font-heading)", fontStyle: "italic", fontWeight: 400, fontSize: "clamp(1rem,4vw,1.2rem)", color: C.charcoal, lineHeight: 1.8, marginBottom: 30, maxWidth: 420, marginLeft: "auto", marginRight: "auto" }}>
              Confirma tu asistencia antes del{" "}
              <span style={{ fontWeight: 600, fontStyle: "normal", color: C.black }}>28 de agosto de 2026</span>. Nos encantará saber que estarás con nosotros.
            </p>

            {/* Nombre del invitado */}
            {nombre && (
              <p style={{ fontFamily: "var(--font-script)", fontSize: "clamp(2rem,8vw,3rem)", color: C.wineDeep, lineHeight: 1.2, margin: "8px auto 6px", overflowWrap: "break-word" }}>
                {nombre}
              </p>
            )}

            {/* Divisor con corazón */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, maxWidth: 320, margin: "10px auto 30px" }}>
              <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, transparent, ${C.gold}77, transparent)` }} />
              <svg width="16" height="16" viewBox="0 0 24 24" fill={C.gold} style={{ opacity: 0.8, flexShrink: 0 }} aria-hidden="true">
                <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" />
              </svg>
              <div style={{ flex: 1, height: 1, background: `linear-gradient(to left, transparent, ${C.gold}77, transparent)` }} />
            </div>

            {/* Número de invitados */}
            <div style={{ maxWidth: 420, margin: "0 auto 26px", padding: "20px 30px", background: "rgba(166,107,52,0.07)", border: `1px solid ${C.gold}44`, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
              <span style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 600, letterSpacing: "0.28em", textTransform: "uppercase", color: C.softGray, textAlign: "left" }}>
                Lugares reservados
              </span>
              <span style={{ fontFamily: "var(--font-heading)", fontStyle: "italic", fontSize: "clamp(2.2rem,5vw,3rem)", color: C.wineDeep, lineHeight: 1 }}>
                {pases}
              </span>
            </div>

            {/* Toggle */}
            {!frozen && (
              <div style={{ display: "flex", gap: 10, maxWidth: 420, margin: "0 auto 18px" }}>
                <button
                  onClick={() => handleSelect("yes")}
                  style={{
                    ...toggleBase,
                    ...(choice === "yes"
                      ? { background: "rgba(79,122,71,0.14)", borderColor: C.green, color: C.greenDeep }
                      : {}),
                  }}
                >
                  ¡Ahí estaré!
                </button>
                <button
                  onClick={() => handleSelect("no")}
                  style={{
                    ...toggleBase,
                    ...(choice === "no"
                      ? { background: "rgba(166,107,52,0.10)", borderColor: C.goldDeep, color: C.goldDeep }
                      : {}),
                  }}
                >
                  No podré asistir
                </button>
              </div>
            )}

            {/* Campos de nombres */}
            {choice === "yes" && !frozen && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 420, margin: "0 auto 22px" }}>
                {nombres.map((n, i) => (
                  <input
                    key={i}
                    type="text"
                    value={n}
                    placeholder={pases === 1 ? "Tu nombre completo" : `Invitado ${i + 1}`}
                    autoComplete="off"
                    onChange={(e) => {
                      const copy = [...nombres];
                      copy[i] = e.target.value;
                      setNombres(copy);
                    }}
                    style={{
                      width: "100%",
                      padding: "15px 20px",
                      border: `1.5px solid ${C.gold}47`,
                      borderRadius: 12,
                      background: "rgba(255,255,255,0.8)",
                      fontFamily: "var(--font-body)",
                      fontSize: 15,
                      fontWeight: 500,
                      color: C.black,
                      letterSpacing: "0.03em",
                      outline: "none",
                      minHeight: 52,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Botón confirmar — píldora */}
            <button
              onClick={handleConfirm}
              disabled={loading || frozen}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                width: "100%",
                maxWidth: 420,
                margin: "0 auto",
                padding: "18px 36px",
                borderRadius: 50,
                border: `1.5px solid ${C.gold}88`,
                background: frozen
                  ? "rgba(120,118,118,0.25)"
                  : `linear-gradient(135deg, ${C.wine} 0%, ${C.wineDeep} 100%)`,
                fontFamily: "var(--font-body)",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.32em",
                textTransform: "uppercase",
                color: frozen ? C.softGray : C.cream,
                cursor: frozen ? "not-allowed" : "pointer",
                minHeight: 56,
                boxShadow: frozen ? "none" : "0 8px 24px rgba(138,32,39,0.28), 0 2px 8px rgba(166,107,52,0.2)",
                opacity: loading ? 0.7 : 1,
                transition: "opacity .25s, transform .25s",
              }}
            >
              {btnLabel}
            </button>

            {/* Feedback */}
            {feedback && (
              <p style={{ fontFamily: "var(--font-heading)", fontStyle: "italic", fontSize: 16, color: feedbackColor, marginTop: 20, maxWidth: 420, marginLeft: "auto", marginRight: "auto", lineHeight: 1.6 }}>
                {feedback}
              </p>
            )}

            {/* Fecha límite */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 26, fontFamily: "var(--font-body)", fontSize: 11, letterSpacing: "0.32em", textTransform: "uppercase", color: C.goldDeep, fontWeight: 600 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm.5 5v5.25l4.5 2.67-.75 1.23L11 13V7h1.5z" />
              </svg>
              Fecha límite · 28 de agosto de 2026
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
