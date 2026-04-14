import { useEffect, useState } from "react";
import "@/styles/globals.css";

const API = "http://localhost:8000";

export default function App({ Component, pageProps }) {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(`${API}/api/health`, { signal: AbortSignal.timeout(3000) });
        setOffline(!res.ok);
      } catch {
        setOffline(true);
      }
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {offline && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999,
          background: "rgba(220,38,38,0.97)", backdropFilter: "blur(8px)",
          padding: "10px 20px", display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: "12px",
          fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
          fontSize: "13px", color: "#fff",
          borderBottom: "1px solid rgba(255,255,255,0.15)",
        }}>
          <span>
            ⚠️ <strong>Backend is offline.</strong> Start the server:{" "}
            <code style={{ background: "rgba(0,0,0,0.25)", padding: "2px 8px", borderRadius: "4px", fontSize: "12px" }}>
              uvicorn api:app --reload --port 8000
            </code>
          </span>
          <button onClick={() => setOffline(false)} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.4)", color: "#fff", padding: "4px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", flexShrink: 0 }}>
            Dismiss
          </button>
        </div>
      )}
      <Component {...pageProps} />
    </>
  );
}
