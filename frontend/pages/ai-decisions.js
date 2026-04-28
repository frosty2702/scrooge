import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Sidebar from "../components/Sidebar";
import { fetchLatestSimulation, getToken } from "../lib/api";
import { explainInPlainEnglish } from "../lib/explain";

const ASSET_COLORS = ["#FFB700", "#34d399", "#fbbf24", "#f87171", "#ec4899"];

export default function AIDecisionsPage() {
  const router = useRouter();
  const [sim, setSim] = useState(null);
  const [loading, setLoading] = useState(true);
  const weightChartRef = useRef(null);
  const weightCanvasRef = useRef(null);

  // Auth guard + fetch from API
  useEffect(() => {
    const token = getToken();
    if (!token) { router.replace("/login"); return; }

    fetchLatestSimulation().then((data) => {
      if (data?.error === "unauthenticated") { router.replace("/login"); return; }
      if (!data?.error) setSim(data);
      setLoading(false);
    });
  }, []);

  // Weight allocation chart over time
  useEffect(() => {
    if (!sim?.decisions?.length || !sim?.asset_names?.length) return;
    let active = true;

    import("chart.js/auto").then(({ default: Chart }) => {
      if (!active || !weightCanvasRef.current) return;
      if (weightChartRef.current) weightChartRef.current.destroy();

      const labels = sim.decisions.map((d) => d.date.slice(0, 10));

      weightChartRef.current = new Chart(weightCanvasRef.current, {
        type: "line",
        data: {
          labels,
          datasets: sim.asset_names.map((name, i) => ({
            label: name,
            data: sim.decisions.map((d) => ((d.weights[i] || 0) * 100).toFixed(1)),
            borderColor: ASSET_COLORS[i],
            backgroundColor: ASSET_COLORS[i] + "18",
            borderWidth: 2,
            pointRadius: 0,
            fill: true,
            tension: 0.4,
          })),
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: "index", intersect: false },
          plugins: {
            legend: {
              display: true,
              labels: { color: "rgba(255,255,255,0.5)", boxWidth: 10, font: { size: 11 } },
            },
            tooltip: {
              callbacks: {
                label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y}%`,
              },
            },
          },
          scales: {
            x: {
              ticks: { color: "rgba(255,255,255,0.2)", font: { size: 10 }, maxTicksLimit: 8 },
              grid: { color: "rgba(255,255,255,0.03)" },
            },
            y: {
              min: 0,
              max: 100,
              ticks: {
                color: "rgba(255,255,255,0.2)",
                font: { size: 10 },
                callback: (v) => `${v}%`,
              },
              grid: { color: "rgba(255,255,255,0.03)" },
            },
          },
        },
      });
    });

    return () => {
      active = false;
      if (weightChartRef.current) weightChartRef.current.destroy();
    };
  }, [sim]);

  const topFeature = (importance) => {
    if (!importance) return "—";
    const sorted = Object.entries(importance).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || "—";
  };

  const fmt = (n) => `₹${Number(Number(n).toFixed(0)).toLocaleString("en-IN")}`;

  // Aggregate feature importance for plain-English explanation
  const aggImportance = (() => {
    if (!sim?.decisions?.length) return [];
    const totals = {};
    let count = 0;
    sim.decisions.forEach((d) => {
      if (!d.feature_importance) return;
      Object.entries(d.feature_importance).forEach(([k, v]) => { totals[k] = (totals[k] || 0) + v; });
      count++;
    });
    if (!count) return [];
    const sum = Object.values(totals).reduce((a, b) => a + b, 0);
    return Object.entries(totals).map(([k, v]) => ({ name: k, pct: Math.round((v / sum) * 100) })).sort((a, b) => b.pct - a.pct);
  })();

  const plainExplanation = sim ? explainInPlainEnglish(aggImportance, sim.metrics, sim.total_return_pct) : null;

  return (
    <div className="page">
      <div className="orb orb1" />
      <div className="orb orb2" />
      <div className="disclaimer">
        ⚠ Simulation only — no real investments are made. Past performance does not guarantee future results.
      </div>

      <div className="app">
        {/* Sidebar */}
        <Sidebar active="AI Decisions" />

        {/* Main */}
        <div className="main">
          <div className="page-title">AI Decisions</div>
          <div className="page-sub">
            Every allocation decision the PPO agent made during your last simulation
          </div>

          {loading ? (
            <div className="empty-state">
              <div className="empty-icon" style={{ fontSize: "32px" }}>⏳</div>
              <div className="empty-title">Loading decisions…</div>
            </div>
          ) : !sim ? (
            <div className="empty-state">
              <div className="empty-icon">🤖</div>
              <div className="empty-title">No simulation yet</div>
              <div className="empty-sub">Run a simulation first to see the AI&apos;s decision log here.</div>
              <button className="btn-primary" onClick={() => router.push("/simulate")} type="button">
                Run a Simulation →
              </button>
            </div>
          ) : (
            <>
              {/* Plain English explanation banner */}
              {plainExplanation && (
                <div className="explain-banner">
                  <div className="explain-icon">💡</div>
                  <div>
                    <div className="explain-label">In plain English</div>
                    <div className="explain-text">{plainExplanation}</div>
                  </div>
                </div>
              )}

              {/* Summary bar */}
              <div className="summary-row">
                <div className="summary-card">
                  <div className="summary-label">Total Decisions</div>
                  <div className="summary-value">{sim.decisions.length}</div>
                </div>
                <div className="summary-card">
                  <div className="summary-label">Total Return</div>
                  <div className={`summary-value ${sim.total_return_pct >= 0 ? "green" : "red"}`}>
                    {sim.total_return_pct >= 0 ? "+" : ""}{sim.total_return_pct.toFixed(2)}%
                  </div>
                </div>
                <div className="summary-card">
                  <div className="summary-label">Period</div>
                  <div className="summary-value">
                    {sim.decisions[0]?.date.slice(0, 10)} → {sim.decisions[sim.decisions.length - 1]?.date.slice(0, 10)}
                  </div>
                </div>
                <div className="summary-card">
                  <div className="summary-label">Assets</div>
                  <div className="summary-value">{sim.asset_names?.join(", ")}</div>
                </div>
              </div>

              {/* Weight chart */}
              <div className="card chart-card">
                <div className="card-title">Asset Allocation Over Time</div>
                <div className="card-sub">How the AI redistributed weights across the simulation period</div>
                <div className="chart-area">
                  <canvas ref={weightCanvasRef} />
                </div>
              </div>

              {/* Decisions table */}
              <div className="card table-card">
                <div className="card-title">Decision Log</div>
                <div className="card-sub">Every allocation recorded during the simulation (sampled every 5 steps)</div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Date</th>
                        {sim.asset_names?.map((name) => <th key={name}>{name}</th>)}
                        <th>Capital</th>
                        <th>Top Driver</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sim.decisions.map((d, i) => (
                        <tr key={d.timestep}>
                          <td className="muted">{i + 1}</td>
                          <td className="date-cell">{d.date.slice(0, 10)}</td>
                          {d.weights.map((w, wi) => (
                            <td key={wi}>
                              <div className="weight-cell">
                                <div
                                  className="weight-bar"
                                  style={{
                                    width: `${(w * 100).toFixed(0)}%`,
                                    background: ASSET_COLORS[wi],
                                  }}
                                />
                                <span style={{ color: ASSET_COLORS[wi] }}>
                                  {(w * 100).toFixed(0)}%
                                </span>
                              </div>
                            </td>
                          ))}
                          <td className="capital-cell">{fmt(d.capital)}</td>
                          <td>
                            <span className="driver-badge">
                              {topFeature(d.feature_importance)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .page { background: #000; font-family: -apple-system, 'SF Pro Display', BlinkMacSystemFont, sans-serif; color: #fff; min-height: 100vh; }
        .orb { position: fixed; border-radius: 50%; filter: blur(120px); opacity: 0.2; pointer-events: none; z-index: 0; }
        .orb1 { width: 450px; height: 450px; background: radial-gradient(circle, #FFB700, #FF8C00); top: -100px; left: -100px; }
        .orb2 { width: 300px; height: 300px; background: radial-gradient(circle, #34d399, #059669); bottom: 0; right: 0; }
        .disclaimer { background: rgba(251,191,36,0.07); border-bottom: 0.5px solid rgba(251,191,36,0.12); padding: 9px 24px; font-size: 12px; color: rgba(251,191,36,0.7); position: relative; z-index: 10; }
        .app { display: flex; position: relative; z-index: 10; min-height: calc(100vh - 37px); }

        /* Sidebar */
        .sidebar { width: 220px; border-right: 0.5px solid rgba(255,255,255,0.05); padding: 20px 12px; background: rgba(0,0,0,0.3); backdrop-filter: blur(20px); flex-shrink: 0; }
        .sidebar-logo { display: flex; align-items: center; gap: 9px; padding: 10px 12px; margin-bottom: 16px; cursor: pointer; border: none; background: transparent; color: #fff; width: 100%; text-align: left; }
        .sidebar-logo-mark { width: 30px; height: 30px; background: linear-gradient(135deg, #FFB700, #FF8C00); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; }
        .sidebar-logo-name { font-size: 15px; font-weight: 700; letter-spacing: -0.5px; }
        .sidebar-logo-name span { color: #FFB700; }
        .nav-item { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 9px; font-size: 13px; color: rgba(255,255,255,0.4); cursor: pointer; transition: all 0.2s; margin-bottom: 2px; border: none; background: transparent; width: 100%; text-align: left; }
        .nav-item:hover { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.7); }
        .nav-item.active { background: rgba(255,183,0,0.1); color: #FFD166; border: 0.5px solid rgba(255,183,0,0.15); }

        /* Main */
        .main { flex: 1; padding: 28px 32px; overflow: auto; }
        .page-title { font-size: 22px; font-weight: 700; letter-spacing: -0.8px; margin-bottom: 4px; }
        .page-sub { font-size: 13px; color: rgba(255,255,255,0.35); margin-bottom: 24px; }

        /* Empty state */
        .empty-state { text-align: center; padding: 80px 24px; }
        .empty-icon { font-size: 48px; margin-bottom: 16px; }
        .empty-title { font-size: 18px; font-weight: 600; margin-bottom: 8px; }
        .empty-sub { font-size: 14px; color: rgba(255,255,255,0.35); margin-bottom: 24px; }
        .btn-primary { background: linear-gradient(135deg, #FFB700, #FF8C00); border: none; color: #fff; padding: 12px 28px; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; }

        /* Summary row */
        .explain-banner { background: rgba(52,211,153,0.06); border: 0.5px solid rgba(52,211,153,0.2); border-radius: 14px; padding: 16px 20px; margin-bottom: 20px; display: flex; gap: 14px; align-items: flex-start; }
        .explain-icon { font-size: 24px; flex-shrink: 0; }
        .explain-label { font-size: 11px; font-weight: 600; color: #34d399; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px; }
        .explain-text { font-size: 13px; color: rgba(255,255,255,0.65); line-height: 1.8; }
        .summary-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
        .summary-card { background: rgba(255,255,255,0.03); border: 0.5px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 14px 16px; }
        .summary-label { font-size: 11px; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
        .summary-value { font-size: 15px; font-weight: 600; letter-spacing: -0.3px; }
        .green { color: #34d399; }
        .red { color: #f87171; }

        /* Cards */
        .card { background: rgba(255,255,255,0.02); border: 0.5px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 20px; margin-bottom: 16px; }
        .card-title { font-size: 14px; font-weight: 600; margin-bottom: 3px; }
        .card-sub { font-size: 11px; color: rgba(255,255,255,0.3); margin-bottom: 18px; }
        .chart-area { position: relative; height: 220px; }

        /* Table */
        .table-wrap { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 600px; }
        thead tr { border-bottom: 0.5px solid rgba(255,255,255,0.08); }
        th { text-align: left; padding: 8px 12px; font-size: 10px; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 500; }
        td { padding: 10px 12px; border-bottom: 0.5px solid rgba(255,255,255,0.04); vertical-align: middle; }
        tbody tr:last-child td { border-bottom: none; }
        tbody tr:hover td { background: rgba(255,255,255,0.02); }
        .muted { color: rgba(255,255,255,0.2); font-size: 12px; }
        .date-cell { color: rgba(255,255,255,0.5); font-size: 12px; white-space: nowrap; }
        .capital-cell { color: #fff; font-weight: 600; white-space: nowrap; }
        .weight-cell { display: flex; align-items: center; gap: 6px; }
        .weight-bar { height: 4px; border-radius: 2px; min-width: 2px; max-width: 60px; flex-shrink: 0; }
        .driver-badge { background: rgba(255,183,0,0.12); color: #FFD166; font-size: 11px; padding: 3px 9px; border-radius: 6px; white-space: nowrap; }

        @media (max-width: 1100px) { .summary-row { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 768px) {
          .summary-row { grid-template-columns: repeat(2, 1fr); }
          .table-wrap { overflow-x: auto; }
          table { min-width: 600px; }
          .main { padding: 16px; }
          .explain-banner { flex-direction: column; gap: 12px; }
          .explain-icon { font-size: 20px; }
        }
        @media (max-width: 480px) {
          .summary-row { grid-template-columns: 1fr; }
          .main { padding: 12px; }
          .page-title { font-size: 18px; }
          .card { padding: 14px; }
          table { font-size: 12px; }
          th { padding: 6px 8px; font-size: 9px; }
          td { padding: 8px 6px; }
        }
        @media (max-width: 900px) {
          .app { flex-direction: column; }
          .sidebar { width: 100%; border-right: none; border-bottom: 0.5px solid rgba(255,255,255,0.05); }
          .main { padding: 20px; }
        }
      `}</style>
    </div>
  );
}
