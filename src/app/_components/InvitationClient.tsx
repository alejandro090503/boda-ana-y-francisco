"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useReducedMotion, type Variants } from "framer-motion";
import { RSVPClient } from "./RSVPClient";

/* Paleta del cliente, en tonos "piedra preciosa" de viñedo (vivos → ricos y editoriales,
   visibles pero no saturados tipo Canva): #dece59→mostaza, #79cc62→salvia bosque,
   #e6974e→terracota, #bb63c2→ciruela, #b02a31→vino. Cada sección tiene un color
   protagonista aplicado en icono + cinta + acento, no solo un detalle mínimo. */
const C = {
  black: "#0D0D0D",
  white: "#FFFFFF",
  wine: "#B02A31",        // vino — Ceremonia, CTAs primarios, ticket RSVP (contraste 6.1:1 en crema)
  wineDeep: "#8A2027",
  gold: "#A66B34",        // terracota/bronce — Mesa de Regalos, íconos (4.1:1 en crema, texto-seguro)
  goldLight: "#C17D3F",   // terracota claro — SOLO decorativo (hairlines/gradientes, no texto)
  sage: "#4F7A47",        // salvia bosque — Nuestros Padres, Cena (4.7:1 en crema)
  sageLight: "#79945F",
  olive: "#8F7620",       // mostaza — Itinerario (4.1:1 en crema, texto-seguro)
  oliveLight: "#B0932A",  // mostaza clara — SOLO decorativo
  mauve: "#83488B",       // ciruela — Hospedaje, RSVP, Fiesta (6.1:1 en crema)
  mauveLight: "#A06BA8",
  charcoal: "#2C2C2C",
  gray: "#6B6B6B",
  softGray: "#767676",
  cream: "#FAF8F5",
  border: "#E7DDD0",      // borde cálido
};

/* ─── Countdown ─── */
function Countdown() {
  const target = new Date("2026-10-10T16:00:00-06:00").getTime();
  const [now, setNow] = useState(target);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);

  const units = [
    { val: days, label: "Días" },
    { val: hours, label: "Horas" },
    { val: mins, label: "Min" },
    { val: secs, label: "Seg" },
  ];

  return (
    <div className="flex items-center justify-center">
      {units.map((u, i) => (
        <div key={u.label} className="flex items-center">
          <div className="flex flex-col items-center" style={{ minWidth: 58 }}>
            <span
              style={{
                fontFamily: "var(--font-heading)",
                fontWeight: 600,
                fontSize: 28,
                color: C.black,
                lineHeight: 1,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {String(u.val).padStart(2, "0")}
            </span>
            <span
              style={{
                fontFamily: "var(--font-heading)",
                fontStyle: "italic",
                fontSize: 10,
                color: C.gray,
                letterSpacing: "0.06em",
                marginTop: 8,
              }}
            >
              {u.label}
            </span>
          </div>
          {i < units.length - 1 && (
            <div
              style={{
                width: 1,
                height: 24,
                backgroundColor: C.gold,
                opacity: 0.3,
                marginLeft: 4,
                marginRight: 4,
              }}
              aria-hidden="true"
            />
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Ornament ─── (hairline + gema en el color protagonista de cada sección) */
function Ornament({ width = 100, tone = C.gold }: { width?: number; tone?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 my-2">
      <div style={{ height: 1.5, width: width / 2, backgroundColor: tone, opacity: 0.55 }} />
      <svg width="13" height="13" viewBox="0 0 10 10" fill="none" aria-hidden="true">
        <path d="M5 0 L6.2 3.8 L10 5 L6.2 6.2 L5 10 L3.8 6.2 L0 5 L3.8 3.8 Z" fill={tone} />
      </svg>
      <div style={{ height: 1.5, width: width / 2, backgroundColor: tone, opacity: 0.55 }} />
    </div>
  );
}

/* ─── Section Divider entre secciones ─── */
function Divider({ tone = C.mauve }: { tone?: string }) {
  return (
    <div
      className="flex items-center justify-center"
      style={{
        backgroundColor: C.cream,
        paddingTop: 24,
        paddingBottom: 24,
      }}
    >
      <div style={{ height: 1.5, width: 56, backgroundColor: tone, opacity: 0.5 }} />
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="mx-3">
        <circle cx="12" cy="12" r="1.6" fill={tone} />
        <circle cx="12" cy="12" r="5.5" stroke={tone} strokeWidth="0.75" opacity="0.55" />
      </svg>
      <div style={{ height: 1.5, width: 56, backgroundColor: tone, opacity: 0.5 }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SISTEMA DE MOVIMIENTO — reveals escalonados con resorte físico
   + rieles florales con parallax de scroll. Respeta prefers-reduced-motion.
   ═══════════════════════════════════════════════════════ */
const revealParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.14, delayChildren: 0.05 } },
};
const revealItem: Variants = {
  hidden: { opacity: 0, y: 38, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 88, damping: 15, mass: 0.9 } },
};

/* Contenedor: dispara el stagger de sus RevealItem hijos al entrar en viewport */
function Reveal({ children, className, style, ...rest }: { children: React.ReactNode; className?: string; style?: React.CSSProperties } & Record<string, unknown>) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className} style={style} {...rest}>{children}</div>;
  return (
    <motion.div
      className={className}
      style={style}
      variants={revealParent}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-90px" }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/* Hijo individual dentro de un Reveal — hereda el stagger del padre */
function RevealItem({ children, style, ...rest }: { children: React.ReactNode; style?: React.CSSProperties } & Record<string, unknown>) {
  const reduce = useReducedMotion();
  if (reduce) return <div style={style} {...rest}>{children}</div>;
  return (
    <motion.div variants={revealItem} style={style} {...rest}>
      {children}
    </motion.div>
  );
}

/* Riel floral vertical (acuarela) a un costado — deriva y rota sutilmente con el scroll,
   nunca cubre el centro donde vive el contenido. */
function FloralSide({
  src,
  side,
  width = 150,
  opacity = 0.9,
  drift = 46,
}: {
  src: string;
  side: "left" | "right";
  width?: number;
  opacity?: number;
  drift?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [drift, -drift]);
  const rotate = useTransform(scrollYProgress, [0, 1], side === "left" ? [-2.2, 2.2] : [2.2, -2.2]);

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
        width: `clamp(64px, 20vw, ${width}px)`,
        pointerEvents: "none",
        zIndex: 0,
        overflow: "hidden",
      }}
    >
      {reduce ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity }} />
      ) : (
        <motion.img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity, y, rotate }} />
      )}
    </div>
  );
}

/* Banda floral horizontal — crece desde el borde inferior de una sección, con leve parallax. */
function FloralBand({ src, height = 230, opacity = 0.95 }: { src: string; height?: number; opacity?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [26, -14]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: `clamp(150px, 26vw, ${height}px)`,
        pointerEvents: "none",
        zIndex: 0,
        overflow: "hidden",
      }}
    >
      {reduce ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "bottom", opacity }} />
      ) : (
        <motion.img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "bottom", opacity, y }} />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   HERO
   ═══════════════════════════════════════════════════════ */
function Hero() {
  const reduce = useReducedMotion();
  return (
    <section
      className="flex flex-col items-center text-center"
      style={{
        position: "relative",
        overflow: "hidden",
        minHeight: "100vh",
        backgroundColor: "#FAFAF8",
        justifyContent: "center",
        paddingTop: "clamp(56px, 10vh, 88px)",
        paddingBottom: "clamp(48px, 8vh, 80px)",
        paddingLeft: 24,
        paddingRight: 24,
      }}
    >
      <FloralSide src="/floral/rail-left-wild.webp" side="left" width={170} opacity={0.85} drift={30} />
      <FloralSide src="/floral/rail-right-wild.webp" side="right" width={170} opacity={0.85} drift={30} />

      <motion.div
        style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}
        initial={reduce ? undefined : { opacity: 0, y: 24 }}
        animate={reduce ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      >
      {/* Nombres apilados */}
      <h1
        style={{
          fontFamily: "var(--font-heading)",
          fontWeight: 700,
          fontSize: "clamp(2.8rem, 14vw, 7.5rem)",
          letterSpacing: "0.12em",
          color: C.black,
          lineHeight: 1,
          textAlign: "center",
          margin: 0,
        }}
      >
        ANA LAURA
      </h1>

      <p
        aria-hidden="true"
        style={{
          fontFamily: "var(--font-ampersand)",
          fontWeight: 400,
          fontSize: "clamp(4rem, 16vw, 8rem)",
          color: C.black,
          lineHeight: 0.9,
          margin: "clamp(-8px, -1vw, 0px) 0",
        }}
      >
        &amp;
      </p>

      <h1
        style={{
          fontFamily: "var(--font-heading)",
          fontWeight: 700,
          fontSize: "clamp(2.8rem, 14vw, 7.5rem)",
          letterSpacing: "0.12em",
          color: C.black,
          lineHeight: 1,
          textAlign: "center",
          margin: 0,
        }}
      >
        FRANCISCO
      </h1>

      {/* Texto de invitación */}
      <p
        style={{
          fontFamily: "var(--font-body)",
          fontWeight: 500,
          fontSize: "clamp(9px, 2.2vw, 11px)",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: C.charcoal,
          lineHeight: 1.9,
          textAlign: "center",
          maxWidth: 280,
          marginTop: "clamp(20px, 4vw, 32px)",
          marginBottom: 0,
        }}
      >
        Tenemos el placer de invitarlos a
        <br />
        nuestra boda que se celebrará el día
      </p>

      {/* Fecha grande */}
      <div style={{ marginTop: "clamp(16px, 3.5vw, 26px)", textAlign: "center" }}>
        <p
          style={{
            fontFamily: "var(--font-heading)",
            fontWeight: 700,
            fontSize: "clamp(2rem, 9.5vw, 5rem)",
            letterSpacing: "0.06em",
            color: C.black,
            lineHeight: 1,
            margin: 0,
          }}
        >
          OCTUBRE 10
        </p>
        <p
          style={{
            fontFamily: "var(--font-heading)",
            fontWeight: 700,
            fontSize: "clamp(2rem, 9.5vw, 5rem)",
            letterSpacing: "0.06em",
            color: C.black,
            lineHeight: 1.05,
            margin: 0,
          }}
        >
          2026
        </p>
      </div>

      {/* Línea vertical */}
      <div
        aria-hidden="true"
        style={{
          width: 1,
          height: "clamp(36px, 6vw, 52px)",
          backgroundColor: C.black,
          opacity: 0.25,
          margin: "clamp(20px, 4vw, 32px) auto 0",
        }}
      />

      {/* Lugar + countdown */}
      <p
        style={{
          fontFamily: "var(--font-heading)",
          fontStyle: "italic",
          fontWeight: 400,
          fontSize: "clamp(12px, 3vw, 15px)",
          color: C.gray,
          textAlign: "center",
          marginTop: "clamp(14px, 2.5vw, 20px)",
          marginBottom: "clamp(16px, 3vw, 24px)",
        }}
      >
        San Juan del Río, Querétaro
      </p>

      <Countdown />
      </motion.div>
    </section>
  );
}

/* ─── Section base wrapper (puro HTML) ─── */
function Section({
  id,
  children,
  bg = C.cream,
  style: styleProp,
}: {
  id?: string;
  children: React.ReactNode;
  bg?: string;
  style?: React.CSSProperties;
}) {
  return (
    <section
      id={id}
      className="text-center"
      style={{
        backgroundColor: bg,
        paddingTop: 88,
        paddingBottom: 88,
        paddingLeft: 24,
        paddingRight: 24,
        ...styleProp,
      }}
    >
      {children}
    </section>
  );
}

/* ─── Eyebrow + title group ─── */
function SectionTitle({ eyebrow, title, tone }: { eyebrow?: string; title: string; tone?: string }) {
  return (
    <>
      {eyebrow && (
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontWeight: 500,
            fontSize: 11,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: C.wine,
            textAlign: "center",
            marginBottom: 14,
          }}
        >
          {eyebrow}
        </p>
      )}
      <h2
        style={{
          fontFamily: "var(--font-heading)",
          fontWeight: 700,
          fontSize: "clamp(2rem, 9vw, 3.6rem)",
          letterSpacing: "0.05em",
          color: C.black,
          lineHeight: 1.05,
          textAlign: "center",
          marginBottom: 20,
        }}
      >
        {title}
      </h2>
      <div style={{ marginBottom: 36 }}>
        <Ornament width={100} tone={tone} />
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   FRASE — cita romántica destacada
   ═══════════════════════════════════════════════════════ */
function Frase() {
  return (
    <Section style={{ paddingTop: 88, paddingBottom: 88, position: "relative", overflow: "hidden" }}>
      <FloralSide src="/floral/rail-left-rose.webp" side="left" width={150} opacity={0.8} drift={38} />
      <FloralSide src="/floral/rail-right-rose.webp" side="right" width={150} opacity={0.8} drift={38} />
      <Reveal style={{ position: "relative", zIndex: 1, maxWidth: 520, margin: "0 auto" }}>
        <RevealItem>
          <Ornament width={70} tone={C.wine} />
        </RevealItem>
        <RevealItem style={{ margin: "28px 0" }}>
          <p
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 600,
              fontStyle: "italic",
              fontSize: "clamp(1.5rem, 6vw, 2.3rem)",
              color: C.wine,
              lineHeight: 1.5,
              textAlign: "center",
              margin: 0,
            }}
          >
            &ldquo;No fuiste antes ni después,
            <br />
            fuiste a tiempo para enamorarme de ti&rdquo;
          </p>
        </RevealItem>
        <RevealItem>
          <Ornament width={70} tone={C.wine} />
        </RevealItem>
      </Reveal>
    </Section>
  );
}

/* ═══════════════════════════════════════════════════════
   MENSAJE
   ═══════════════════════════════════════════════════════ */
function Mensaje() {
  return (
    <Section style={{ paddingBottom: 20 }}>
      <Reveal style={{ maxWidth: 460, margin: "0 auto" }}>
        <RevealItem>
          <p
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 400,
              fontStyle: "italic",
              fontSize: "clamp(1.05rem, 4vw, 1.25rem)",
              color: C.charcoal,
              lineHeight: 1.9,
              textAlign: "center",
            }}
          >
            La vida nos concedió el privilegio tan grande de conocernos y amarnos,
            y hoy queremos unir nuestras vidas para siempre
          </p>
        </RevealItem>
        <RevealItem style={{ marginTop: 18 }}>
          <p
            style={{
              fontFamily: "var(--font-heading)",
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: "clamp(1.05rem, 4vw, 1.25rem)",
              color: C.wine,
              lineHeight: 1.9,
              textAlign: "center",
              margin: 0,
            }}
          >
            En compañía de
          </p>
        </RevealItem>
      </Reveal>
    </Section>
  );
}

/* ═══════════════════════════════════════════════════════
   FAMILIAS
   ═══════════════════════════════════════════════════════ */
function Familias() {
  return (
    <Section style={{ paddingTop: 20 }}>
      <RevealItem>
        <SectionTitle title="NUESTROS PADRES" tone={C.sage} />
      </RevealItem>

      <Reveal
        style={{
          maxWidth: 520,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 40,
          alignItems: "center",
        }}
      >
        {/* Novia */}
        <RevealItem style={{ textAlign: "center" }}>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: 500,
              fontSize: 11,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: C.sage,
              textAlign: "center",
              marginBottom: 14,
            }}
          >
            Padres de la novia
          </p>
          <p
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 600,
              fontSize: 20,
              color: C.black,
              lineHeight: 1.6,
              textAlign: "center",
            }}
          >
            Silvia Gutiérrez García
            <br />
            Óscar Mendoza Monroy <span style={{ fontSize: 13, color: C.softGray }}>(Q.E.P.D.)</span>
          </p>
        </RevealItem>

        <RevealItem>
        <div className="flex flex-col items-center" style={{ gap: 8 }}>
          <div style={{ width: 1, height: 28, backgroundColor: C.border }} />
          <svg width="8" height="8" viewBox="0 0 8 8" fill={C.sage} opacity="0.85">
            <path d="M4 0 L5 3 L8 4 L5 5 L4 8 L3 5 L0 4 L3 3 Z" />
          </svg>
          <div style={{ width: 1, height: 28, backgroundColor: C.border }} />
        </div>
        </RevealItem>

        {/* Novio */}
        <RevealItem style={{ textAlign: "center" }}>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: 500,
              fontSize: 11,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: C.sage,
              textAlign: "center",
              marginBottom: 14,
            }}
          >
            Padres del novio
          </p>
          <p
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 600,
              fontSize: 20,
              color: C.black,
              lineHeight: 1.6,
              textAlign: "center",
            }}
          >
            Irma Rodríguez Orea
            <br />
            Francisco Montes Caballero
          </p>
        </RevealItem>
      </Reveal>
    </Section>
  );
}

/* ═══════════════════════════════════════════════════════
   FLORAL INTERLUDE — pausa ornamental entre Padres y Ceremonia
   ═══════════════════════════════════════════════════════ */
function FloralInterlude() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "relative",
        overflow: "hidden",
        backgroundColor: C.cream,
        height: "clamp(210px, 32vw, 320px)",
      }}
    >
      <FloralSide src="/floral/rail-left-wild.webp" side="left" width={180} opacity={0.95} drift={54} />
      <FloralSide src="/floral/rail-right-wild.webp" side="right" width={180} opacity={0.95} drift={54} />
      <Reveal
        className="flex items-center justify-center"
        style={{ position: "relative", zIndex: 1, height: "100%" }}
      >
        <RevealItem>
          <Ornament width={90} tone={C.mauve} />
        </RevealItem>
      </Reveal>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   CEREMONIA
   ═══════════════════════════════════════════════════════ */
function Ceremonia() {
  return (
    <Section id="ceremonia">
      <Reveal style={{ maxWidth: 460, margin: "0 auto" }}>
        <RevealItem>
          <SectionTitle eyebrow="Civil" title="CEREMONIA" tone={C.wine} />
        </RevealItem>

        <RevealItem
          style={{
            borderLeft: `3px solid ${C.wine}`,
            backgroundColor: "rgba(176,42,49,0.05)",
            padding: "24px 20px",
            maxWidth: 360,
            margin: "0 auto 28px",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 700,
              fontSize: 30,
              color: C.wine,
              letterSpacing: "0.04em",
              textAlign: "center",
              marginBottom: 12,
            }}
          >
            4:00 p.m.
          </p>

          <p
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 600,
              fontSize: 18,
              color: C.charcoal,
              lineHeight: 1.5,
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            Cava 57
          </p>

          <p
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: 500,
              fontSize: 16,
              color: C.gray,
              lineHeight: 1.55,
              textAlign: "center",
              margin: 0,
            }}
          >
            Carretera 57 San Juan del Río–Pedro Escobedo,
            <br />
            San Juan del Río, Querétaro
          </p>
        </RevealItem>

        <RevealItem>
        <a
          href="https://www.google.com/maps/search/?api=1&query=Cava+57+San+Juan+del+R%C3%ADo+Quer%C3%A9taro"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            fontFamily: "var(--font-body)",
            fontWeight: 600,
            fontSize: 12,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: C.wine,
            textDecoration: "none",
            paddingBottom: 6,
            borderBottom: `2px solid ${C.wine}`,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.wine} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          Ver ubicación
        </a>
        </RevealItem>
      </Reveal>
    </Section>
  );
}

/* ─── Sketch icons para itinerario ─── (cada uno recibe el color de su momento: el "hilo" de la paleta) */
function IconRings({ tone = C.black }: { tone?: string }) {
  return (
    <svg width="72" height="72" viewBox="0 0 80 80" fill="none" stroke={tone} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {/* Ring izquierdo */}
      <ellipse cx="30" cy="46" rx="16" ry="8" />
      <path d="M14 46 Q14 30 30 26 Q46 22 46 46" />
      {/* Diamante encima */}
      <path d="M24 26 L30 14 L36 26" />
      <path d="M22 22 L30 14 L38 22 L30 28 Z" />
      <line x1="22" y1="22" x2="30" y2="28" />
      <line x1="38" y1="22" x2="30" y2="28" />
      <line x1="26" y1="17" x2="34" y2="17" />
      {/* Ring derecho */}
      <ellipse cx="50" cy="52" rx="16" ry="8" />
      <path d="M34 52 Q34 36 50 32 Q66 28 66 52" />
    </svg>
  );
}
function IconCoctel({ tone = C.black }: { tone?: string }) {
  return (
    <svg width="72" height="72" viewBox="0 0 80 80" fill="none" stroke={tone} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {/* Copa martini */}
      <path d="M16 18 L40 52 L64 18 Z" />
      <line x1="40" y1="52" x2="40" y2="68" />
      <line x1="30" y1="68" x2="50" y2="68" />
      {/* Decoración oliva */}
      <circle cx="52" cy="30" r="4" />
      <line x1="56" y1="26" x2="62" y2="20" />
      {/* Líquido */}
      <path d="M22 28 Q40 34 58 28" strokeDasharray="2 2" opacity="0.4" />
    </svg>
  );
}
function IconRecepcion({ tone = C.black }: { tone?: string }) {
  return (
    <svg width="72" height="72" viewBox="0 0 80 80" fill="none" stroke={tone} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {/* Copa champagne izquierda */}
      <path d="M24 16 Q20 32 28 40 L28 62" />
      <path d="M24 16 Q28 32 28 40" />
      <line x1="20" y1="62" x2="36" y2="62" />
      {/* Copa champagne derecha */}
      <path d="M56 16 Q52 32 52 40 L52 62" />
      <path d="M56 16 Q60 32 52 40" />
      <line x1="44" y1="62" x2="60" y2="62" />
      {/* Burbujas */}
      <circle cx="26" cy="28" r="1.2" fill={tone} opacity="0.6" />
      <circle cx="28" cy="22" r="0.9" fill={tone} opacity="0.6" />
      <circle cx="54" cy="26" r="1.2" fill={tone} opacity="0.6" />
      <circle cx="56" cy="20" r="0.9" fill={tone} opacity="0.6" />
      {/* Brindis */}
      <path d="M28 40 Q40 35 52 40" />
    </svg>
  );
}
function IconCena({ tone = C.black }: { tone?: string }) {
  return (
    <svg width="72" height="72" viewBox="0 0 80 80" fill="none" stroke={tone} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {/* Tenedor */}
      <line x1="26" y1="16" x2="26" y2="64" />
      <line x1="20" y1="16" x2="20" y2="32" />
      <line x1="26" y1="16" x2="26" y2="32" />
      <line x1="32" y1="16" x2="32" y2="32" />
      <path d="M20 32 Q26 38 32 32" />
      {/* Cuchillo */}
      <line x1="54" y1="16" x2="54" y2="64" />
      <path d="M54 16 Q62 24 54 38" />
    </svg>
  );
}
function IconBaile({ tone = C.black }: { tone?: string }) {
  return (
    <svg width="72" height="72" viewBox="0 0 80 80" fill="none" stroke={tone} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {/* Nota musical grande */}
      <line x1="44" y1="18" x2="44" y2="54" />
      <line x1="44" y1="18" x2="64" y2="14" />
      <line x1="64" y1="14" x2="64" y2="50" />
      <ellipse cx="38" cy="56" rx="8" ry="5" transform="rotate(-15 38 56)" />
      <ellipse cx="58" cy="52" rx="8" ry="5" transform="rotate(-15 58 52)" />
      {/* Pequeñas notas decorativas */}
      <text x="14" y="38" fontSize="16" fontFamily="serif" fill={tone} stroke="none" opacity="0.4">♩</text>
    </svg>
  );
}
function IconDespedida({ tone = C.black }: { tone?: string }) {
  return (
    <svg width="72" height="72" viewBox="0 0 80 80" fill="none" stroke={tone} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {/* Media luna */}
      <path d="M50 16 A24 24 0 1 0 50 64 A19 19 0 0 1 50 16 Z" />
      {/* Destellos */}
      <path d="M22 24 l1.6 4.4 4.4 1.6 -4.4 1.6 -1.6 4.4 -1.6 -4.4 -4.4 -1.6 4.4 -1.6 Z" fill={tone} stroke="none" opacity="0.7" />
      <path d="M30 50 l1.1 3 3 1.1 -3 1.1 -1.1 3 -1.1 -3 -3 -1.1 3 -1.1 Z" fill={tone} stroke="none" opacity="0.55" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════
   PHOTO DIVIDER — Foto entre secciones (sustituye al divider ornamental)
   ═══════════════════════════════════════════════════════ */
function PhotoDivider({ src, aspect = "16 / 10", tone = C.gold }: { src: string; aspect?: string; tone?: string }) {
  return (
    <div
      aria-hidden="true"
      style={{
        backgroundColor: C.cream,
        padding: "48px 24px",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <figure
        style={{
          margin: 0,
          width: "100%",
          maxWidth: 380,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: aspect,
            overflow: "hidden",
            boxShadow: "0 2px 22px rgba(13,13,13,0.08)",
            border: `2px solid ${tone}`,
          }}
        >
          {/* Esquinas decorativas en el color de la sección siguiente */}
          <div style={{ position: "absolute", top: 8, left: 8, width: 16, height: 16, borderTop: `2px solid ${C.white}`, borderLeft: `2px solid ${C.white}`, opacity: 0.9, zIndex: 2 }} />
          <div style={{ position: "absolute", top: 8, right: 8, width: 16, height: 16, borderTop: `2px solid ${C.white}`, borderRight: `2px solid ${C.white}`, opacity: 0.9, zIndex: 2 }} />
          <div style={{ position: "absolute", bottom: 8, left: 8, width: 16, height: 16, borderBottom: `2px solid ${C.white}`, borderLeft: `2px solid ${C.white}`, opacity: 0.9, zIndex: 2 }} />
          <div style={{ position: "absolute", bottom: 8, right: 8, width: 16, height: 16, borderBottom: `2px solid ${C.white}`, borderRight: `2px solid ${C.white}`, opacity: 0.9, zIndex: 2 }} />

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            loading="lazy"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
              display: "block",
              filter: "saturate(0.9) contrast(1.02)",
            }}
          />
        </div>
      </figure>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   ITINERARIO
   ═══════════════════════════════════════════════════════ */
function Itinerario() {
  const items: { confirmed: boolean; hora: string; evento: string; tone: string; icon: React.ReactNode; extra?: React.ReactNode }[] = [
    {
      confirmed: true,
      hora: "4:00 p.m.",
      evento: "CEREMONIA",
      tone: C.wine,
      icon: <IconRings tone={C.wine} />,
    },
    {
      confirmed: true,
      hora: "5:00 p.m.",
      evento: "CÓCTEL",
      tone: C.gold,
      icon: <IconCoctel tone={C.gold} />,
    },
    {
      confirmed: true,
      hora: "5:30 p.m.",
      evento: "RECEPCIÓN",
      tone: C.olive,
      icon: <IconRecepcion tone={C.olive} />,
      extra: (
        <div style={{ marginTop: 10 }}>
          <p style={{ fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 14, color: C.gray, textAlign: "center", marginBottom: 10 }}>
            Cava 57 · Carretera 57, San Juan del Río
          </p>
          <a
            href="https://www.google.com/maps/search/?api=1&query=Cava+57+San+Juan+del+R%C3%ADo+Quer%C3%A9taro"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: C.olive, textDecoration: "none" }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.olive} strokeWidth="1.7">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            Ver en mapa
          </a>
        </div>
      ),
    },
    { confirmed: true,  hora: "6:00 p.m.",      evento: "CENA",       tone: C.sage,  icon: <IconCena tone={C.sage} /> },
    { confirmed: true,  hora: "7:30 p.m.",      evento: "FIESTA",     tone: C.mauve, icon: <IconBaile tone={C.mauve} /> },
    { confirmed: true,  hora: "1:00 a.m.",      evento: "DESPEDIDA",  tone: C.wine,  icon: <IconDespedida tone={C.wine} /> },
  ];

  return (
    <Section id="itinerario">
      <RevealItem>
        <SectionTitle title="ITINERARIO" tone={C.olive} />
      </RevealItem>

      <div style={{ maxWidth: 320, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {items.map((item, i) => (
          /* Cada momento dispara su propia animación al entrar en viewport — efecto de
             revelado en cadena bajando por el itinerario, no todo junto. */
          <Reveal key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
            <RevealItem style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
              {/* Icono sketch coloreado */}
              <div style={{ opacity: item.confirmed ? 1 : 0.35 }}>
                {item.icon}
              </div>

              {/* Nombre evento */}
              <p
                style={{
                  fontFamily: "var(--font-heading)",
                  fontWeight: 700,
                  fontSize: "clamp(1.6rem, 7vw, 2.4rem)",
                  letterSpacing: "0.08em",
                  color: item.tone,
                  textAlign: "center",
                  marginTop: 8,
                  marginBottom: 6,
                  opacity: item.confirmed ? 1 : 0.4,
                }}
              >
                {item.evento}
              </p>

              {/* Hora */}
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontWeight: 400,
                  fontSize: 15,
                  color: item.confirmed ? C.charcoal : C.softGray,
                  fontStyle: item.confirmed ? "normal" : "italic",
                  textAlign: "center",
                  letterSpacing: "0.04em",
                }}
              >
                {item.hora}
              </p>

              {/* Extra (dirección / mapa) */}
              {item.extra && item.extra}
            </RevealItem>

            {/* Línea conectora vertical — hereda el color del siguiente momento (hilo de la paleta),
                se dibuja de arriba hacia abajo al revelarse */}
            {i < items.length - 1 && (
              <motion.div
                aria-hidden="true"
                variants={{ hidden: { scaleY: 0 }, show: { scaleY: 1, transition: { duration: 0.5, ease: "easeOut", delay: 0.15 } } }}
                style={{
                  width: 2,
                  height: 52,
                  backgroundColor: items[i + 1].tone,
                  opacity: 0.5,
                  margin: "20px auto",
                  transformOrigin: "top",
                }}
              />
            )}
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════════════════
   HOSPEDAJE
   ═══════════════════════════════════════════════════════ */
function Hospedaje() {
  const hoteles: {
    nombre: string;
    foto: string;
    sitio?: string;
    maps: string;
    reserva: string;
  }[] = [
    {
      nombre: "Misión San Gil",
      foto: "/hotels/mision-san-gil.jpg",
      maps: "https://www.google.com/maps/search/?api=1&query=Hotel+Misi%C3%B3n+San+Gil+San+Juan+del+R%C3%ADo",
      reserva: "Solo por llamada · Tel. 427 184 2959 · Código ANAYFRAN",
    },
    {
      nombre: "Fiesta Americana Hacienda Galindo",
      foto: "/hotels/hacienda-galindo.jpg",
      sitio: "https://www.corpo-rate.com/login?groupId=G1W00Q@GAL",
      maps: "https://www.google.com/maps/search/?api=1&query=Fiesta+Americana+Hacienda+Galindo+Resort+Spa",
      reserva: "Llamada 800 504 5000 o en línea · Código G1W00Q@GAL",
    },
  ];

  return (
    <Section id="hospedaje">
      <Reveal>
        <RevealItem>
          <SectionTitle title="HOSPEDAJE" tone={C.mauve} />
        </RevealItem>

        <RevealItem>
          <p
            style={{
              fontFamily: "var(--font-heading)",
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: 17,
              color: C.gray,
              lineHeight: 1.7,
              textAlign: "center",
              maxWidth: 360,
              margin: "0 auto 48px",
            }}
          >
            Hemos seleccionado opciones de hospedaje cercanas para tu comodidad.
          </p>
        </RevealItem>
      </Reveal>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 24,
          alignItems: "center",
          width: "100%",
          maxWidth: 320,
          margin: "0 auto",
        }}
      >
        {hoteles.map((h) => (
          <Reveal key={h.nombre} style={{ width: "100%" }}>
          <RevealItem
            style={{
              position: "relative",
              width: "100%",
              backgroundColor: C.white,
              boxShadow: "0 2px 24px rgba(13,13,13,0.07)",
              overflow: "hidden",
              border: `1px solid ${C.mauve}`,
              borderTop: "none",
            }}
          >
            {/* Foto del hotel */}
            <div style={{ width: "100%", height: 170, overflow: "hidden", position: "relative" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={h.foto}
                alt={h.nombre}
                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }}
              />
              {/* Degradado sutil sobre la foto */}
              <div aria-hidden="true" style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 48, background: "linear-gradient(to bottom, transparent, rgba(13,13,13,0.18))" }} />
            </div>

            {/* Cinta ciruela — color protagonista de Hospedaje */}
            <div style={{ height: 5, backgroundColor: C.mauve }} />

            {/* Cuerpo */}
            <div style={{ padding: "22px 28px 24px", display: "flex", flexDirection: "column", alignItems: "center" }}>

              {/* Esquinas decorativas en ciruela */}
              <div style={{ position: "absolute", top: 176, left: 12, width: 16, height: 16, borderTop: `2px solid ${C.mauve}`, borderLeft: `2px solid ${C.mauve}` }} aria-hidden="true" />
              <div style={{ position: "absolute", top: 176, right: 12, width: 16, height: 16, borderTop: `2px solid ${C.mauve}`, borderRight: `2px solid ${C.mauve}` }} aria-hidden="true" />

              {/* Nombre */}
              <p style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "clamp(1.1rem, 5vw, 1.4rem)", letterSpacing: "0.12em", color: C.black, lineHeight: 1.2, textAlign: "center" }}>
                {h.nombre.toUpperCase()}
              </p>

              {/* Línea ciruela */}
              <div aria-hidden="true" style={{ height: 2, width: 36, backgroundColor: C.mauve, margin: "16px auto" }} />

              {/* Reservación */}
              <p style={{ fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 14, lineHeight: 1.6, color: C.charcoal, textAlign: "center", maxWidth: 250, marginBottom: 18 }}>
                {h.reserva}
              </p>

              {/* Botones en fila */}
              <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>
                {h.sitio && (
                <a
                  href={h.sitio}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontFamily: "var(--font-body)",
                    fontWeight: 600,
                    fontSize: 10,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: C.white,
                    textDecoration: "none",
                    backgroundColor: C.wine,
                    padding: "9px 16px",
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20M2 12h20"/></svg>
                  Reservar
                </a>
                )}
                <a
                  href={h.maps}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontFamily: "var(--font-body)",
                    fontWeight: 600,
                    fontSize: 10,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: C.mauve,
                    textDecoration: "none",
                    border: `1.5px solid ${C.mauve}`,
                    padding: "9px 16px",
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.mauve} strokeWidth="1.7" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  Ubicación
                </a>
              </div>
            </div>

            {/* Cinta ciruela inferior */}
            <div style={{ height: 3, backgroundColor: C.mauve, opacity: 0.6 }} />
          </RevealItem>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════════════════
   VESTIMENTA
   ═══════════════════════════════════════════════════════ */
function Vestimenta() {
  return (
    <Section>
      <Reveal style={{ maxWidth: 360, margin: "0 auto" }}>
        <RevealItem>
        <h2
          style={{
            fontFamily: "var(--font-heading)",
            fontWeight: 600,
            fontSize: "clamp(2.2rem, 9vw, 3.6rem)",
            letterSpacing: "0.16em",
            color: C.black,
            lineHeight: 1,
            textAlign: "center",
            marginBottom: 36,
          }}
        >
          VESTIMENTA
        </h2>
        </RevealItem>

        {/* Siluetas elegantes — referencia editorial */}
        <RevealItem
          aria-hidden="true"
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            gap: 36,
            margin: "0 auto 32px",
          }}
        >
          {/* Dama — vestido mermaid con escote corazón */}
          <svg width="68" height="195" viewBox="0 0 80 200">
            <path
              fill={C.black}
              d="M22,6
                 L24,20
                 C16,38 12,62 18,84
                 C22,104 18,124 16,144
                 C10,168 2,188 0,200
                 L80,200
                 C78,188 70,168 64,144
                 C62,124 58,104 62,84
                 C68,62 64,38 56,20
                 L58,6
                 C56,6 48,20 40,20
                 C32,20 24,6 22,6
                 Z"
            />
          </svg>

          {/* Separador */}
          <div style={{ width: 1, height: 130, backgroundColor: C.black, opacity: 0.12, alignSelf: "center" }} />

          {/* Caballero — saco con moño */}
          <svg width="118" height="140" viewBox="0 0 140 130">
            {/* Cuerpo del saco — silueta sólida con hombros curvos */}
            <path
              fill={C.black}
              d="M0,30
                 C0,14 10,4 26,4
                 L114,4
                 C130,4 140,14 140,30
                 L140,130 L0,130 Z"
            />
            {/* Apertura V mostrando camisa */}
            <path fill="#FFFFFF" d="M50,4 L90,4 L70,68 Z" />
            {/* Moño — ala izquierda (dentro del V blanco) */}
            <polygon fill={C.black} points="58,12 58,30 68,21" />
            {/* Moño — ala derecha (dentro del V blanco) */}
            <polygon fill={C.black} points="82,12 82,30 72,21" />
            {/* Moño — nudo central */}
            <rect fill={C.black} x="66" y="13" width="8" height="16" rx="1" />
          </svg>
        </RevealItem>

        <RevealItem>
        <p
          style={{
            fontFamily: "var(--font-heading)",
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: "clamp(0.95rem, 3.5vw, 1.1rem)",
            color: C.gray,
            lineHeight: 1.75,
            textAlign: "center",
          }}
        >
          Para esta ocasión les pedimos asistir con vestimenta de etiqueta
        </p>

        <p
          style={{
            fontFamily: "var(--font-body)",
            fontWeight: 600,
            fontSize: 15,
            letterSpacing: "0.04em",
            color: C.charcoal,
            lineHeight: 1.6,
            textAlign: "center",
            marginTop: 20,
          }}
        >
          Damas: vestido largo · Caballeros: traje
        </p>
        </RevealItem>

        <div aria-hidden="true" style={{ height: 1, width: 40, background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)`, margin: "24px auto 18px" }} />

        <RevealItem>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontWeight: 500,
            fontSize: 13.5,
            color: C.gray,
            lineHeight: 1.6,
            textAlign: "center",
            marginBottom: 16,
          }}
        >
          Colores reservados para la novia
        </p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", alignItems: "flex-start" }}>
          {[
            { c: "#FFFFFF", n: "Blanco" },
            { c: "#F0F2BD", n: "Amarillo claro" },
            { c: "#FCD9FF", n: "Rosa claro" },
          ].map((s) => (
            <div key={s.c} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <span aria-hidden="true" style={{ width: 26, height: 26, borderRadius: "50%", backgroundColor: s.c, border: `1px solid ${C.border}` }} />
              <span style={{ fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 10, letterSpacing: "0.03em", color: C.softGray }}>{s.n}</span>
            </div>
          ))}
        </div>
        </RevealItem>
      </Reveal>
    </Section>
  );
}

/* ═══════════════════════════════════════════════════════
   AVISO NIÑOS
   ═══════════════════════════════════════════════════════ */
function AvisoNinos() {
  return (
    <Section>
      <Reveal style={{ maxWidth: 360, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <RevealItem>
        <svg width="22" height="22" viewBox="0 0 32 32" fill="none" stroke={C.softGray} strokeWidth="1.4" aria-hidden="true">
          <circle cx="16" cy="8" r="4" />
          <path d="M8 28 Q8 18 16 18 Q24 18 24 28" />
          <line x1="5" y1="5" x2="27" y2="27" strokeLinecap="round" />
        </svg>
        <p
          style={{
            fontFamily: "var(--font-heading)",
            fontWeight: 600,
            fontSize: "clamp(1.6rem, 7vw, 2.2rem)",
            letterSpacing: "0.12em",
            color: C.black,
            textAlign: "center",
          }}
        >
          NO NIÑOS
        </p>
        </RevealItem>
        <RevealItem>
        <p
          style={{
            fontFamily: "var(--font-heading)",
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: 16,
            color: C.gray,
            lineHeight: 1.6,
            textAlign: "center",
            maxWidth: 300,
          }}
        >
          Con cariño, celebraremos como un evento solo para adultos. Gracias por comprenderlo.
        </p>
        </RevealItem>
      </Reveal>
    </Section>
  );
}

/* ═══════════════════════════════════════════════════════
   MESA DE REGALOS
   ═══════════════════════════════════════════════════════ */
function MesaRegalos() {
  return (
    <Section id="regalos" style={{ position: "relative", overflow: "hidden" }}>
      <FloralBand src="/floral/bottom-band.webp" height={210} opacity={0.55} />
      <div style={{ position: "relative", zIndex: 1 }}>
      <Reveal>
        <RevealItem>
          <SectionTitle title="MESA DE REGALOS" tone={C.gold} />
        </RevealItem>

        <RevealItem>
          <p
            style={{
              fontFamily: "var(--font-heading)",
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: 16,
              color: C.gray,
              lineHeight: 1.75,
              textAlign: "center",
              maxWidth: 380,
              margin: "0 auto 48px",
            }}
          >
            Nuestro mejor regalo es tu presencia, pero si deseas tener un detalle con nosotros puedes hacerlo a través de:
          </p>
        </RevealItem>
      </Reveal>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 28,
          alignItems: "center",
        }}
      >
        {/* Santander */}
        <Reveal style={{ width: "100%", maxWidth: 320 }}>
        <RevealItem
          style={{
            backgroundColor: C.white,
            border: `1px solid ${C.border}`,
            borderTop: "none",
            width: "100%",
            textAlign: "center",
            overflow: "hidden",
          }}
        >
          {/* Cinta terracota — color protagonista de Mesa de Regalos */}
          <div style={{ height: 6, backgroundColor: C.gold }} />

          <div style={{ padding: "30px 24px 36px" }}>
          <p
            style={{
              fontFamily: "var(--font-heading)",
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: 13,
              color: C.wine,
              textAlign: "center",
              marginBottom: 14,
            }}
          >
            Transferencia
          </p>
          <p
            style={{
              fontFamily: "var(--font-heading)",
              fontWeight: 600,
              fontSize: 19,
              letterSpacing: "0.16em",
              color: C.black,
              textAlign: "center",
            }}
          >
            SANTANDER
          </p>
          <div
            style={{
              height: 2,
              width: 36,
              backgroundColor: C.gold,
              margin: "20px auto",
            }}
          />
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: 500,
              fontSize: 10,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: C.softGray,
              textAlign: "center",
              marginBottom: 6,
            }}
          >
            Beneficiario
          </p>
          <p
            style={{
              fontFamily: "var(--font-heading)",
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: 16,
              color: C.charcoal,
              lineHeight: 1.5,
              textAlign: "center",
            }}
          >
            Ana Laura
            <br />
            Mendoza
          </p>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: 500,
              fontSize: 10,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: C.softGray,
              textAlign: "center",
              marginTop: 18,
              marginBottom: 4,
            }}
          >
            CLABE
          </p>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: 600,
              fontSize: 15,
              letterSpacing: "0.04em",
              color: C.charcoal,
              fontVariantNumeric: "tabular-nums",
              textAlign: "center",
            }}
          >
            014680566622982430
          </p>
          </div>
        </RevealItem>
        </Reveal>
      </div>
      </div>
    </Section>
  );
}

/* ═══════════════════════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════════════════════ */
function Footer() {
  return (
    <section
      className="text-center"
      style={{
        backgroundColor: C.black,
        paddingTop: 0,
        paddingBottom: 72,
        paddingLeft: 24,
        paddingRight: 24,
      }}
    >
      <Reveal>
        {/* Firma de paleta — los 5 colores de la boda, como swatch editorial */}
        <RevealItem aria-hidden="true" style={{ display: "flex", width: "100%", height: 6, marginBottom: 56 }}>
          {[C.oliveLight, C.sage, C.goldLight, C.mauve, C.wine].map((c) => (
            <div key={c} style={{ flex: 1, backgroundColor: c }} />
          ))}
        </RevealItem>

        <RevealItem>
          <p
            aria-hidden="true"
            style={{
              fontFamily: "var(--font-script)",
              color: C.white,
              fontSize: "clamp(2.6rem, 9vw, 4.4rem)",
              lineHeight: 1,
              textAlign: "center",
            }}
          >
            A &amp; F
          </p>
        </RevealItem>

        <div
          style={{
            height: 1,
            width: 36,
            backgroundColor: "rgba(255,255,255,0.25)",
            margin: "24px auto",
          }}
        />

        <RevealItem>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: 500,
              fontSize: 11,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: C.white,
              textAlign: "center",
            }}
          >
            10 · Octubre · 2026
          </p>

          <p
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: 500,
              fontSize: 10,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.5)",
              textAlign: "center",
              marginTop: 14,
            }}
          >
            @elysium.invitaciones
          </p>
        </RevealItem>
      </Reveal>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN EXPORT
   ═══════════════════════════════════════════════════════ */
export function InvitationClient({ pases, nombre }: { pases: number; nombre: string }) {
  return (
    <main style={{ backgroundColor: C.cream, width: "100%" }}>
      <Hero />
      <Frase />
      <Mensaje />
      <Familias />
      <FloralInterlude />
      {/* PhotoDivider fotos del template retiradas a petición del cliente — pendiente
          sustituir por fotos reales de Ana Laura & Francisco (ver props: src, aspect, tone) */}
      <Ceremonia />
      <Itinerario />
      <Hospedaje />
      <Vestimenta />
      <Divider tone={C.olive} />
      <AvisoNinos />
      <MesaRegalos />
      <Divider tone={C.sage} />
      <RSVPClient pases={pases} nombre={nombre} />
      <Footer />
    </main>
  );
}
