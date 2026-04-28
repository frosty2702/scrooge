import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Sidebar from "../components/Sidebar";
import { fetchLatestSimulation, fetchMarketRegime, fetchComparison, getToken, getUser } from "../lib/api";

const ASSET_COLORS = ["#FFB700", "#34d399", "#fbbf24", "#f87171", "#ec4899"];

export default function DashboardPage() {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const router = useRouter();

  const [sim, setSim] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regime, setRegime] = useState(null);
  const [comparison, setComparison] = useState(null);

  // Auth guard + load data from API
  useEffect(() => {
    const token = getToken();
    if (!token) { router.replace("/login"); return; }

    setUser(getUser());

    fetchLatestSimulation().then((data) => {
      if (data?.error === "unauthenticated") { router.replace("/login"); return; }
      if (!data?.error) setSim(data);
      setLoading(false);
    });

    fetchMarketRegime().then((data) => {
      if (!data?.error) setRegime(data);
    });

    fetchComparison().then((data) => {
      if (!data?.error) setComparison(data);
    });
  }, []);

  // Chart — rebuilds whenever sim changes
  useEffect(() => {
    if (!canvasRef.current) return;
    let mounted = true;

    import("chart.js/auto").then(({ default: Chart }) => {
      if (!mounted || !canvasRef.current) return;
      if (chartRef.current) chartRef.current.destroy();

      let labels, scroogeData, niftyData;

      if (sim?.decisions?.length) {
        labels = sim.decisions.map((d) => d.date.slice(0, 10));
        scroogeData = sim.decisions.map((d) => d.capital);
        // Generate a benchmark line growing at ~8% annualised over the same points
        const initial = sim.initial_amount;
        const dailyReturn = Math.pow(1.08, 5 / 252) - 1;
        niftyData = sim.decisions.map((_, i) => initial * Math.pow(1 + dailyReturn, i));
      } else {
        // Placeholder chart
        labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        scroogeData = [10000, 10180, 10310, 10420, 10380, 10530, 10650, 10610, 10740, 10870, 10960, 11106];
        niftyData   = [10000, 10110, 10200, 10290, 10240, 10360, 10400, 10370, 10460, 10540, 10610, 10710];
      }

      chartRef.current = new Chart(canvasRef.current, {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              data: scroogeData,
              borderColor: "#FFB700",
              backgroundColor: "rgba(255,183,0,0.06)",
              borderWidth: 2,
              pointRadius: 0,
              fill: true,
              tension: 0.4,
            },
            {
              data: niftyData,
              borderColor: "rgba(255,255,255,0.2)",
              backgroundColor: "transparent",
              borderWidth: 1.5,
              pointRadius: 0,
              fill: false,
              tension: 0.4,
              borderDash: [4, 4],
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: {
              ticks: { color: "rgba(255,255,255,0.25)", font: { size: 10 }, maxTicksLimit: 8 },
              grid: { color: "rgba(255,255,255,0.02)" },
            },
            y: {
              ticks: {
                color: "rgba(255,255,255,0.25)",
                font: { size: 10 },
                callback: (v) => `₹${Number(v.toFixed(0)).toLocaleString("en-IN")}`,
              },
              grid: { color: "rgba(255,255,255,0.02)" },
            },
          },
        },
      });
    });

    return () => {
      mounted = false;
      if (chartRef.current) chartRef.current.destroy();
    };
  }, [sim]);

  // Derived values
  const fmt = (n) => `₹${Number(Number(n).toFixed(0)).toLocaleString("en-IN")}`;
  const lastDecision = sim?.decisions?.[sim.decisions.length - 1];
  const weights = lastDecision?.weights || [];
  const assetNames = sim?.asset_names || [];

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
    return Object.entries(totals)
      .map(([k, v]) => ({ name: k, pct: Math.round((v / sum) * 100) }))
      .sort((a, b) => b.pct - a.pct);
  })();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const userName = user?.name?.split(" ")[0] || "there";

  const returnPct = sim?.total_return_pct;
  const simReturn = returnPct != null ? `${returnPct >= 0 ? "+" : ""}${returnPct.toFixed(2)}%` : null;
  const benchmarkReturn = sim ? "+8.0% est." : "+7.1%";

  return (
    <div className="page">
      <div className="orb orb1" />
      <div className="orb orb2" />
      <div className="disclaimer">⚠ Simulation only — no real investments are made. Past performance does not guarantee future results.</div>
      <div className="app">
        <Sidebar active="Dashboard" />

        <div className="main">
          <div className="top-row">
            <div>
              <div className="greeting">{greeting}, {userName} 👋</div>
              <div className="greeting-sub">
                {loading
                  ? "Loading your data…"
                  : sim
                  ? `Last simulation: ${sim.decisions[0]?.date.slice(0, 10)} → ${lastDecision?.date.slice(0, 10)} · ${assetNames.length} asset classes`
                  : "No simulation yet — run one to see your results here"}
              </div>
            </div>
            <div className="top-actions">
              <button className="btn-sm btn-outline" type="button" onClick={() => router.push("/ai-decisions")}>View decisions</button>
              <button className="btn-sm btn-primary" onClick={() => router.push("/simulate")} type="button">Run simulation</button>
            </div>
          </div>

          <div className="metrics">
            <div className="metric">
              <div className="metric-label">Final Portfolio Value</div>
              <div className={`metric-value ${sim ? (returnPct >= 0 ? "green" : "red") : "muted"}`}>
                {sim ? fmt(sim.final_amount) : "—"}
              </div>
              <div className="metric-sub">{sim ? `Started with ${fmt(sim.initial_amount)}` : "Run a simulation"}</div>
              {sim && <div className={`metric-badge ${returnPct >= 0 ? "badge-green" : "badge-red"}`}>{returnPct >= 0 ? "+" : ""}{fmt(sim.final_amount - sim.initial_amount)}</div>}
            </div>
            <div className="metric">
              <div className="metric-label">Total Return</div>
              <div className={`metric-value ${sim ? (returnPct >= 0 ? "green" : "red") : "muted"}`}>
                {sim ? simReturn : "—"}
              </div>
              <div className="metric-sub">{sim ? `Sharpe: ${sim.metrics.sharpe.toFixed(2)}` : "Run a simulation"}</div>
              {sim && <div className={`metric-badge ${returnPct >= 0 ? "badge-green" : "badge-red"}`}>{returnPct >= 0 ? "Profitable" : "Loss"}</div>}
            </div>
            <div className="metric">
              <div className="metric-label">Sharpe Ratio</div>
              <div className={`metric-value ${sim ? "blue" : "muted"}`}>
                {sim ? sim.metrics.sharpe.toFixed(2) : "—"}
              </div>
              <div className="metric-sub">Risk-adjusted return</div>
              {sim && <div className="metric-badge badge-blue">{sim.metrics.sharpe > 1 ? "Above average" : "Below average"}</div>}
            </div>
            <div className="metric">
              <div className="metric-label">Max Drawdown</div>
              <div className={`metric-value ${sim ? "amber" : "muted"}`}>
                {sim ? `${sim.metrics.max_drawdown.toFixed(2)}%` : "—"}
              </div>
              <div className="metric-sub">Worst loss period</div>
            </div>
          </div>

          <div className="mid-row">
            <div className="card">
              <div className="card-title">Market Regime</div>
              <div className="card-sub">Current market conditions</div>
              <div className={`regime-pill ${regime?.regime === "Bear Market" ? "regime-bear" : "regime-bull"}`}><div className="pulse" /> {regime?.regime || "Bull Market"}</div>
              <div className="regime-row"><span>NIFTY 50 trend</span><span className="green">{regime ? `${regime.trend_30d_pct >= 0 ? "+" : ""}${regime.trend_30d_pct}% (30d)` : "+2.3% (30d)"}</span></div>
              <div className="regime-row"><span>Volatility index</span><span className="amber">{regime?.volatility_level || "Moderate"}</span></div>
              <div className="regime-row"><span>Agent stance</span><span className="blue">{regime?.stance || "Growth-oriented"}</span></div>
              <div className="regime-row"><span>Recommendation</span><span className="green">{regime?.recommendation || "Hold Equity"}</span></div>
            </div>

            <div className="card">
              <div className="card-title">Agent Confidence</div>
              <div className="card-sub">Feature importance from last simulation</div>
              {aggImportance.length > 0 ? (
                <>
                  <div className="conf-ring">
                    <svg width="88" height="88" viewBox="0 0 88 88">
                      <circle cx="44" cy="44" r="36" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="7" />
                      <circle cx="44" cy="44" r="36" fill="none" stroke="#FFB700" strokeWidth="7"
                        strokeDasharray="226"
                        strokeDashoffset={226 - (226 * aggImportance[0].pct) / 100}
                        strokeLinecap="round" />
                    </svg>
                    <div className="conf-center">
                      <div className="conf-val">{aggImportance[0].pct}%</div>
                      <div className="conf-lbl">{aggImportance[0].name}</div>
                    </div>
                  </div>
                  {aggImportance.map((f, i) => (
                    <div className="conf-bar-row" key={f.name}>
                      <span>{f.name.charAt(0).toUpperCase() + f.name.slice(1)}</span>
                      <div className="bar-bg"><div className="bar-fill" style={{ width: `${f.pct}%`, background: ASSET_COLORS[i] }} /></div>
                      <span style={{ color: ASSET_COLORS[i], fontSize: "10px" }}>{f.pct}%</span>
                    </div>
                  ))}
                </>
              ) : (
                <div className="empty-card-msg">Run a simulation to see agent confidence</div>
              )}
            </div>

            <div className="card">
              <div className="card-title">Goal Tracker</div>
              <div className="card-sub">{user?.investment_goal || "Wealth building"}</div>
              {sim ? (
                <>
                  <div className="goal-amount">{fmt(sim.final_amount)}</div>
                  <div className="goal-target">current portfolio value</div>
                  <div className="goal-bar-bg">
                    <div className="goal-bar" style={{ width: `${Math.min(Math.abs(returnPct), 100)}%` }} />
                  </div>
                  <div className="goal-pct">
                    <span>{returnPct >= 0 ? "+" : ""}{returnPct.toFixed(2)}% return</span>
                    <span>{sim.metrics.volatility != null ? `${sim.metrics.volatility.toFixed(1)}% volatility` : ""}</span>
                  </div>
                  <div className="goal-stats">
                    <div className="goal-stat"><span>Sharpe ratio</span><span className="blue">{sim.metrics.sharpe.toFixed(2)}</span></div>
                    <div className="goal-stat"><span>Max drawdown</span><span className="amber">{sim.metrics.max_drawdown.toFixed(2)}%</span></div>
                    <div className="goal-stat"><span>Risk level</span><span className="blue">{user?.risk_profile || "Moderate"}</span></div>
                  </div>
                </>
              ) : (
                <div className="empty-card-msg">Run a simulation to track your goal progress</div>
              )}
            </div>
          </div>

          <div className="bottom-row">
            <div className="card">
              <div className="card-title">Portfolio vs Benchmark</div>
              <div className="card-sub">{sim ? "AI portfolio vs estimated 8% annualised benchmark" : "Run a simulation to see your portfolio performance"}</div>
              <div className="legend">
                <span><span className="legend-dot" style={{ background: "#FFB700" }} />Scrooge AI ({sim ? simReturn : "—"})</span>
                <span><span className="legend-dot" style={{ background: "rgba(255,255,255,0.25)" }} />Benchmark ({benchmarkReturn})</span>
              </div>
              <div className="chart-area"><canvas ref={canvasRef} /></div>
            </div>

            <div className="card">
              <div className="card-title">Asset Allocation</div>
              <div className="card-sub">{sim ? "Final weights from last simulation" : "Run a simulation to see allocation"}</div>
              <div style={{ marginBottom: "16px" }}>
                {sim && assetNames.length > 0 ? (
                  assetNames.map((name, i) => (
                    <div className="alloc-item" key={name}>
                      <div className="alloc-left">
                        <div className="alloc-dot" style={{ background: ASSET_COLORS[i] }} />
                        {name}
                      </div>
                      <div className="alloc-right">
                        <div className="alloc-bar-bg">
                          <div className="alloc-bar" style={{ width: `${((weights[i] || 0) * 100).toFixed(0)}%`, background: ASSET_COLORS[i] }} />
                        </div>
                        <div className="alloc-pct" style={{ color: ASSET_COLORS[i] }}>
                          {((weights[i] || 0) * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-card-msg">No data yet</div>
                )}
              </div>
              <button className="run-btn" onClick={() => router.push("/simulate")} type="button">
                {sim ? "Run New Simulation →" : "Run Simulation →"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .page { background: #000; font-family: -apple-system, 'SF Pro Display', BlinkMacSystemFont, sans-serif; color: #fff; min-height: 100vh; display: flex; flex-direction: column; }
        .orb { position: fixed; border-radius: 50%; filter: blur(120px); opacity: 0.2; pointer-events: none; }
        .orb1 { width: 500px; height: 500px; background: radial-gradient(circle, #FFB700, #FF8C00); top: -150px; right: -100px; animation: float1 10s ease-in-out infinite; }
        .orb2 { width: 350px; height: 350px; background: radial-gradient(circle, #34d399, #059669); bottom: -100px; left: -80px; animation: float2 12s ease-in-out infinite; }
        @keyframes float1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-30px,20px)} }
        @keyframes float2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(20px,-20px)} }
        .disclaimer { background: rgba(251,191,36,0.07); border-bottom: 0.5px solid rgba(251,191,36,0.12); padding: 9px 24px; font-size: 12px; color: rgba(251,191,36,0.7); display: flex; align-items: center; gap: 8px; position: relative; z-index: 10; }
        .app { display: flex; flex: 1; position: relative; z-index: 10; min-height: 0; }
        .sidebar { width: 220px; border-right: 0.5px solid rgba(255,255,255,0.05); padding: 20px 12px; display: flex; flex-direction: column; gap: 2px; background: rgba(0,0,0,0.3); backdrop-filter: blur(20px); }
        .sidebar-logo { display: flex; align-items: center; gap: 9px; padding: 10px 12px; margin-bottom: 16px; }
        .sidebar-logo-mark { width: 30px; height: 30px; background: linear-gradient(135deg, #FFB700, #FF8C00); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; box-shadow: 0 0 12px rgba(255,183,0,0.3); }
        .sidebar-logo-name { font-size: 15px; font-weight: 700; letter-spacing: -0.5px; }
        .sidebar-logo-name span { color: #FFB700; }
        .sidebar-section { font-size: 10px; color: rgba(255,255,255,0.2); letter-spacing: 0.08em; text-transform: uppercase; padding: 8px 12px 4px; margin-top: 8px; }
        .nav-item { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 9px; font-size: 13px; color: rgba(255,255,255,0.4); cursor: pointer; transition: all 0.2s; background: transparent; border: none; width: 100%; text-align: left; }
        .nav-item:hover { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.7); }
        .nav-item.active { background: rgba(255,183,0,0.1); color: #FFD166; border: 0.5px solid rgba(255,183,0,0.15); }
        .nav-item .icon { font-size: 14px; width: 18px; text-align: center; }
        .sidebar-bottom { margin-top: auto; padding-top: 16px; border-top: 0.5px solid rgba(255,255,255,0.05); }
        .user-row { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 9px; cursor: pointer; }
        .user-row:hover { background: rgba(255,255,255,0.04); }
        .avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #FFB700, #FF8C00); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
        .user-name { font-size: 13px; font-weight: 500; }
        .user-plan { font-size: 10px; color: rgba(255,255,255,0.3); }
        .main { flex: 1; padding: 24px 28px; overflow: auto; }
        .top-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; gap: 12px; }
        .greeting { font-size: 22px; font-weight: 700; letter-spacing: -0.8px; margin-bottom: 4px; }
        .greeting-sub { font-size: 13px; color: rgba(255,255,255,0.35); }
        .top-actions { display: flex; gap: 10px; flex-shrink: 0; }
        .btn-sm { padding: 9px 20px; border-radius: 9px; font-size: 13px; cursor: pointer; font-weight: 500; transition: all 0.2s; }
        .btn-outline { background: transparent; border: 0.5px solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.6); }
        .btn-primary { background: linear-gradient(135deg, #FFB700, #FF8C00); border: none; color: #fff; box-shadow: 0 0 20px rgba(255,183,0,0.3); }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 0 30px rgba(255,183,0,0.5); }
        .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
        .metric { background: rgba(255,255,255,0.03); border: 0.5px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 16px 18px; transition: all 0.2s; }
        .metric:hover { border-color: rgba(255,255,255,0.12); background: rgba(255,255,255,0.05); }
        .metric-label { font-size: 11px; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
        .metric-value { font-size: 24px; font-weight: 700; letter-spacing: -1px; margin-bottom: 4px; }
        .metric-sub { font-size: 11px; color: rgba(255,255,255,0.25); }
        .metric-badge { display: inline-block; font-size: 10px; padding: 2px 8px; border-radius: 10px; margin-top: 6px; }
        .green { color: #34d399; } .blue { color: #FFD166; } .amber { color: #fbbf24; } .red { color: #f87171; } .muted { color: rgba(255,255,255,0.2); }
        .badge-green { background: rgba(52,211,153,0.1); color: #34d399; }
        .badge-red { background: rgba(248,113,113,0.1); color: #f87171; }
        .badge-blue { background: rgba(255,183,0,0.1); color: #FFD166; }
        .mid-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 16px; }
        .card { background: rgba(255,255,255,0.02); border: 0.5px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 18px; }
        .card-title { font-size: 13px; font-weight: 600; margin-bottom: 3px; letter-spacing: -0.2px; }
        .card-sub { font-size: 11px; color: rgba(255,255,255,0.3); margin-bottom: 16px; }
        .empty-card-msg { font-size: 12px; color: rgba(255,255,255,0.2); text-align: center; padding: 20px 0; }
        .regime-pill { display: inline-flex; align-items: center; gap: 7px; padding: 7px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; margin-bottom: 14px; }
        .regime-bull { background: rgba(52,211,153,0.1); color: #34d399; border: 0.5px solid rgba(52,211,153,0.2); }
        .regime-bear { background: rgba(248,113,113,0.1); color: #f87171; border: 0.5px solid rgba(248,113,113,0.2); }
        .pulse { width: 7px; height: 7px; border-radius: 50%; background: #34d399; animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(1.6)} }
        .regime-row { display: flex; justify-content: space-between; font-size: 12px; padding: 7px 0; border-bottom: 0.5px solid rgba(255,255,255,0.04); }
        .regime-row:last-child { border-bottom: none; }
        .regime-row span:first-child { color: rgba(255,255,255,0.35); }
        .conf-ring { position: relative; width: 88px; height: 88px; margin: 0 auto 14px; }
        .conf-ring svg { transform: rotate(-90deg); }
        .conf-center { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); text-align: center; }
        .conf-val { font-size: 20px; font-weight: 700; color: #FFD166; letter-spacing: -1px; }
        .conf-lbl { font-size: 9px; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 0.05em; }
        .conf-bar-row { display: flex; align-items: center; gap: 8px; font-size: 11px; margin-bottom: 7px; }
        .conf-bar-row span:first-child { width: 64px; color: rgba(255,255,255,0.35); }
        .bar-bg { flex: 1; height: 4px; background: rgba(255,255,255,0.05); border-radius: 2px; }
        .bar-fill { height: 4px; border-radius: 2px; background: #FFD166; }
        .goal-amount { font-size: 26px; font-weight: 700; letter-spacing: -1px; color: #34d399; }
        .goal-target { font-size: 12px; color: rgba(255,255,255,0.3); margin: 3px 0 14px; }
        .goal-bar-bg { background: rgba(255,255,255,0.05); border-radius: 6px; height: 8px; margin-bottom: 8px; overflow: hidden; }
        .goal-bar { height: 8px; border-radius: 6px; background: linear-gradient(90deg, #FFB700, #34d399); position: relative; transition: width 0.6s ease; }
        .goal-bar::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, rgba(255,255,255,0.15), transparent); border-radius: 6px; }
        .goal-pct { display: flex; justify-content: space-between; font-size: 11px; color: rgba(255,255,255,0.3); }
        .goal-stats { margin-top: 14px; }
        .goal-stat { display: flex; justify-content: space-between; font-size: 12px; padding: 6px 0; border-bottom: 0.5px solid rgba(255,255,255,0.04); }
        .goal-stat:last-child { border-bottom: none; }
        .goal-stat span:first-child { color: rgba(255,255,255,0.35); }
        .bottom-row { display: grid; grid-template-columns: 2fr 1fr; gap: 12px; }
        .chart-area { position: relative; height: 160px; }
        .legend { display: flex; gap: 16px; margin-bottom: 12px; font-size: 11px; color: rgba(255,255,255,0.4); }
        .legend-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 5px; }
        .alloc-item { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .alloc-left { display: flex; align-items: center; gap: 8px; font-size: 13px; }
        .alloc-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .alloc-right { display: flex; align-items: center; gap: 10px; }
        .alloc-pct { font-size: 13px; font-weight: 600; width: 36px; text-align: right; }
        .alloc-bar-bg { width: 80px; height: 4px; background: rgba(255,255,255,0.05); border-radius: 2px; }
        .alloc-bar { height: 4px; border-radius: 2px; }
        .run-btn { width: 100%; background: linear-gradient(135deg, #FFB700, #FF8C00); border: none; color: #fff; padding: 12px; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; box-shadow: 0 0 20px rgba(255,183,0,0.25); transition: all 0.2s; }
        .run-btn:hover { transform: translateY(-1px); box-shadow: 0 0 30px rgba(255,183,0,0.45); }

        @media (max-width: 1200px) {
          .metrics { grid-template-columns: repeat(2, 1fr); }
          .mid-row { grid-template-columns: 1fr; }
          .bottom-row { grid-template-columns: 1fr; }
        }
        @media (max-width: 900px) {
          .app { flex-direction: column; }
          .sidebar { width: 100%; border-right: 0; border-bottom: 0.5px solid rgba(255,255,255,0.05); max-height: 220px; overflow: auto; }
          .main { padding: 18px; }
          .top-row { flex-direction: column; }
          .top-actions { width: 100%; }
        }
        @media (max-width: 768px) {
          .metrics { grid-template-columns: repeat(2, 1fr); }
          .top-row { flex-direction: column; }
          .top-actions { width: 100%; flex-direction: column; }
          .top-actions button { width: 100%; }
          .mid-row { grid-template-columns: 1fr; }
          .bottom-row { grid-template-columns: 1fr; }
          .main { padding: 16px; }
        }
        @media (max-width: 480px) {
          .metrics { grid-template-columns: 1fr; }
          .main { padding: 12px; }
          .greeting { font-size: 18px; }
          .disclaimer { padding: 9px 14px; }
        }
        @media (max-width: 640px) {
          .metrics { grid-template-columns: 1fr; }
          .disclaimer { padding: 9px 14px; }
          .main { padding: 14px; }
        }
      `}</style>
    </div>
  );
}
