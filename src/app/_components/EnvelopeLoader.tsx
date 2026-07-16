"use client";

import { useRef, useState } from "react";
import AudioPlayer, { AudioAPI } from "./AudioPlayer";

export function EnvelopeLoader({ children }: { children: React.ReactNode }) {
  const [fading, setFading] = useState(false);
  const [done,   setDone]   = useState(false);
  const videoRef  = useRef<HTMLVideoElement>(null);
  const audioApi  = useRef<AudioAPI>(null);
  const imgRef    = useRef<HTMLImageElement>(null);
  const btnRef    = useRef<HTMLButtonElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const tapped    = useRef(false);

  function handleOpen() {
    if (tapped.current) return;
    tapped.current = true;

    if (btnRef.current) btnRef.current.style.display = "none";

    const vid = videoRef.current;
    const img = imgRef.current;
    if (!vid || !img) return;

    const crossfade = () => {
      requestAnimationFrame(() => {
        vid.style.transition = "opacity 0.15s ease-in";
        vid.style.opacity    = "1";
        requestAnimationFrame(() => {
          img.style.transition = "opacity 0.15s ease-out";
          img.style.opacity    = "0";
        });
      });
    };

    vid.addEventListener("playing", function once() {
      vid.removeEventListener("playing", once);
      crossfade();
    });

    vid.play().catch(() => crossfade());
  }

  function handleVideoEnd() {
    // Fade out todo el loader sobre la invitación ya renderizada
    setFading(true);
  }

  function handleFadeOutEnd() {
    setDone(true);
    // Reproducir canción al revelar la invitación (disco de vinil visible)
    audioApi.current?.play();
  }

  return (
    <>
      {/* Reproductor de música con disco de vinil — controla la canción y aparece al revelar la invitación */}
      <AudioPlayer ref={audioApi} />

      {/* Invitación siempre en DOM, visible debajo del loader */}
      {children}

      {/* Loader encima — se desvanece al terminar el video */}
      {!done && (
        <div
          ref={loaderRef}
          onTransitionEnd={fading ? handleFadeOutEnd : undefined}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "#1a1612",
            zIndex: 9999,
            overflow: "hidden",
            opacity: fading ? 0 : 1,
            transition: fading ? "opacity 0.65s ease-out" : "none",
            pointerEvents: fading ? "none" : undefined,
          }}
        >
          {/* Video */}
          <video
            ref={videoRef}
            src="/sobre-abriendo.mp4"
            onEnded={handleVideoEnd}
            playsInline
            muted
            preload="auto"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              opacity: 0,
              willChange: "opacity",
            }}
          />

          {/* Imagen sobre */}
          <img
            ref={imgRef}
            src="/sobre.png"
            alt="Sobre de invitación"
            draggable={false}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
              display: "block",
              userSelect: "none",
              WebkitUserSelect: "none",
              opacity: 1,
              willChange: "opacity",
              pointerEvents: "none",
            }}
          />

          {/* Botón glassmorphism */}
          <button
            ref={btnRef}
            onClick={handleOpen}
            style={{
              position: "absolute",
              bottom: "10vh",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 10,
              background: "rgba(255,255,255,0.12)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid rgba(198,138,82,0.35)",
              borderRadius: 40,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "16px 36px",
              WebkitTapHighlightColor: "transparent",
              touchAction: "manipulation",
              boxShadow: "0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.15)",
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 32 32"
              fill="none"
              stroke="#D4A56A"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M10 14 V6 a2 2 0 0 1 4 0 v8" />
              <path d="M14 10 V8 a2 2 0 0 1 4 0 v6" />
              <path d="M18 11 V9 a2 2 0 0 1 4 0 v10 c0 5-4 9-8 9 a8 8 0 0 1-8-8 v-5 a2 2 0 0 1 4 0 v4" />
            </svg>
            <span
              style={{
                fontFamily: "var(--font-script)",
                fontWeight: 400,
                fontSize: 22,
                color: "#D4A56A",
                letterSpacing: "0.02em",
                textShadow: "0 1px 4px rgba(0,0,0,0.3)",
              }}
            >
              Toca para abrir
            </span>
          </button>
        </div>
      )}
    </>
  );
}
