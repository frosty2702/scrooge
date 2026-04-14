import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Sidebar from "../components/Sidebar";
import { fetchMySimulations, getToken } from "../lib/api";

export default function HistoryPage() {
  const router = useRouter();
  const [sims, setSims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (!getToken()) { router.replace("/login"); return; }
    fetchMySimulations().then((data) => {
      if (data?.error === "unauthenticated") { router.replace("/login"); return; }
      if (Array.isArray(data)) setSims(data);
      setLoading(false);
    });
  }, []);

  const fmt = (n) => `₹${Number(Number(n).toFixed(0)).toLocaleString("en-IN")}`;
  const fmtDate = (iso) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const ASSET_COLORS = ["#6366f1", "#34d399", "#fbbf24", "#f87171", "#ec4899"];

  return (
    <div className="page">
      <div className="orb orb1" /><div className="orb orb2" />
      <div className="disclaimer">⚠ Simulation only — no real investments are made.</div>
      <div className="app">
        <Sidebar active="History" />
        <div className="main">
          <div className="page-title">Simulation History</div>
          <div className="page-sub">{sims.length} simulation{sims.length !== 1 ? "s" : ""} run so far</div>

          {loading && <div className="empty"><div className="spinner" /><p>Loading history…</p></div>}

          {!loading && sims.length === 0 && (
            <div className="empty">
              <div className="empty-icon">📋</div>
              <div className="empty-title">No simulations yet</div>
              <div className="empty-sub">Run your first simulation to see it here.</div>
              <button className="btn-primary" onClick={() => router.push("/simulate")} type="button">Run a Simulation →</button>
            </div>
          )}

          {!loading && sims.length > 0 && (
            <div className="sim-list">
              {sims.map((s, i) => {
                const isOpen = expanded === s.id;
                const ret = s.total_return_pct;
                const lastDecision = s.decisions?.[s.decisions.length - 1];
                const weights = lastDecision?.weights || [];
                return (
                  <div className="sim-card" key={s.id}>
                    <div className="sim-header" onClick={() => setExpanded(isOpen ? null : s.id)}>
                      <div className="sim-left">
                        <div className="sim-num">#{sims.length - i}</div>
                        <div>
                          <div className="sim-date">{fmtDate(s.created_at)}</div>
                          <div className="sim-meta">{fmt(s.initial_amount)} · {s.period} months</div>
                        </div>
                      </div>
                      <div className="sim-metrics">
                        <div className="sim-metric">
                          <div className="metric-label">Return</div>
                          <div className={`metric-val ${ret >= 0 ? "green" : "red"}`}>{ret >= 0 ? "+" : ""}{ret?.toFixed(2)}%</div>
                        </div>
                        <div className="sim-metric">
                          <div className="metric-label">Final</div>
                          <div className="metric-val">{fmt(s.final_amount)}</div>
                        </div>
                        <div className="sim-metric">
                          <div className="metric-label">Sharpe</div>
                          <div className="metric-val blue">{s.metrics?.sharpe?.toFixed(2) ?? "—"}</div>
                        </div>
                        <div className="sim-metric">
                          <div className="metric-label">Drawdown</div>
                          <div className="metric-val amber">{s.metrics?.max_drawdown?.toFixed(2)}%</div>
                        </div>
                        <div className="chevron">{isOpen ? "▲" : "▼"}</div>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="sim-detail">
                        <div className="detail-grid">
                          <div className="detail-section">
                            <div className="detail-title">Final Allocation</div>
                            {(s.asset_names || []).map((name, wi) => (
                              <div className="alloc-row" key={name}>
                                <div className="alloc-name"><span className="alloc-dot" style={{ background: ASSET_COLORS[wi] }} />{name}</div>
                                <div className="alloc-right">
                                  <div className="alloc-bar-bg"><div className="alloc-bar" style={{ width: `${((weights[wi] || 0) * 100).toFixed(0)}%`, background: ASSET_COLORS[wi] }} /></div>
                                  <span style={{ color: ASSET_COLORS[wi], fontSize: "12px", fontWeight: 600 }}>{((weights[wi] || 0) * 100).toFixed(0)}%</span>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="detail-section">
                            <div className="detail-title">Performance</div>
                            <div className="stat-row"><span>Initial amount</span><span>{fmt(s.initial_amount)}</span></div>
                            <div className="stat-row"><span>Final amount</span><span className={ret >= 0 ? "green" : "red"}>{fmt(s.final_amount)}</span></div>
                            <div className="stat-row"><span>Total return</span><span className={ret >= 0 ? "green" : "red"}>{ret >= 0 ? "+" : ""}{ret?.toFixed(2)}%</span></div>
                            <div className="stat-row"><span>Sharpe ratio</span><span className="blue">{s.metrics?.sharpe?.toFixed(2)}</span></div>
                            <div className="stat-row"><span>Volatility</span><span>{s.metrics?.volatility != null ? `${s.metrics.volatility.toFixed(1)}%` : "—"}</span></div>
                            <div className="stat-row"><span>Max drawdown</span><span className="amber">{s.metrics?.max_drawdown?.toFixed(2)}%</span></div>
                          </div>
                        </div>
                        <div className="detail-actions">
                          <button className="btn-sm" onClick={() => { localStorage.setItem("lastSimulation", JSON.stringify(s)); router.push("/ai-decisions"); }} type="button">View AI Decisions →</button>
                          <button className="btn-sm" onClick={() => { localStorage.setItem("lastSimulation", JSON.stringify(s)); router.push("/reports"); }} type="button">View Report →</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .page { background: #000; font-family: -apple-system, 'SF Pro Display', BlinkMacSystemFont, sans-serif; color: #fff; min-height: 100vh; }
        .orb { position: fixed; border-radius: 50%; filter: blur(120px); opacity: 0.2; pointer-events: none; }
        .orb1 { width: 450px; height: 450px; background: radial-gradient(circle, #6366f1, #4f46e5); top: -100px; right: 0; }
        .orb2 { width: 300px; height: 300px; background: radial-gradient(circle, #34d399, #059669); bottom: 0; left: 0; }
        .disclaimer { background: rgba(251,191,36,0.07); border-bottom: 0.5px solid rgba(251,191,36,0.12); padding: 9px 24px; font-size: 12px; color: rgba(251,191,36,0.7); position: relative; z-index: 10; }
        .app { display: flex; position: relative; z-index: 10; min-height: calc(100vh - 37px); }
        .main { flex: 1; padding: 28px 32px; overflow: auto; }
        .page-title { font-size: 22px; font-weight: 700; letter-spacing: -0.8px; margin-bottom: 4px; }
        .page-sub { font-size: 13px; color: rgba(255,255,255,0.35); margin-bottom: 24px; }
        .empty { text-align: center; padding: 80px 24px; }
        .empty-icon { font-size: 48px; margin-bottom: 16px; }
        .empty-title { font-size: 18px; font-weight: 600; margin-bottom: 8px; }
        .empty-sub { font-size: 14px; color: rgba(255,255,255,0.35); margin-bottom: 24px; }
        .spinner { width: 40px; height: 40px; border: 2px solid rgba(99,102,241,0.2); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .btn-primary { background: linear-gradient(135deg, #6366f1, #8b5cf6); border: none; color: #fff; padding: 12px 28px; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; }
        .sim-list { display: flex; flex-direction: column; gap: 10px; }
        .sim-card { background: rgba(255,255,255,0.02); border: 0.5px solid rgba(255,255,255,0.06); border-radius: 14px; overflow: hidden; transition: border-color 0.2s; }
        .sim-card:hover { border-color: rgba(255,255,255,0.1); }
        .sim-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; cursor: pointer; gap: 12px; }
        .sim-left { display: flex; align-items: center; gap: 14px; }
        .sim-num { font-size: 11px; color: rgba(255,255,255,0.2); font-weight: 600; width: 28px; }
        .sim-date { font-size: 13px; font-weight: 500; color: #fff; }
        .sim-meta { font-size: 11px; color: rgba(255,255,255,0.3); margin-top: 2px; }
        .sim-metrics { display: flex; align-items: center; gap: 28px; }
        .sim-metric { text-align: right; }
        .metric-label { font-size: 10px; color: rgba(255,255,255,0.25); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 3px; }
        .metric-val { font-size: 14px; font-weight: 600; }
        .green { color: #34d399; } .blue { color: #818cf8; } .amber { color: #fbbf24; } .red { color: #f87171; }
        .chevron { font-size: 10px; color: rgba(255,255,255,0.2); margin-left: 8px; }
        .sim-detail { padding: 0 20px 20px; border-top: 0.5px solid rgba(255,255,255,0.05); padding-top: 16px; }
        .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 16px; }
        .detail-section { }
        .detail-title { font-size: 11px; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 12px; }
        .alloc-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
        .alloc-name { display: flex; align-items: center; gap: 8px; font-size: 13px; }
        .alloc-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
        .alloc-right { display: flex; align-items: center; gap: 8px; }
        .alloc-bar-bg { width: 70px; height: 4px; background: rgba(255,255,255,0.05); border-radius: 2px; }
        .alloc-bar { height: 4px; border-radius: 2px; }
        .stat-row { display: flex; justify-content: space-between; font-size: 12px; padding: 7px 0; border-bottom: 0.5px solid rgba(255,255,255,0.04); }
        .stat-row:last-child { border-bottom: none; }
        .stat-row span:first-child { color: rgba(255,255,255,0.35); }
        .detail-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 4px; }
        .btn-sm { background: transparent; border: 0.5px solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.6); padding: 9px 18px; border-radius: 9px; font-size: 12px; cursor: pointer; transition: all 0.2s; }
        .btn-sm:hover { background: rgba(99,102,241,0.08); border-color: rgba(99,102,241,0.3); color: #818cf8; }
        @media (max-width: 768px) {
          .sim-header { flex-direction: column; align-items: flex-start; gap: 12px; }
          .sim-metrics { gap: 14px; width: 100%; }
          .sim-metric { text-align: left; }
          .detail-grid { grid-template-columns: 1fr; }
          .main { padding: 16px; }
          .detail-actions { flex-direction: column; }
          .btn-sm { width: 100%; }
        }
        @media (max-width: 480px) {
          .sim-metrics { display: flex; flex-wrap: wrap; gap: 12px; }
          .sim-metric { min-width: 80px; }
          .detail-grid { grid-template-columns: 1fr; gap: 16px; }
          .main { padding: 12px; }
          .page-title { font-size: 18px; }
          .sim-card { border-radius: 10px; }
        }
        @media (max-width: 600px) {
          .sim-metrics { flex-direction: column; gap: 8px; }
          .sim-metric { text-align: left; }
        }
        @media (max-width: 900px) {
          .app { flex-direction: column; }
          .main { padding: 20px; }
          .sim-metrics { gap: 14px; }
          .detail-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
