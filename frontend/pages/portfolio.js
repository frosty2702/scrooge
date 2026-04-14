import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Sidebar from "../components/Sidebar";
import { fetchLatestSimulation, fetchMySimulations, getToken } from "../lib/api";

const ASSET_COLORS = ["#6366f1", "#34d399", "#fbbf24", "#f87171", "#ec4899"];

export default function PortfolioPage() {
  const router = useRouter();
  const [sim, setSim] = useState(null);
  const [allSims, setAllSims] = useState([]);
  const [loading, setLoading] = useState(true);
  const chartRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!getToken()) { router.replace("/login"); return; }
    Promise.all([fetchLatestSimulation(), fetchMySimulations()]).then(([latest, all]) => {
      if (latest?.error === "unauthenticated") { router.replace("/login"); return; }
      if (!latest?.error) setSim(latest);
      if (Array.isArray(all)) setAllSims(all);
      setLoading(false);
    });
  }, []);

  // Capital growth chart
  useEffect(() => {
    if (!sim?.decisions?.length || !canvasRef.current) return;
    let active = true;
    import("chart.js/auto").then(({ default: Chart }) => {
      if (!active || !canvasRef.current) return;
      if (chartRef.current) chartRef.current.destroy();
      chartRef.current = new Chart(canvasRef.current, {
        type: "line",
        data: {
          labels: sim.decisions.map((d) => d.date.slice(0, 10)),
          datasets: [{
            data: sim.decisions.map((d) => d.capital),
            borderColor: "#6366f1",
            backgroundColor: "rgba(99,102,241,0.07)",
            borderWidth: 2,
            pointRadius: 0,
            fill: true,
            tension: 0.4,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: "rgba(255,255,255,0.2)", font: { size: 10 }, maxTicksLimit: 6 }, grid: { color: "rgba(255,255,255,0.02)" } },
            y: { ticks: { color: "rgba(255,255,255,0.2)", font: { size: 10 }, callback: (v) => `₹${Number(v.toFixed(0)).toLocaleString("en-IN")}` }, grid: { color: "rgba(255,255,255,0.02)" } },
          },
        },
      });
    });
    return () => { active = false; if (chartRef.current) chartRef.current.destroy(); };
  }, [sim]);

  const fmt = (n) => `₹${Number(Number(n).toFixed(0)).toLocaleString("en-IN")}`;
  const lastDecision = sim?.decisions?.[sim.decisions.length - 1];
  const weights = lastDecision?.weights || [];
  const assetNames = sim?.asset_names || [];

  // Aggregate performance across all sims
  const totalInvested = allSims.reduce((s, x) => s + (x.initial_amount || 0), 0);
  const avgReturn = allSims.length ? allSims.reduce((s, x) => s + (x.total_return_pct || 0), 0) / allSims.length : null;
  const bestSim = allSims.reduce((best, s) => (!best || s.total_return_pct > best.total_return_pct ? s : best), null);
  const worstSim = allSims.reduce((worst, s) => (!worst || s.total_return_pct < worst.total_return_pct ? s : worst), null);

  return (
    <div className="page">
      <div className="orb orb1" /><div className="orb orb2" />
      <div className="disclaimer">⚠ Simulation only — no real investments are made.</div>
      <div className="app">
        <Sidebar active="Portfolio" />
        <div className="main">
          <div className="page-title">Portfolio</div>
          <div className="page-sub">Latest simulation snapshot and all-time performance</div>

          {loading && <div className="loading"><div className="spinner" /></div>}

          {!loading && !sim && (
            <div className="empty">
              <div className="empty-icon">📈</div>
              <div className="empty-title">No portfolio data yet</div>
              <div className="empty-sub">Run a simulation to build your portfolio view.</div>
              <button className="btn-primary" onClick={() => router.push("/simulate")} type="button">Run a Simulation →</button>
            </div>
          )}

          {!loading && sim && (
            <>
              {/* Summary metrics */}
              <div className="metrics-row">
                <div className="metric"><div className="metric-label">Current Value</div><div className="metric-value green">{fmt(sim.final_amount)}</div><div className="metric-sub">from {fmt(sim.initial_amount)}</div></div>
                <div className="metric"><div className="metric-label">Return</div><div className={`metric-value ${sim.total_return_pct >= 0 ? "green" : "red"}`}>{sim.total_return_pct >= 0 ? "+" : ""}{sim.total_return_pct?.toFixed(2)}%</div><div className="metric-sub">this simulation</div></div>
                <div className="metric"><div className="metric-label">Sharpe Ratio</div><div className="metric-value blue">{sim.metrics?.sharpe?.toFixed(2)}</div><div className="metric-sub">risk-adjusted</div></div>
                <div className="metric"><div className="metric-label">Max Drawdown</div><div className="metric-value amber">{sim.metrics?.max_drawdown?.toFixed(2)}%</div><div className="metric-sub">worst period</div></div>
              </div>

              <div className="row-2col">
                {/* Growth chart */}
                <div className="card">
                  <div className="card-title">Capital Growth</div>
                  <div className="card-sub">{sim.decisions[0]?.date.slice(0, 10)} → {lastDecision?.date.slice(0, 10)}</div>
                  <div className="chart-area"><canvas ref={canvasRef} /></div>
                </div>

                {/* Allocation */}
                <div className="card">
                  <div className="card-title">Asset Allocation</div>
                  <div className="card-sub">Final weights from last simulation</div>
                  {assetNames.map((name, i) => (
                    <div className="alloc-row" key={name}>
                      <div className="alloc-left"><div className="dot" style={{ background: ASSET_COLORS[i] }} />{name}</div>
                      <div className="alloc-right">
                        <div className="bar-bg"><div className="bar" style={{ width: `${((weights[i] || 0) * 100).toFixed(0)}%`, background: ASSET_COLORS[i] }} /></div>
                        <span style={{ color: ASSET_COLORS[i], fontWeight: 600, fontSize: "13px", width: "36px", textAlign: "right" }}>{((weights[i] || 0) * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  ))}
                  <div className="alloc-note">Based on {sim.decisions?.length || 0} AI decisions</div>
                </div>
              </div>

              {/* All-time stats */}
              {allSims.length > 1 && (
                <div className="card all-time">
                  <div className="card-title">All-time Statistics</div>
                  <div className="card-sub">Across {allSims.length} simulations</div>
                  <div className="stat-grid">
                    <div className="stat-item"><div className="stat-label">Total Simulated</div><div className="stat-val">{fmt(totalInvested)}</div></div>
                    <div className="stat-item"><div className="stat-label">Average Return</div><div className={`stat-val ${avgReturn >= 0 ? "green" : "red"}`}>{avgReturn >= 0 ? "+" : ""}{avgReturn?.toFixed(2)}%</div></div>
                    <div className="stat-item"><div className="stat-label">Best Run</div><div className="stat-val green">+{bestSim?.total_return_pct?.toFixed(2)}%</div></div>
                    <div className="stat-item"><div className="stat-label">Worst Run</div><div className={`stat-val ${worstSim?.total_return_pct >= 0 ? "green" : "red"}`}>{worstSim?.total_return_pct >= 0 ? "+" : ""}{worstSim?.total_return_pct?.toFixed(2)}%</div></div>
                  </div>
                </div>
              )}
            </>
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
        .loading { display: flex; justify-content: center; padding: 80px; }
        .spinner { width: 40px; height: 40px; border: 2px solid rgba(99,102,241,0.2); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .empty { text-align: center; padding: 80px 24px; }
        .empty-icon { font-size: 48px; margin-bottom: 16px; }
        .empty-title { font-size: 18px; font-weight: 600; margin-bottom: 8px; }
        .empty-sub { font-size: 14px; color: rgba(255,255,255,0.35); margin-bottom: 24px; }
        .btn-primary { background: linear-gradient(135deg, #6366f1, #8b5cf6); border: none; color: #fff; padding: 12px 28px; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; }
        .metrics-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
        .metric { background: rgba(255,255,255,0.03); border: 0.5px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 16px 18px; }
        .metric-label { font-size: 11px; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
        .metric-value { font-size: 24px; font-weight: 700; letter-spacing: -1px; margin-bottom: 4px; }
        .metric-sub { font-size: 11px; color: rgba(255,255,255,0.25); }
        .green { color: #34d399; } .blue { color: #818cf8; } .amber { color: #fbbf24; } .red { color: #f87171; }
        .row-2col { display: grid; grid-template-columns: 2fr 1fr; gap: 12px; margin-bottom: 16px; }
        .card { background: rgba(255,255,255,0.02); border: 0.5px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 18px; }
        .card-title { font-size: 13px; font-weight: 600; margin-bottom: 3px; }
        .card-sub { font-size: 11px; color: rgba(255,255,255,0.3); margin-bottom: 16px; }
        .chart-area { position: relative; height: 200px; }
        .alloc-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
        .alloc-left { display: flex; align-items: center; gap: 8px; font-size: 13px; }
        .dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .alloc-right { display: flex; align-items: center; gap: 8px; }
        .bar-bg { width: 80px; height: 4px; background: rgba(255,255,255,0.05); border-radius: 2px; }
        .bar { height: 4px; border-radius: 2px; }
        .alloc-note { font-size: 11px; color: rgba(255,255,255,0.2); margin-top: 4px; }
        .all-time { }
        .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .stat-item { }
        .stat-label { font-size: 11px; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
        .stat-val { font-size: 18px; font-weight: 700; letter-spacing: -0.5px; }
        @media (max-width: 1100px) { .metrics-row { grid-template-columns: repeat(2,1fr); } .row-2col { grid-template-columns: 1fr; } .stat-grid { grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 768px) {
          .metrics-row { grid-template-columns: repeat(2,1fr); }
          .row-2col { grid-template-columns: 1fr; }
          .stat-grid { grid-template-columns: repeat(2,1fr); }
          .main { padding: 16px; }
        }
        @media (max-width: 480px) {
          .metrics-row { grid-template-columns: 1fr; }
          .stat-grid { grid-template-columns: 1fr; }
          .main { padding: 12px; }
          .page-title { font-size: 18px; }
          .metric-value { font-size: 20px; }
        }
        @media (max-width: 900px) {
          .app { flex-direction: column; }
          .main { padding: 20px; }
        }
      `}</style>
    </div>
  );
}
