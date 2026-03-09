"use client";
import { useState, useEffect } from "react";

type Movie = {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  release_date: string;
  vote_average: number;
};

type Provider = {
  provider_id: number;
  provider_name: string;
  logo_path: string;
};

type StreamingInfo = {
  streaming: Provider[];
  link: string;
};

type StreamingMap = {
  [key: number]: StreamingInfo;
};
const [overviewExpanded, setOverviewExpanded] = useState(false);
const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "PL", name: "Poland" },
  { code: "JP", name: "Japan" },
  { code: "BR", name: "Brazil" },
  { code: "IN", name: "India" },
];

function ProviderList({ info }: { info: StreamingInfo }) {
  if (!info) return <span style={{ color: "#7a9a6a", fontSize: "11px", fontFamily: "VT323, monospace" }}>CHECKING...</span>;
  if (!info.streaming || info.streaming.length === 0)
    return <span style={{ color: "#666", fontSize: "11px", fontFamily: "VT323, monospace" }}>NOT AVAILABLE</span>;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
      {info.streaming.map((p) => (
        <a key={p.provider_id} href={info.link} target="_blank" rel="noopener noreferrer" title={p.provider_name}>
          <img
            src={"https://image.tmdb.org/t/p/w45" + p.logo_path}
            alt={p.provider_name}
            style={{ width: "22px", height: "22px", borderRadius: "3px", opacity: 0.85 }}
          />
        </a>
      ))}
    </div>
  );
}



function MovieSlide({ movie, streaming, index }: { movie: Movie; streaming: StreamingInfo; index: number }) {
  const [visible, setVisible] = useState(false);
  const [tldrState, setTldrState] = useState<"idle" | "confirm" | "loading" | "shown">("idle");
  const [tldrText, setTldrText] = useState("");

  const year = movie.release_date ? movie.release_date.slice(0, 4) : "N/A";
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "N/A";

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 180);
    return () => clearTimeout(t);
  }, [index]);

  async function handleTldrConfirm() {
    setTldrState("loading");
    try {
      const res = await fetch("/api/tldr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: movie.title, year }),
      });
      const data = await res.json();
      setTldrText(data.summary || "Could not load summary.");
      setTldrState("shown");
    } catch {
      setTldrText("Error fetching summary.");
      setTldrState("shown");
    }
  }

  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0px)" : "translateY(40px)",
      transition: "opacity 0.5s ease, transform 0.5s ease",
      display: "flex",
      flexDirection: "column",
      cursor: "default",
    }}>
      {/* Poster */}
      <div style={{ position: "relative", marginBottom: "0" }}>
        {movie.poster_path ? (
          <img
            src={"https://image.tmdb.org/t/p/w342" + movie.poster_path}
            alt={movie.title}
            style={{
              width: "100%",
              aspectRatio: "2/3",
              objectFit: "cover",
              display: "block",
              filter: "sepia(15%) contrast(1.05) brightness(0.92)",
              borderRadius: "2px 2px 0 0",
            }}
          />
        ) : (
          <div style={{
            width: "100%", aspectRatio: "2/3",
            background: "#1a1a1a",
            display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: "2px 2px 0 0",
          }}>
            <span style={{ color: "#333", fontFamily: "VT323, monospace", fontSize: "14px", letterSpacing: "2px" }}>NO ART</span>
          </div>
        )}

        {/* Rating badge */}
        <div style={{
          position: "absolute", top: "6px", right: "6px",
          background: "rgba(0,0,0,0.85)",
          border: "1px solid #4a7a3a",
          borderRadius: "2px",
          padding: "1px 5px",
          fontFamily: "VT323, monospace",
          fontSize: "13px",
          color: "#7aaa5a",
          letterSpacing: "1px",
        }}>
          ★{rating}
        </div>
      </div>

      {/* Label strip */}
      <div style={{
        background: "#0e1a0e",
        border: "1px solid #2a4a2a",
        borderTop: "2px solid #3a6a2a",
        padding: "8px 10px",
        borderRadius: "0 0 2px 2px",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
      }}>
        <div style={{
          fontFamily: "VT323, monospace",
          fontSize: "14px",
          color: "#8aca6a",
          letterSpacing: "1px",
          lineHeight: 1.2,
          textTransform: "uppercase",
        }}>
          {movie.title}
        </div>
        <div style={{
          fontFamily: "VT323, monospace",
          fontSize: "12px",
          color: "#4a7a3a",
          letterSpacing: "1px",
        }}>
          {year}
        </div>

       {/* Overview — always visible */}
       <div>
       
        <p style={{
    fontFamily: "'Courier New', monospace", fontSize: "8px", color: "#3a5a3a",
    lineHeight: 1.5, margin: "0 0 2px 0",
    display: overviewExpanded ? "block" : "-webkit-box",
    WebkitLineClamp: overviewExpanded ? undefined : 2,
    WebkitBoxOrient: "vertical",
    overflow: overviewExpanded ? "visible" : "hidden",
  }}>
    {movie.overview}
  </p>
  {movie.overview && movie.overview.length > 80 && (
    <button
      onClick={() => setOverviewExpanded(e => !e)}
      style={{
        background: "transparent", border: "none",
        color: "#2a5a2a", fontFamily: "VT323, monospace",
        fontSize: "10px", letterSpacing: "1px",
        padding: "0", cursor: "pointer",
      }}
    >
      {overviewExpanded ? "▲ LESS" : "▼ MORE"}
    </button>
  )}
</div>


        {/* Divider */}
        {tldrState === "shown" && (
          <div style={{ borderTop: "1px solid #1a3a1a", marginTop: "2px" }} />
        )}

        {/* TLDR section */}
        {tldrState === "idle" && (
          <button
            onClick={() => setTldrState("confirm")}
            style={{
              marginTop: "2px",
              background: "transparent",
              border: "1px solid #2a5a2a",
              color: "#4a8a3a",
              fontFamily: "VT323, monospace",
              fontSize: "11px",
              letterSpacing: "2px",
              padding: "2px 6px",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => {
              (e.target as HTMLButtonElement).style.color = "#7acc5a";
              (e.target as HTMLButtonElement).style.borderColor = "#4a8a3a";
            }}
            onMouseLeave={e => {
              (e.target as HTMLButtonElement).style.color = "#4a8a3a";
              (e.target as HTMLButtonElement).style.borderColor = "#2a5a2a";
            }}
          >
            TLDR ▶
          </button>
        )}

        {tldrState === "confirm" && (
          <div style={{ marginTop: "2px" }}>
            <div style={{
              fontFamily: "VT323, monospace",
              fontSize: "11px",
              color: "#7acc5a",
              letterSpacing: "1px",
              marginBottom: "4px",
            }}>
              ⚠ CONTAINS SPOILERS
            </div>
            <div style={{ display: "flex", gap: "4px" }}>
              <button
                onClick={handleTldrConfirm}
                style={{
                  background: "rgba(74,170,42,0.15)",
                  border: "1px solid #4a8a3a",
                  color: "#7acc5a",
                  fontFamily: "VT323, monospace",
                  fontSize: "11px",
                  letterSpacing: "1px",
                  padding: "2px 8px",
                  cursor: "pointer",
                }}
              >
                SHOW
              </button>
              <button
                onClick={() => setTldrState("idle")}
                style={{
                  background: "transparent",
                  border: "1px solid #2a4a2a",
                  color: "#4a6a3a",
                  fontFamily: "VT323, monospace",
                  fontSize: "11px",
                  letterSpacing: "1px",
                  padding: "2px 8px",
                  cursor: "pointer",
                }}
              >
                CANCEL
              </button>
            </div>
          </div>
        )}

        {tldrState === "loading" && (
          <div style={{
            fontFamily: "VT323, monospace",
            fontSize: "11px",
            color: "#4a8a3a",
            letterSpacing: "2px",
            marginTop: "2px",
          }}>
            READING THE BACK...
          </div>
        )}

        {tldrState === "shown" && (
          <div style={{ marginTop: "2px" }}>
            <p style={{
              fontFamily: "'Courier New', monospace",
              fontSize: "9px",
              color: "#7acc5a",
              lineHeight: 1.5,
              marginBottom: "4px",
            }}>
              {tldrText}
            </p>
            <button
              onClick={() => { setTldrState("idle"); setTldrText(""); }}
              style={{
                background: "transparent",
                border: "none",
                color: "#2a5a2a",
                fontFamily: "VT323, monospace",
                fontSize: "10px",
                letterSpacing: "1px",
                padding: "0",
                cursor: "pointer",
              }}
            >
              ✕ HIDE
            </button>
          </div>
        )}

        <ProviderList info={streaming} />
      </div>
    </div>
  );
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState("description");
  const [results, setResults] = useState<Movie[]>([]);
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(false);
  const [country, setCountry] = useState("US");
  const [streamingData, setStreamingData] = useState<StreamingMap>({});
  const [clerkTalking, setClerkTalking] = useState(false);
  const [clerkText, setClerkText] = useState("WHAT ARE YOU LOOKING FOR TODAY?");

  async function loadStreaming(movieId: number, countryCode: string) {
    const res = await fetch("/api/streaming?movieId=" + movieId + "&country=" + countryCode);
    const data = await res.json();
    setStreamingData((prev) => ({ ...prev, [movieId]: data }));
  }

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setResults([]);
    setStreamingData({});
    setClerkTalking(true);
    setClerkText("LET ME CHECK THE BACK...");

    const res = await fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, searchType }),
    });
    const data = await res.json();
    const movies: Movie[] = data.movies || [];
    setResults(movies);
    setExplanation(data.explanation || "");
    setLoading(false);
    setClerkTalking(false);
    setClerkText(movies.length > 0 ? "HERE'S WHAT I FOUND FOR YOU." : "SORRY, NOTHING IN STOCK.");
    movies.forEach((m) => loadStreaming(m.id, country));
  }

  function handleCountryChange(newCountry: string) {
    setCountry(newCountry);
    setStreamingData({});
    results.forEach((m) => loadStreaming(m.id, newCountry));
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=VT323&family=Share+Tech+Mono&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        html, body {
          background: #050805;
          min-height: 100vh;
          overflow-x: hidden;
        }

        /* CRT flicker */
        @keyframes flicker {
          0%   { opacity: 1; }
          92%  { opacity: 1; }
          93%  { opacity: 0.94; }
          94%  { opacity: 1; }
          96%  { opacity: 0.97; }
          100% { opacity: 1; }
        }

        @keyframes scanroll {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        @keyframes slideup {
          from { transform: translateY(30px); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }

        @keyframes handslide {
          0%   { transform: translateX(60px); opacity: 0; }
          100% { transform: translateX(0px); opacity: 1; }
        }

        @keyframes pulse-green {
          0%, 100% { text-shadow: 0 0 6px #4aaa2a, 0 0 12px #2a7a1a; }
          50%       { text-shadow: 0 0 10px #6acc4a, 0 0 20px #4aaa2a; }
        }

        .crt-screen {
          animation: flicker 8s infinite;
          position: relative;
        }

        .crt-screen::before {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 255, 60, 0.015) 2px,
            rgba(0, 255, 60, 0.015) 4px
          );
          pointer-events: none;
          z-index: 10;
          border-radius: inherit;
        }

        .crt-screen::after {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.7) 100%);
          pointer-events: none;
          z-index: 11;
          border-radius: inherit;
        }

        .scanline-roll {
          position: absolute;
          left: 0; right: 0;
          height: 40px;
          background: linear-gradient(transparent, rgba(0,255,60,0.04), transparent);
          animation: scanroll 6s linear infinite;
          pointer-events: none;
          z-index: 12;
        }

        .phosphor-text {
          color: #7acc5a;
          text-shadow: 0 0 6px #4aaa2a, 0 0 12px #2a7a1a;
          font-family: 'VT323', monospace;
          animation: pulse-green 3s ease-in-out infinite;
        }

        .phosphor-dim {
          color: #4a8a3a;
          text-shadow: 0 0 4px #2a5a1a;
          font-family: 'VT323', monospace;
        }

        .crt-input {
          background: transparent;
          border: none;
          border-bottom: 2px solid #3a7a2a;
          color: #7acc5a;
          font-family: 'VT323', monospace;
          font-size: 22px;
          letter-spacing: 2px;
          outline: none;
          width: 100%;
          padding: 6px 4px;
          text-shadow: 0 0 6px #4aaa2a;
          caret-color: #7acc5a;
        }
        .crt-input::placeholder { color: #2a5a1a; }
        .crt-input:focus { border-bottom-color: #7acc5a; }

        .crt-btn {
          font-family: 'VT323', monospace;
          font-size: 18px;
          letter-spacing: 3px;
          background: transparent;
          color: #7acc5a;
          border: 2px solid #3a7a2a;
          padding: 6px 20px;
          cursor: pointer;
          text-shadow: 0 0 6px #4aaa2a;
          transition: all 0.15s;
        }
        .crt-btn:hover {
          background: rgba(74,170,42,0.15);
          border-color: #7acc5a;
        }
        .crt-btn.active {
          background: rgba(74,170,42,0.2);
          border-color: #7acc5a;
          color: #aaee8a;
        }
        .crt-btn:disabled {
          color: #2a5a1a;
          border-color: #1a3a1a;
          cursor: not-allowed;
        }

        .cursor-blink::after {
          content: '█';
          animation: blink 1s step-end infinite;
          margin-left: 2px;
        }

        .clerk-bubble {
          font-family: 'VT323', monospace;
          font-size: 18px;
          letter-spacing: 2px;
          color: #5aaa3a;
          text-shadow: 0 0 5px #3a7a1a;
          border-left: 2px solid #3a7a2a;
          padding-left: 10px;
        }

        .counter-surface {
          background: linear-gradient(180deg, #0a1a08 0%, #061006 100%);
          border-top: 3px solid #2a4a2a;
          position: relative;
        }

        .hand-svg {
          animation: handslide 0.6s ease-out forwards;
        }

        .movie-grid-item {
          animation: handslide 0.5s ease-out forwards;
        }

        select.crt-select {
          background: #061006;
          border: 1px solid #3a7a2a;
          color: #7acc5a;
          font-family: 'VT323', monospace;
          font-size: 16px;
          padding: 4px 8px;
          outline: none;
          text-shadow: 0 0 4px #4aaa2a;
          cursor: pointer;
        }
      `}</style>

      {/* Outer shell — the room behind the monitor */}
      <div style={{
        minHeight: "100vh",
        background: "radial-gradient(ellipse at 50% 40%, #0a1a0a 0%, #020802 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "30px 16px 0",
      }}>

        {/* CRT Monitor frame */}
        <div style={{
          width: "100%",
          maxWidth: "960px",
          background: "#1a2a18",
          borderRadius: "18px 18px 8px 8px",
          padding: "6px",
          boxShadow: "0 0 0 3px #0d1a0d, 0 0 0 6px #1a2a18, 0 20px 60px rgba(0,0,0,0.9), inset 0 2px 4px rgba(255,255,255,0.05)",
          position: "relative",
        }}>

          {/* Monitor brand label */}
          <div style={{
            position: "absolute", top: "-2px", left: "50%",
            transform: "translateX(-50%)",
            fontFamily: "VT323, monospace",
            fontSize: "10px",
            color: "#2a4a28",
            letterSpacing: "4px",
          }}>
            ELECTROVIEW™ MODEL 1987
          </div>

          {/* Screen bezel */}
          <div style={{
            background: "#0a1208",
            borderRadius: "12px 12px 4px 4px",
            padding: "4px",
            boxShadow: "inset 0 0 20px rgba(0,0,0,0.8)",
          }}>

            {/* The actual screen */}
            <div
              className="crt-screen"
              style={{
                background: "#020f02",
                borderRadius: "8px",
                minHeight: "560px",
                overflow: "hidden",
                position: "relative",
              }}
            >
              <div className="scanline-roll" />

              {/* Screen content */}
              <div style={{ position: "relative", zIndex: 5, padding: "28px 28px 20px" }}>

                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: "24px" }}>
                  <div className="phosphor-dim" style={{ fontSize: "12px", letterSpacing: "6px", marginBottom: "4px" }}>
                  
                  </div>
                  <div className="phosphor-text" style={{ fontSize: "clamp(32px, 5vw, 52px)", letterSpacing: "4px", lineHeight: 1 }}>
                    DOUBLE FEATURE
                  </div>
                  <div className="phosphor-dim" style={{ fontSize: "12px", letterSpacing: "4px", marginTop: "4px" }}>
                    FIND YOUR NEXT FEATURE
                  </div>
                </div>

                {/* Divider */}
                <div style={{ borderTop: "1px solid #1a4a1a", marginBottom: "20px" }} />

                {/* Clerk speech */}
                <div style={{ marginBottom: "16px", minHeight: "28px" }}>
                  <span className="clerk-bubble">
                    {loading ? (
                      <span className="cursor-blink">LET ME CHECK THE BACK</span>
                    ) : (
                      clerkText
                    )}
                  </span>
                </div>

                {/* Search type */}
                <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
                  <button
                    className={"crt-btn " + (searchType === "description" ? "active" : "")}
                    onClick={() => setSearchType("description")}
                    style={{ fontSize: "14px", padding: "4px 14px" }}
                  >
                    DESCRIBE
                  </button>
                  <button
                    className={"crt-btn " + (searchType === "title" ? "active" : "")}
                    onClick={() => setSearchType("title")}
                    style={{ fontSize: "14px", padding: "4px 14px" }}
                  >
                    TITLE
                  </button>
                </div>

                {/* Search row */}
                <div style={{ display: "flex", alignItems: "flex-end", gap: "12px", marginBottom: "10px" }}>
                  <div style={{ flex: 1 }}>
                    <div className="phosphor-dim" style={{ fontSize: "11px", letterSpacing: "3px", marginBottom: "4px" }}>
                      {searchType === "description" ? "> DESCRIBE THE MOVIE:" : "> ENTER TITLE:"}
                    </div>
                    <input
                      className="crt-input"
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                      placeholder={searchType === "description" ? "SCARY, NOT TOO GORY, LIKE GET OUT..." : "E.G. FRIDAY THE 13TH"}
                    />
                  </div>
                  <button
                    className="crt-btn"
                    onClick={handleSearch}
                    disabled={loading}
                    style={{ marginBottom: "2px", whiteSpace: "nowrap" }}
                  >
                    {loading ? "SEARCHING" : "FIND IT ►"}
                  </button>
                </div>

                {/* Explanation */}
                {explanation && !loading && (
                  <div className="phosphor-dim" style={{ fontSize: "12px", letterSpacing: "1px", marginBottom: "8px", fontFamily: "'Share Tech Mono', monospace" }}>
                    // {explanation}
                  </div>
                )}

                {/* Country + count row */}
                {results.length > 0 && !loading && (
                  <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
                    <span className="phosphor-dim" style={{ fontSize: "12px", letterSpacing: "2px" }}>STREAMING IN:</span>
                    <select
                      className="crt-select"
                      value={country}
                      onChange={(e) => handleCountryChange(e.target.value)}
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>{c.name}</option>
                      ))}
                    </select>
                    <span className="phosphor-dim" style={{ fontSize: "12px", letterSpacing: "2px", marginLeft: "auto" }}>
                      {results.length} TITLES
                    </span>
                  </div>
                )}

                {/* Empty state */}
                {results.length === 0 && !loading && (
                  <div style={{ textAlign: "center", padding: "40px 0 20px" }}>
                    <div className="phosphor-dim" style={{ fontSize: "32px", marginBottom: "8px" }}>📼</div>
                    <div className="phosphor-dim" style={{ fontSize: "14px", letterSpacing: "4px" }}>AWAITING INPUT_</div>
                  </div>
                )}

              </div>

              {/* Counter surface — the wooden counter with hands */}
              {results.length > 0 && !loading && (
                <div className="counter-surface" style={{ padding: "16px 28px 28px" }}>

                  {/* Counter edge highlight */}
                  <div style={{
                    position: "absolute", top: 0, left: 0, right: 0,
                    height: "3px",
                    background: "linear-gradient(90deg, transparent, #3a6a2a, #5a9a4a, #3a6a2a, transparent)",
                  }} />

                  {/* Movie posters being slid across counter */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
                    gap: "12px",
                    position: "relative",
                    zIndex: 2,
                  }}>
                    {results.map((movie, i) => (
                      <MovieSlide
                        key={movie.id}
                        movie={movie}
                        streaming={streamingData[movie.id]}
                        index={i}
                      />
                    ))}
                  </div>

                  {/* The clerk's hand sliding posters */}
                  <div style={{
                    position: "absolute",
                    bottom: "0px",
                    right: "20px",
                    zIndex: 3,
                    opacity: 0.5,
                    pointerEvents: "none",
                  }}>
                    <svg
                      className="hand-svg"
                      width="120" height="80" viewBox="0 0 120 80"
                      style={{ filter: "drop-shadow(0 0 8px rgba(74,170,42,0.3))" }}
                    >
                      {/* Arm */}
                      <rect x="60" y="40" width="60" height="30" rx="8" fill="#1a3a18" stroke="#2a5a2a" strokeWidth="1" />
                      {/* Palm */}
                      <ellipse cx="55" cy="52" rx="22" ry="16" fill="#1a3a18" stroke="#2a5a2a" strokeWidth="1" />
                      {/* Fingers */}
                      <rect x="20" y="34" width="10" height="20" rx="5" fill="#1a3a18" stroke="#2a5a2a" strokeWidth="1" />
                      <rect x="32" y="30" width="10" height="24" rx="5" fill="#1a3a18" stroke="#2a5a2a" strokeWidth="1" />
                      <rect x="44" y="30" width="10" height="24" rx="5" fill="#1a3a18" stroke="#2a5a2a" strokeWidth="1" />
                      <rect x="56" y="32" width="9" height="22" rx="4" fill="#1a3a18" stroke="#2a5a2a" strokeWidth="1" />
                      {/* Thumb */}
                      <ellipse cx="28" cy="58" rx="8" ry="6" fill="#1a3a18" stroke="#2a5a2a" strokeWidth="1" transform="rotate(-20 28 58)" />
                    </svg>
                  </div>

                </div>
              )}

            </div>
          </div>

          {/* Monitor chin — buttons and brand */}
          <div style={{
            background: "#162214",
            borderRadius: "0 0 8px 8px",
            padding: "10px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              {/* Power LED */}
              <div style={{
                width: "8px", height: "8px", borderRadius: "50%",
                background: "#4aaa2a",
                boxShadow: "0 0 6px #4aaa2a, 0 0 12px #4aaa2a",
              }} />
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#1a3a18" }} />
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#1a3a18" }} />
            </div>
            <div style={{
              fontFamily: "VT323, monospace",
              fontSize: "11px",
              color: "#2a4a28",
              letterSpacing: "3px",
            }}>
              DOUBLE FEATURE © 1987
            </div>
            <div style={{
              width: "28px", height: "14px",
              background: "#0a1208",
              border: "1px solid #2a4a2a",
              borderRadius: "2px",
            }} />
          </div>

        </div>

        {/* Monitor stand */}
        <div style={{
          width: "80px", height: "20px",
          background: "linear-gradient(180deg, #1a2a18, #0d1a0d)",
          borderRadius: "0 0 4px 4px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.6)",
        }} />
        <div style={{
          width: "140px", height: "10px",
          background: "#0d1a0d",
          borderRadius: "4px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.8)",
          marginBottom: "40px",
        }} />

      </div>
    </>
  );
}