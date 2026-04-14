import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Sidebar from "../components/Sidebar";
import { fetchLatestSimulation, fetchComparison, getToken, getUser } from "../lib/api";

const ASSET_COLORS = ["#6366f1", "#34d399", "#fbbf24", "#f87171", "#ec4899"];

export default function ReportsPage() {
  const router = useRouter();
  const [sim, setSim] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) { router.replace("/login"); return; }
    setUser(getUser());

    // Check if a specific sim was passed via localStorage (from History page)
    const override = localStorage.getItem("lastSimulation");

    Promise.all([fetchLatestSimulation(), fetchComparison()]).then(([latest, comp]) => {
      if (latest?.error === "unauthenticated") { router.replace("/login"); return; }
      const simData = override ? (() => { try { return JSON.parse(override); } catch { return null; } })() : null;
      setSim(simData || (!latest?.error ? latest : null));
      if (!comp?.error) setComparison(comp);
      setLoading(false);
    });
  }, []);

  const fmt = (n) => `₹${Number(Number(n).toFixed(0)).toLocaleString("en-IN")}`;
  const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }) : "—";

  const lastDecision = sim?.decisions?.[sim.decisions.length - 1];
  const weights = lastDecision?.weights || [];
  const assetNames = sim?.asset_names || [];
  const ret = sim?.total_return_pct;

  // Aggregate feature importance
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

  const handlePrint = () => window.print();

  return (
    <div className="page">
      <div className="orb orb1" /><div className="orb orb2" />
      <div className="disclaimer no-print">⚠ Simulation only — no real investments are made.</div>
      <div className="app">
        <div className="no-print"><Sidebar active="Reports" /></div>
        <div className="main">
          <div className="top-bar no-print">
            <div>
              <div className="page-title">Reports</div>
              <div className="page-sub">Formatted summary of your latest simulation</div>
            </div>
            {sim && (
              <button className="btn-primary" onClick={handlePrint} type="button">🖨️ Print / Save PDF</button>
            )}
          </div>

          {loading && <div className="loading"><div className="spinner" /></div>}

          {!loading && !sim && (
            <div className="empty">
              <div className="empty-icon">📄</div>
              <div className="empty-title">No report available</div>
              <div className="empty-sub">Run a simulation first to generate a report.</div>
              <button className="btn-primary" onClick={() => router.push("/simulate")} type="button">Run a Simulation →</button>
            </div>
          )}

          {!loading && sim && (
            <div className="report">
              {/* Report header */}
              <div className="report-header">
                <div className="report-logo">
                  <div className="report-logo-mark">S</div>
                  <div className="report-logo-name">Scrooge<span>.</span>ai</div>
                </div>
                <div className="report-meta">
                  <div className="report-title">Portfolio Simulation Report</div>
                  <div className="report-sub">Generated for {user?.name || "User"} · {fmtDate(new Date().toISOString())}</div>
                </div>
              </div>

              {/* Simulation period */}
              <div className="section">
                <div className="section-title">Simulation Overview</div>
                <div className="overview-grid">
                  <div className="overview-item"><div className="ov-label">Period</div><div className="ov-val">{sim.decisions[0]?.date.slice(0, 10)} → {lastDecision?.date.slice(0, 10)}</div></div>
                  <div className="overview-item"><div className="ov-label">Duration</div><div className="ov-val">{sim.period} months ({sim.decisions?.length * 5 || "—"} trading days)</div></div>
                  <div className="overview-item"><div className="ov-label">Initial Investment</div><div className="ov-val">{fmt(sim.initial_amount)}</div></div>
                  <div className="overview-item"><div className="ov-label">Risk Profile</div><div className="ov-val" style={{ textTransform: "capitalize" }}>{user?.risk_profile || "—"}</div></div>
                  <div className="overview-item"><div className="ov-label">Investment Goal</div><div className="ov-val">{user?.investment_goal || "—"}</div></div>
                  <div className="overview-item"><div className="ov-label">Assets Traded</div><div className="ov-val">{assetNames.join(", ")}</div></div>
                </div>
              </div>

              {/* Performance */}
              <div className="section">
                <div className="section-title">Performance Summary</div>
                <div className="perf-grid">
                  <div className="perf-card highlight-card">
                    <div className="perf-label">Final Portfolio Value</div>
                    <div className={`perf-val large ${ret >= 0 ? "green" : "red"}`}>{fmt(sim.final_amount)}</div>
                    <div className="perf-sub">{ret >= 0 ? "Gain" : "Loss"} of {fmt(Math.abs(sim.final_amount - sim.initial_amount))}</div>
                  </div>
                  <div className="perf-card">
                    <div className="perf-label">Total Return</div>
                    <div className={`perf-val ${ret >= 0 ? "green" : "red"}`}>{ret >= 0 ? "+" : ""}{ret?.toFixed(2)}%</div>
                  </div>
                  <div className="perf-card">
                    <div className="perf-label">Sharpe Ratio</div>
                    <div className="perf-val blue">{sim.metrics?.sharpe?.toFixed(2)}</div>
                  </div>
                  <div className="perf-card">
                    <div className="perf-label">Annualised Volatility</div>
                    <div className="perf-val">{sim.metrics?.volatility != null ? `${sim.metrics.volatility.toFixed(1)}%` : "—"}</div>
                  </div>
                  <div className="perf-card">
                    <div className="perf-label">Max Drawdown</div>
                    <div className="perf-val amber">{sim.metrics?.max_drawdown?.toFixed(2)}%</div>
                  </div>
                </div>
              </div>

              {/* Allocation */}
              <div className="section">
                <div className="section-title">Final Asset Allocation</div>
                {assetNames.map((name, i) => (
                  <div className="alloc-row" key={name}>
                    <div className="alloc-name"><span className="alloc-dot" style={{ background: ASSET_COLORS[i] }} />{name}</div>
                    <div className="alloc-right">
                      <div className="alloc-bar-bg"><div className="alloc-bar" style={{ width: `${((weights[i] || 0) * 100).toFixed(0)}%`, background: ASSET_COLORS[i] }} /></div>
                      <span style={{ color: ASSET_COLORS[i], fontWeight: 700, fontSize: "13px", width: "40px", textAlign: "right" }}>{((weights[i] || 0) * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* XAI */}
              {aggImportance.length > 0 && (
                <div className="section">
                  <div className="section-title">AI Decision Drivers (XAI)</div>
                  <div className="xai-summary">The agent primarily responded to <strong>{aggImportance[0].name}</strong> ({aggImportance[0].pct}%) when allocating weights across assets.</div>
                  {aggImportance.map((f, i) => (
                    <div className="imp-row" key={f.name}>
                      <div className="imp-label">{f.name.charAt(0).toUpperCase() + f.name.slice(1)}</div>
                      <div className="imp-bar-bg"><div className="imp-bar" style={{ width: `${f.pct}%`, background: ASSET_COLORS[i] }} /></div>
                      <div className="imp-pct" style={{ color: ASSET_COLORS[i] }}>{f.pct}%</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Comparison */}
              {comparison?.strategies && (
                <div className="section">
                  <div className="section-title">Strategy Comparison (17-Year Backtest)</div>
                  <table className="comp-table">
                    <thead><tr><th>Strategy</th><th>Total Return</th><th>Sharpe Ratio</th><th>Volatility</th><th>Max Drawdown</th></tr></thead>
                    <tbody>
                      {comparison.strategies.map((s) => (
                        <tr key={s.name} className={s.name === "PPO Agent" ? "highlight-row" : ""}>
                          <td>{s.name}{s.name === "PPO Agent" && <span className="ai-badge">AI</span>}</td>
                          <td className="green">+{s.total_return_pct?.toFixed(1)}%</td>
                          <td className="blue">{s.sharpe?.toFixed(2)}</td>
                          <td>{s.volatility?.toFixed(1)}%</td>
                          <td className="amber">{s.max_drawdown?.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="report-footer">
                <div>Scrooge.ai · Simulation Report · {fmtDate(new Date().toISOString())}</div>
                <div>This report is for educational and simulation purposes only. No real investments were made.</div>
              </div>
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
        .top-bar { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
        .page-title { font-size: 22px; font-weight: 700; letter-spacing: -0.8px; margin-bottom: 4px; }
        .page-sub { font-size: 13px; color: rgba(255,255,255,0.35); }
        .btn-primary { background: linear-gradient(135deg, #6366f1, #8b5cf6); border: none; color: #fff; padding: 11px 22px; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; flex-shrink: 0; }
        .loading { display: flex; justify-content: center; padding: 80px; }
        .spinner { width: 40px; height: 40px; border: 2px solid rgba(99,102,241,0.2); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .empty { text-align: center; padding: 80px 24px; }
        .empty-icon { font-size: 48px; margin-bottom: 16px; }
        .empty-title { font-size: 18px; font-weight: 600; margin-bottom: 8px; }
        .empty-sub { font-size: 14px; color: rgba(255,255,255,0.35); margin-bottom: 24px; }
        /* Report */
        .report { background: rgba(255,255,255,0.02); border: 0.5px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 32px; max-width: 860px; }
        .report-header { display: flex; align-items: center; gap: 16px; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 0.5px solid rgba(255,255,255,0.08); }
        .report-logo { display: flex; align-items: center; gap: 8px; }
        .report-logo-mark { width: 36px; height: 36px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 700; color: #fff; }
        .report-logo-name { font-size: 18px; font-weight: 700; letter-spacing: -0.5px; }
        .report-logo-name span { color: #6366f1; }
        .report-title { font-size: 16px; font-weight: 600; margin-bottom: 3px; }
        .report-sub { font-size: 12px; color: rgba(255,255,255,0.35); }
        .section { margin-bottom: 28px; }
        .section-title { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 14px; padding-bottom: 8px; border-bottom: 0.5px solid rgba(255,255,255,0.05); }
        .overview-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .overview-item { background: rgba(255,255,255,0.02); border-radius: 10px; padding: 12px 14px; }
        .ov-label { font-size: 10px; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
        .ov-val { font-size: 13px; font-weight: 500; }
        .perf-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr; gap: 10px; }
        .perf-card { background: rgba(255,255,255,0.02); border: 0.5px solid rgba(255,255,255,0.05); border-radius: 10px; padding: 14px; }
        .highlight-card { border-color: rgba(99,102,241,0.2); background: rgba(99,102,241,0.05); }
        .perf-label { font-size: 10px; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
        .perf-val { font-size: 20px; font-weight: 700; letter-spacing: -0.5px; }
        .perf-val.large { font-size: 24px; letter-spacing: -1px; }
        .perf-sub { font-size: 11px; color: rgba(255,255,255,0.25); margin-top: 4px; }
        .green { color: #34d399; } .blue { color: #818cf8; } .amber { color: #fbbf24; } .red { color: #f87171; }
        .alloc-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .alloc-name { display: flex; align-items: center; gap: 8px; font-size: 13px; }
        .alloc-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .alloc-right { display: flex; align-items: center; gap: 10px; }
        .alloc-bar-bg { width: 160px; height: 5px; background: rgba(255,255,255,0.05); border-radius: 3px; }
        .alloc-bar { height: 5px; border-radius: 3px; }
        .xai-summary { font-size: 13px; color: rgba(255,255,255,0.5); line-height: 1.7; margin-bottom: 14px; background: rgba(99,102,241,0.05); padding: 12px; border-radius: 8px; }
        .xai-summary strong { color: #a5b4fc; }
        .imp-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; font-size: 12px; }
        .imp-label { width: 80px; color: rgba(255,255,255,0.45); }
        .imp-bar-bg { flex: 1; height: 5px; background: rgba(255,255,255,0.05); border-radius: 3px; }
        .imp-bar { height: 5px; border-radius: 3px; }
        .imp-pct { width: 32px; text-align: right; font-weight: 600; }
        .comp-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .comp-table th { text-align: left; padding: 8px 12px; font-size: 10px; color: rgba(255,255,255,0.25); text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 0.5px solid rgba(255,255,255,0.07); }
        .comp-table td { padding: 10px 12px; border-bottom: 0.5px solid rgba(255,255,255,0.04); }
        .comp-table tr:last-child td { border-bottom: none; }
        .highlight-row td { background: rgba(99,102,241,0.05); }
        .ai-badge { background: rgba(99,102,241,0.15); color: #818cf8; font-size: 9px; padding: 2px 7px; border-radius: 6px; margin-left: 6px; }
        .report-footer { margin-top: 28px; padding-top: 16px; border-top: 0.5px solid rgba(255,255,255,0.05); font-size: 11px; color: rgba(255,255,255,0.2); display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
        @media print {
          .no-print { display: none !important; }
          .page { background: #fff; color: #000; }
          .orb { display: none; }
          .report { border: 1px solid #ddd; background: #fff; }
          .section-title { color: #666; border-bottom-color: #ddd; }
          .perf-card, .overview-item { background: #f9f9f9; border-color: #ddd; }
          .green { color: #16a34a; } .blue { color: #4f46e5; } .amber { color: #d97706; } .red { color: #dc2626; }
          .alloc-bar-bg, .imp-bar-bg { background: #eee; }
          .report-footer { color: #999; }
        }
        @media (max-width: 768px) {
          .overview-grid { grid-template-columns: repeat(2, 1fr); }
          .perf-grid { grid-template-columns: repeat(2, 1fr); }
          .alloc-bar-bg { width: 100px; }
          .report { padding: 20px; }
          .top-bar { flex-direction: column; gap: 12px; }
          .main { padding: 16px; }
          .report-footer { flex-direction: column; gap: 8px; }
        }
        @media (max-width: 480px) {
          .overview-grid { grid-template-columns: 1fr; }
          .perf-grid { grid-template-columns: 1fr; }
          .alloc-bar-bg { width: 100px; }
          .report { padding: 14px; }
          .main { padding: 12px; }
          .page-title { font-size: 18px; }
          .report-logo-mark { width: 28px; height: 28px; font-size: 12px; }
          .report-logo-name { font-size: 16px; }
          .perf-val.large { font-size: 18px; }
          .btn-primary { padding: 9px 18px; font-size: 12px; }
          .comp-table { font-size: 12px; }
          .comp-table th { padding: 6px 8px; font-size: 9px; }
          .comp-table td { padding: 8px 8px; }
        }
        @media (max-width: 900px) {
          .app { flex-direction: column; }
          .main { padding: 20px; }
          .overview-grid { grid-template-columns: 1fr 1fr; }
          .perf-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </div>
  );
}
