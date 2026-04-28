import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Sidebar from "../components/Sidebar";
import { API, getToken, fetchComparison } from "../lib/api";
import { explainInPlainEnglish } from "../lib/explain";

const ASSET_COLORS = ["#FFB700", "#34d399", "#fbbf24", "#f87171", "#ec4899"];

export default function SimulatePage() {
  const router = useRouter();
  const [months, setMonths] = useState("12");
  const [amount, setAmount] = useState("10000");
  const [comparison, setComparison] = useState(null);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const chartCanvasRef = useRef(null);
  const chartRef = useRef(null);

  // Auth guard
  useEffect(() => {
    if (!getToken()) router.replace("/login");
    fetchComparison().then(d => { if (!d?.error) setComparison(d); });
  }, []);

  // ── Chart ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!results) return;
    let active = true;
    import("chart.js/auto").then(({ default: Chart }) => {
      if (!active || !chartCanvasRef.current) return;
      if (chartRef.current) chartRef.current.destroy();

      const labels = results.decisions.map((d) => d.date.slice(0, 10));
      const data = results.decisions.map((d) => d.capital);

      chartRef.current = new Chart(chartCanvasRef.current, {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              data,
              borderColor: "#FFB700",
              backgroundColor: "rgba(255,183,0,0.07)",
              borderWidth: 2,
              pointRadius: 0,
              fill: true,
              tension: 0.4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { display: false },
            y: {
              ticks: {
                color: "rgba(255,255,255,0.25)",
                font: { size: 10 },
                callback: (v) => `₹${Number(v).toLocaleString("en-IN")}`,
              },
              grid: { color: "rgba(255,255,255,0.03)" },
            },
          },
        },
      });
    });
    return () => {
      active = false;
      if (chartRef.current) chartRef.current.destroy();
    };
  }, [results]);

  // ── Simulation ─────────────────────────────────────────────────────────────
  const runSim = async () => {
    setResults(null);
    setError("");

    const numMonths = parseInt(months) || 12;
    if (numMonths < 1 || numMonths > 120) {
      setError("Please enter a number of months between 1 and 120");
      return;
    }

    setRunning(true);

    const numAmount = parseFloat(amount) || 10000;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    try {
      const res = await fetch(`${API}/api/simulate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ amount: numAmount, months: numMonths }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Simulation failed");
        return;
      }
      setResults(data);
      localStorage.setItem("lastSimulation", JSON.stringify(data));
    } catch {
      setError("Network error. Is the backend running on port 8000?");
    } finally {
      setRunning(false);
    }
  };

  // ── Derived values from results ────────────────────────────────────────────
  const lastDecision = results?.decisions?.[results.decisions.length - 1];
  const weights = lastDecision?.weights || [];
  const assetNames = results?.asset_names || [];

  // Aggregate feature importance across all decisions
  const aggImportance = (() => {
    if (!results?.decisions?.length) return [];
    const totals = {};
    let count = 0;
    results.decisions.forEach((d) => {
      if (!d.feature_importance) return;
      Object.entries(d.feature_importance).forEach(([k, v]) => {
        totals[k] = (totals[k] || 0) + v;
      });
      count++;
    });
    if (count === 0) return [];
    const sum = Object.values(totals).reduce((a, b) => a + b, 0);
    return Object.entries(totals)
      .map(([k, v]) => ({ name: k, pct: Math.round((v / sum) * 100) }))
      .sort((a, b) => b.pct - a.pct);
  })();

  const topFeature = aggImportance[0]?.name || "returns";
  const topPct = aggImportance[0]?.pct || 0;

  const fmt = (n) => `₹${Number(n.toFixed(0)).toLocaleString("en-IN")}`;
  const numMonths = parseInt(months) || 12;
  const tradingDays = numMonths * 21;
  const periodLabel = numMonths >= 12
    ? `${Math.floor(numMonths / 12)} Year${Math.floor(numMonths / 12) > 1 ? "s" : ""}${numMonths % 12 > 0 ? ` ${numMonths % 12} Mo` : ""}`
    : `${numMonths} Month${numMonths > 1 ? "s" : ""}`;

  return (
    <div className="page">
      <div className="orb orb1" />
      <div className="orb orb2" />
      <div className="disclaimer">
        ⚠ Simulation only — no real investments are made. Past performance does not guarantee future results.
      </div>
      <div className="app">
        <Sidebar active="Simulate" />

        <div className="main">
          <div className="page-title">Run a Simulation</div>
          <div className="page-sub">Let the AI agent simulate your investment across {assetNames.length || 4} asset classes</div>

          <div className="sim-input-card">
            <div className="input-row">
              <div className="field-group">
                <label>Investment Amount (₹)</label>
                <input
                  className="amount-input"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="10000"
                  min="100"
                />
              </div>
              <div className="field-group">
                <label>Time Horizon
                  {months && parseInt(months) > 0 && (
                    <span className="horizon-hint">
                      {" "}— {parseInt(months) >= 12
                        ? `${Math.floor(parseInt(months) / 12)} yr${Math.floor(parseInt(months) / 12) > 1 ? "s" : ""}${parseInt(months) % 12 > 0 ? ` ${parseInt(months) % 12} mo` : ""}`
                        : `${months} month${parseInt(months) > 1 ? "s" : ""}`}
                    </span>
                  )}
                </label>
                <input
                  className="amount-input"
                  type="number"
                  value={months}
                  onChange={(e) => setMonths(e.target.value)}
                  placeholder="12"
                  min="1"
                  max="120"
                />
              </div>
              <button className={`run-btn ${running ? "loading" : ""}`} onClick={runSim} type="button" disabled={running}>
                {running ? "Running…" : "Simulate Now"}
              </button>
            </div>
          </div>

          {error && <div className="error-msg">⚠ {error}</div>}

          {running && (
            <div className="loading-state">
              <div className="loading-spinner" />
              <div className="loading-text">AI agent is making decisions...</div>
              <div className="loading-sub">Running {tradingDays} trading days of simulation</div>
            </div>
          )}

          {results && (
            <div className="results">
              <div className="results-header">
                <div className="results-title">Simulation Results — {periodLabel}</div>
                <div className="results-time">
                  {results.decisions[0]?.date.slice(0, 10)} → {lastDecision?.date.slice(0, 10)} · {tradingDays} trading days
                </div>
              </div>

              <div className="metrics-row">
                <div className="metric" style={{ animationDelay: "0s" }}>
                  <div className="metric-label">Final Value</div>
                  <div className="metric-value green">{fmt(results.final_amount)}</div>
                  <div className="metric-sub">Started with {fmt(results.initial_amount)}</div>
                </div>
                <div className="metric" style={{ animationDelay: "0.05s" }}>
                  <div className="metric-label">Total Return</div>
                  <div className={`metric-value ${results.total_return_pct >= 0 ? "green" : "red"}`}>
                    {results.total_return_pct >= 0 ? "+" : ""}{results.total_return_pct.toFixed(2)}%
                  </div>
                  <div className="metric-sub">Over {periodLabel.toLowerCase()}</div>
                </div>
                <div className="metric" style={{ animationDelay: "0.1s" }}>
                  <div className="metric-label">Sharpe Ratio</div>
                  <div className="metric-value blue">{results.metrics.sharpe.toFixed(2)}</div>
                  <div className="metric-sub">Risk-adjusted return</div>
                </div>
                <div className="metric" style={{ animationDelay: "0.15s" }}>
                  <div className="metric-label">Max Drawdown</div>
                  <div className="metric-value amber">{results.metrics.max_drawdown.toFixed(2)}%</div>
                  <div className="metric-sub">Worst loss period</div>
                </div>
              </div>

              <div className="charts-row">
                <div className="card">
                  <div className="card-title">Capital Growth Curve</div>
                  <div className="card-sub">Portfolio value over the simulation period</div>
                  <div className="chart-area"><canvas ref={chartCanvasRef} /></div>
                </div>
                <div className="card">
                  <div className="card-title">Asset Allocation</div>
                  <div className="card-sub">Final weights from AI agent</div>
                  {assetNames.map((name, i) => (
                    <div className="alloc-item" key={name}>
                      <div className="alloc-left">
                        <div className="alloc-dot" style={{ background: ASSET_COLORS[i] }} />
                        {name}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div className="alloc-bar-bg">
                          <div className="alloc-bar" style={{ width: `${((weights[i] || 0) * 100).toFixed(0)}%`, background: ASSET_COLORS[i] }} />
                        </div>
                        <div className="alloc-pct" style={{ color: ASSET_COLORS[i] }}>
                          {((weights[i] || 0) * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="charts-row">
                <div className="card xai-card">
                  <div className="card-title">Why did the AI make these decisions?</div>
                  <div className="card-sub">Perturbation-based feature importance across all decisions</div>
                  <div className="xai-explain">
                    <div className="xai-label">What did the AI focus on?</div>
                    {explainInPlainEnglish(aggImportance, results.metrics, results.total_return_pct)}
                  </div>
                  {aggImportance.map((feat, i) => (
                    <div className="imp-row" key={feat.name}>
                      <div className="imp-label">{feat.name.charAt(0).toUpperCase() + feat.name.slice(1)}</div>
                      <div className="imp-bar-bg">
                        <div className="imp-bar" style={{ width: `${feat.pct}%`, background: ASSET_COLORS[i] }} />
                      </div>
                      <div className="imp-pct">{feat.pct}%</div>
                    </div>
                  ))}
                </div>
                <div className="card comparison-card">
                  <div className="card-title">Strategy Comparison</div>
                  <div className="card-sub">PPO Agent vs classical strategies (17 years)</div>
                  <table className="comp-table">
                    <thead>
                      <tr><th>Strategy</th><th>Return</th><th>Sharpe</th><th>Drawdown</th></tr>
                    </thead>
                    <tbody>
                      {(comparison?.strategies || []).map((s, i) => (
                        <tr key={s.name} className={s.name === "PPO Agent" ? "highlight" : ""}>
                          <td>
                            {s.name}
                            {s.name === "PPO Agent" && <span className="ai-badge">AI</span>}
                          </td>
                          <td className="green">+{s.total_return_pct.toFixed(2)}%</td>
                          <td>{s.sharpe.toFixed(2)}</td>
                          <td className="amber">{s.max_drawdown.toFixed(2)}%</td>
                        </tr>
                      ))}
                      {(!comparison?.strategies || comparison.strategies.length === 0) && (
                        <>
                          <tr><td>Equal Weight</td><td className="green">301%</td><td>1.13</td><td className="red">-17%</td></tr>
                          <tr><td>Mean Variance</td><td className="amber">123%</td><td>0.61</td><td className="red">-19%</td></tr>
                          <tr className="highlight">
                            <td>PPO Agent<span className="ai-badge">AI</span></td>
                            <td className="green">280%</td>
                            <td className="blue">1.04</td>
                            <td className="amber">-18.6%</td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                  <div style={{ marginTop: "12px", fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>
                    This simulation: {results.total_return_pct >= 0 ? "+" : ""}{results.total_return_pct.toFixed(2)}% over {periodLabel.toLowerCase()}
                  </div>
                </div>
              </div>

              <div className="bottom-actions">
                <button className="btn-outline" onClick={() => setResults(null)} type="button">Run another</button>
                <button className="btn-outline" onClick={() => router.push("/ai-decisions")} type="button">View AI Decisions →</button>
                <button className="btn-primary" type="button">Download report</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .page { background: #000; font-family: -apple-system, 'SF Pro Display', BlinkMacSystemFont, sans-serif; color: #fff; min-height: 100vh; }
        .orb { position: fixed; border-radius: 50%; filter: blur(120px); opacity: 0.2; pointer-events: none; }
        .orb1 { width: 450px; height: 450px; background: radial-gradient(circle, #FFB700, #FF8C00); top: -100px; left: -100px; }
        .orb2 { width: 300px; height: 300px; background: radial-gradient(circle, #34d399, #059669); bottom: 0; right: 0; }
        .disclaimer { background: rgba(251,191,36,0.07); border-bottom: 0.5px solid rgba(251,191,36,0.12); padding: 9px 24px; font-size: 12px; color: rgba(251,191,36,0.7); position: relative; z-index: 10; }
        .app { display: flex; position: relative; z-index: 10; min-height: calc(100vh - 37px); }
        .sidebar { width: 220px; border-right: 0.5px solid rgba(255,255,255,0.05); padding: 20px 12px; background: rgba(0,0,0,0.3); backdrop-filter: blur(20px); }
        .sidebar-logo { display: flex; align-items: center; gap: 9px; padding: 10px 12px; margin-bottom: 16px; cursor: pointer; border: none; background: transparent; color: #fff; width: 100%; text-align: left; }
        .sidebar-logo-mark { width: 30px; height: 30px; background: linear-gradient(135deg, #FFB700, #FF8C00); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; }
        .sidebar-logo-name { font-size: 15px; font-weight: 700; letter-spacing: -0.5px; }
        .sidebar-logo-name span { color: #FFB700; }
        .nav-item { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 9px; font-size: 13px; color: rgba(255,255,255,0.4); cursor: pointer; transition: all 0.2s; margin-bottom: 2px; border: none; background: transparent; width: 100%; text-align: left; }
        .nav-item:hover { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.7); }
        .nav-item.active { background: rgba(255,183,0,0.1); color: #FFD166; border: 0.5px solid rgba(255,183,0,0.15); }
        .main { flex: 1; padding: 28px 32px; }
        .page-title { font-size: 22px; font-weight: 700; letter-spacing: -0.8px; margin-bottom: 4px; }
        .page-sub { font-size: 13px; color: rgba(255,255,255,0.35); margin-bottom: 28px; }
        .sim-input-card { background: rgba(255,255,255,0.02); border: 0.5px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 28px; margin-bottom: 20px; }
        .input-row { display: grid; grid-template-columns: 1fr 1fr 200px; gap: 20px; align-items: end; }
        .field-group label { font-size: 11px; color: rgba(255,255,255,0.35); display: block; margin-bottom: 8px; letter-spacing: 0.06em; text-transform: uppercase; }
        .amount-input { width: 100%; background: rgba(255,255,255,0.04); border: 0.5px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 14px 18px; font-size: 20px; font-weight: 700; color: #fff; outline: none; letter-spacing: -0.5px; transition: border-color 0.2s; }
        .amount-input:focus { border-color: #FFB700; box-shadow: 0 0 0 3px rgba(255,183,0,0.1); }
        .horizon-hint { color: #FFD166; font-weight: 600; text-transform: none; letter-spacing: 0; }
        .run-btn { width: 100%; background: linear-gradient(135deg, #FFB700, #FF8C00); border: none; color: #fff; padding: 15px; border-radius: 12px; font-size: 15px; font-weight: 600; cursor: pointer; box-shadow: 0 0 25px rgba(255,183,0,0.3); transition: all 0.3s; position: relative; overflow: hidden; }
        .run-btn::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255,255,255,0.1), transparent); }
        .run-btn:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 0 40px rgba(255,183,0,0.5); }
        .run-btn:disabled { opacity: 0.7; cursor: not-allowed; }
        .error-msg { background: rgba(239,68,68,0.08); border: 0.5px solid rgba(239,68,68,0.25); color: #f87171; padding: 12px 16px; border-radius: 12px; font-size: 13px; margin-bottom: 16px; }
        .loading-state { text-align: center; padding: 48px; }
        .loading-spinner { width: 48px; height: 48px; border: 2px solid rgba(255,183,0,0.2); border-top-color: #FFB700; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .loading-text { font-size: 14px; color: rgba(255,255,255,0.4); }
        .loading-sub { font-size: 12px; color: rgba(255,255,255,0.2); margin-top: 4px; }
        .results-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; gap: 10px; }
        .results-title { font-size: 16px; font-weight: 600; }
        .results-time { font-size: 12px; color: rgba(255,255,255,0.3); }
        .metrics-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 16px; }
        .metric { background: rgba(255,255,255,0.03); border: 0.5px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 16px 18px; animation: fadeIn 0.4s ease both; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .metric-label { font-size: 11px; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
        .metric-value { font-size: 26px; font-weight: 700; letter-spacing: -1px; }
        .metric-sub { font-size: 11px; color: rgba(255,255,255,0.25); margin-top: 4px; }
        .green{color:#34d399;} .blue{color:#FFD166;} .amber{color:#fbbf24;} .red{color:#f87171;}
        .charts-row { display: grid; grid-template-columns: 2fr 1fr; gap: 12px; margin-bottom: 16px; }
        .card { background: rgba(255,255,255,0.02); border: 0.5px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 18px; animation: fadeIn 0.4s 0.1s ease both; }
        .card-title { font-size: 13px; font-weight: 600; margin-bottom: 3px; }
        .card-sub { font-size: 11px; color: rgba(255,255,255,0.3); margin-bottom: 16px; }
        .chart-area { position: relative; height: 180px; }
        .alloc-item { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
        .alloc-left { display: flex; align-items: center; gap: 8px; font-size: 13px; }
        .alloc-dot { width: 8px; height: 8px; border-radius: 50%; }
        .alloc-bar-bg { width: 80px; height: 5px; background: rgba(255,255,255,0.05); border-radius: 3px; }
        .alloc-bar { height: 5px; border-radius: 3px; }
        .alloc-pct { font-size: 13px; font-weight: 600; width: 40px; text-align: right; }
        .xai-card { animation: fadeIn 0.4s 0.2s ease both; }
        .xai-explain { background: rgba(255,183,0,0.06); border: 0.5px solid rgba(255,183,0,0.15); border-radius: 12px; padding: 14px; margin-bottom: 14px; font-size: 13px; color: rgba(255,255,255,0.65); line-height: 1.8; }
        .xai-label { font-size: 11px; font-weight: 600; color: #FFD166; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 8px; }
        .imp-row { display: flex; align-items: center; gap: 8px; margin-bottom: 9px; font-size: 12px; }
        .imp-label { width: 72px; color: rgba(255,255,255,0.4); }
        .imp-bar-bg { flex: 1; height: 5px; background: rgba(255,255,255,0.05); border-radius: 3px; }
        .imp-bar { height: 5px; border-radius: 3px; }
        .imp-pct { width: 32px; text-align: right; color: #FFD166; font-size: 11px; }
        .comparison-card { animation: fadeIn 0.4s 0.3s ease both; }
        .comp-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .comp-table th { text-align: left; padding: 8px 12px; font-size: 10px; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 0.5px solid rgba(255,255,255,0.06); }
        .comp-table td { padding: 11px 12px; border-bottom: 0.5px solid rgba(255,255,255,0.04); }
        .comp-table tr:last-child td { border-bottom: none; }
        .comp-table tr.highlight td { background: rgba(255,183,0,0.06); }
        .ai-badge { display: inline-block; background: rgba(255,183,0,0.15); color: #FFD166; font-size: 9px; padding: 2px 7px; border-radius: 8px; margin-left: 6px; }
        .bottom-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 16px; animation: fadeIn 0.4s 0.4s ease both; flex-wrap: wrap; }
        .btn-outline { background: transparent; border: 0.5px solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.6); padding: 11px 24px; border-radius: 10px; font-size: 13px; cursor: pointer; transition: all 0.2s; }
        .btn-outline:hover { background: rgba(255,255,255,0.05); }
        .btn-primary { background: linear-gradient(135deg, #FFB700, #FF8C00); border: none; color: #fff; padding: 11px 24px; border-radius: 10px; font-size: 13px; font-weight: 500; cursor: pointer; }

        @media (max-width: 1200px) {
          .input-row { grid-template-columns: 1fr; }
          .metrics-row { grid-template-columns: repeat(2,1fr); }
          .charts-row { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .input-row { grid-template-columns: 1fr; }
          .metrics-row { grid-template-columns: repeat(2,1fr); }
          .charts-row { grid-template-columns: 1fr; }
          .bottom-actions { flex-direction: column; }
          .bottom-actions button { width: 100%; }
          .sim-input-card { padding: 20px; }
          .run-btn { width: 100%; }
          .main { padding: 16px; }
        }
        @media (max-width: 480px) {
          .metrics-row { grid-template-columns: 1fr; }
          .input-row { grid-template-columns: 1fr; }
          .results-header { flex-direction: column; align-items: flex-start; }
          .main { padding: 12px; }
          .sim-input-card { padding: 16px; }
          .page-title { font-size: 18px; }
          .bottom-actions { gap: 8px; }
        }
        @media (max-width: 900px) {
          .app { flex-direction: column; }
          .sidebar { width: 100%; border-right: none; border-bottom: 0.5px solid rgba(255,255,255,0.05); }
          .main { padding: 20px; }
        }
        @media (max-width: 640px) {
          .metrics-row { grid-template-columns: 1fr; }
          .disclaimer { padding: 9px 12px; }
          .main { padding: 14px; }
        }
      `}</style>
    </div>
  );
}
