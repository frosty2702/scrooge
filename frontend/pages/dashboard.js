import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";

export default function DashboardPage() {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const router = useRouter();
  const [activePeriod, setActivePeriod] = useState("1 year");

  useEffect(() => {
    let mounted = true;
    import("chart.js/auto").then(({ default: Chart }) => {
      if (!mounted || !canvasRef.current) return;
      if (chartRef.current) chartRef.current.destroy();
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const scrooge = [10000, 10180, 10310, 10420, 10380, 10530, 10650, 10610, 10740, 10870, 10960, 11106];
      const nifty = [10000, 10110, 10200, 10290, 10240, 10360, 10400, 10370, 10460, 10540, 10610, 10710];
      chartRef.current = new Chart(canvasRef.current, {
        type: "line",
        data: {
          labels: months,
          datasets: [
            {
              data: scrooge,
              borderColor: "#6366f1",
              backgroundColor: "rgba(99,102,241,0.06)",
              borderWidth: 2,
              pointRadius: 0,
              fill: true,
              tension: 0.4,
            },
            {
              data: nifty,
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
              ticks: { color: "rgba(255,255,255,0.25)", font: { size: 10 } },
              grid: { color: "rgba(255,255,255,0.02)" },
            },
            y: {
              ticks: {
                color: "rgba(255,255,255,0.25)",
                font: { size: 10 },
                callback: (v) => `₹${Number(v).toLocaleString("en-IN")}`,
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
  }, []);

  const navigate = (url) => {
    if (!url) return;
    router.push(url);
  };

  return (
    <div className="page">
      <div className="orb orb1" />
      <div className="orb orb2" />
      <div className="disclaimer">⚠ Simulation only — no real investments are made. Past performance does not guarantee future results.</div>
      <div className="app">
        <div className="sidebar">
          <div className="sidebar-logo">
            <div className="sidebar-logo-mark">S</div>
            <div className="sidebar-logo-name">Scrooge<span>.</span>ai</div>
          </div>
          <div className="sidebar-section">Main</div>
          <div className="nav-item active"><span className="icon">📊</span> Dashboard</div>
          <button className="nav-item" onClick={() => navigate("/simulate")}><span className="icon">🤖</span> Simulate</button>
          <div className="nav-item"><span className="icon">🧠</span> AI Decisions</div>
          <div className="nav-item"><span className="icon">📈</span> Portfolio</div>
          <div className="sidebar-section">Analysis</div>
          <div className="nav-item"><span className="icon">🔍</span> XAI Insights</div>
          <div className="nav-item"><span className="icon">📋</span> Decision Log</div>
          <div className="nav-item"><span className="icon">📄</span> Reports</div>
          <div className="sidebar-section">Account</div>
          <div className="nav-item"><span className="icon">⚙️</span> Settings</div>
          <div className="sidebar-bottom">
            <div className="user-row">
              <div className="avatar">VR</div>
              <div><div className="user-name">Vishal R.</div><div className="user-plan">Conservative · Active</div></div>
            </div>
          </div>
        </div>
        <div className="main">
          <div className="top-row">
            <div>
              <div className="greeting">Good evening, Vishal 👋</div>
              <div className="greeting-sub">Your AI agent is active · 4 asset classes · Last updated 2 mins ago</div>
            </div>
            <div className="top-actions">
              <button className="btn-sm btn-outline" type="button">Export report</button>
              <button className="btn-sm btn-primary" onClick={() => navigate("/simulate")} type="button">Run simulation</button>
            </div>
          </div>
          <div className="metrics">
            <div className="metric">
              <div className="metric-label">Portfolio Value</div>
              <div className="metric-value green">₹11,106</div>
              <div className="metric-sub">Started with ₹10,000</div>
              <div className="metric-badge badge-green">+₹1,106</div>
            </div>
            <div className="metric">
              <div className="metric-label">Annual Return</div>
              <div className="metric-value green">+11.06%</div>
              <div className="metric-sub">vs 10% Nifty 50 avg</div>
              <div className="metric-badge badge-green">Beating market</div>
            </div>
            <div className="metric">
              <div className="metric-label">Sharpe Ratio</div>
              <div className="metric-value blue">1.39</div>
              <div className="metric-sub">Risk-adjusted return</div>
              <div className="metric-badge badge-blue">Above average</div>
            </div>
            <div className="metric">
              <div className="metric-label">Max Drawdown</div>
              <div className="metric-value amber">-6.03%</div>
              <div className="metric-sub">Worst loss period</div>
            </div>
          </div>
          <div className="mid-row">
            <div className="card">
              <div className="card-title">Market Regime</div>
              <div className="card-sub">Current market conditions</div>
              <div className="regime-pill regime-bull"><div className="pulse" /> Bull Market</div>
              <div className="regime-row"><span>NIFTY 50 trend</span><span className="green">+2.3% (30d)</span></div>
              <div className="regime-row"><span>Volatility index</span><span className="amber">Moderate</span></div>
              <div className="regime-row"><span>Agent stance</span><span className="blue">Growth-oriented</span></div>
              <div className="regime-row"><span>Recommendation</span><span className="green">Hold Equity</span></div>
            </div>
            <div className="card">
              <div className="card-title">Agent Confidence</div>
              <div className="card-sub">How certain is the AI?</div>
              <div className="conf-ring">
                <svg width="88" height="88" viewBox="0 0 88 88">
                  <circle cx="44" cy="44" r="36" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="7" />
                  <circle cx="44" cy="44" r="36" fill="none" stroke="#6366f1" strokeWidth="7" strokeDasharray="226" strokeDashoffset="57" strokeLinecap="round" />
                </svg>
                <div className="conf-center"><div className="conf-val">75%</div><div className="conf-lbl">confident</div></div>
              </div>
              <div className="conf-bar-row"><span>Returns</span><div className="bar-bg"><div className="bar-fill" style={{ width: "85%" }} /></div><span style={{ color: "#818cf8", fontSize: "10px" }}>85%</span></div>
              <div className="conf-bar-row"><span>Volatility</span><div className="bar-bg"><div className="bar-fill" style={{ width: "70%", background: "#34d399" }} /></div><span style={{ color: "#34d399", fontSize: "10px" }}>70%</span></div>
              <div className="conf-bar-row"><span>Momentum</span><div className="bar-bg"><div className="bar-fill" style={{ width: "65%", background: "#fbbf24" }} /></div><span style={{ color: "#fbbf24", fontSize: "10px" }}>65%</span></div>
            </div>
            <div className="card">
              <div className="card-title">Goal Tracker</div>
              <div className="card-sub">Wealth building · ₹1,00,000 target</div>
              <div className="goal-amount">₹34,210</div>
              <div className="goal-target">of ₹1,00,000 goal</div>
              <div className="goal-bar-bg"><div className="goal-bar" /></div>
              <div className="goal-pct"><span>34% complete</span><span>Est. Dec 2027</span></div>
              <div className="goal-stats">
                <div className="goal-stat"><span>Monthly needed</span><span className="green">₹3,200</span></div>
                <div className="goal-stat"><span>On track</span><span className="green">Yes ✓</span></div>
                <div className="goal-stat"><span>Risk level</span><span className="blue">Conservative</span></div>
              </div>
            </div>
          </div>
          <div className="bottom-row">
            <div className="card">
              <div className="card-title">Portfolio vs Nifty 50</div>
              <div className="card-sub">Your AI portfolio outperforming the index</div>
              <div className="legend">
                <span><span className="legend-dot" style={{ background: "#6366f1" }} />Scrooge AI (+11.06%)</span>
                <span><span className="legend-dot" style={{ background: "rgba(255,255,255,0.25)" }} />Nifty 50 (+7.1%)</span>
              </div>
              <div className="chart-area"><canvas ref={canvasRef} /></div>
            </div>
            <div className="card">
              <div className="card-title">Asset Allocation</div>
              <div className="card-sub">Current portfolio weights</div>
              <div style={{ marginBottom: "16px" }}>
                <div className="alloc-item"><div className="alloc-left"><div className="alloc-dot" style={{ background: "#6366f1" }} />Bond</div><div className="alloc-right"><div className="alloc-bar-bg"><div className="alloc-bar" style={{ width: "43%", background: "#6366f1" }} /></div><div className="alloc-pct blue">43%</div></div></div>
                <div className="alloc-item"><div className="alloc-left"><div className="alloc-dot" style={{ background: "#34d399" }} />Equity</div><div className="alloc-right"><div className="alloc-bar-bg"><div className="alloc-bar" style={{ width: "34%", background: "#34d399" }} /></div><div className="alloc-pct green">34%</div></div></div>
                <div className="alloc-item"><div className="alloc-left"><div className="alloc-dot" style={{ background: "#fbbf24" }} />Defensive</div><div className="alloc-right"><div className="alloc-bar-bg"><div className="alloc-bar" style={{ width: "23%", background: "#fbbf24" }} /></div><div className="alloc-pct amber">23%</div></div></div>
                <div className="alloc-item"><div className="alloc-left"><div className="alloc-dot" style={{ background: "rgba(255,255,255,0.15)" }} />Commodity</div><div className="alloc-right"><div className="alloc-bar-bg"><div className="alloc-bar" style={{ width: "0%" }} /></div><div className="alloc-pct" style={{ color: "rgba(255,255,255,0.2)" }}>0%</div></div></div>
              </div>
              <div className="quick-sim">
                <div>
                  <div className="input-label">Quick simulate</div>
                  <input className="amount-input" type="text" defaultValue="₹10,000" />
                </div>
                <div className="period-toggle">
                  <button className={`period-btn ${activePeriod === "6 months" ? "active" : ""}`} onClick={() => setActivePeriod("6 months")} type="button">6 months</button>
                  <button className={`period-btn ${activePeriod === "1 year" ? "active" : ""}`} onClick={() => setActivePeriod("1 year")} type="button">1 year</button>
                </div>
                <div>
                  <div className="sim-stat"><span>Best year (2014)</span><span className="green">+18.9%</span></div>
                  <div className="sim-stat"><span>Worst year (2008)</span><span className="red">-12.2%</span></div>
                  <div className="sim-stat"><span>17-year return</span><span className="green">+280%</span></div>
                </div>
                <button className="run-btn" onClick={() => navigate("/simulate")} type="button">Run Simulation →</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .page { background: #000; font-family: -apple-system, 'SF Pro Display', BlinkMacSystemFont, sans-serif; color: #fff; min-height: 100vh; display: flex; flex-direction: column; }
        .orb { position: fixed; border-radius: 50%; filter: blur(120px); opacity: 0.2; pointer-events: none; }
        .orb1 { width: 500px; height: 500px; background: radial-gradient(circle, #6366f1, #4f46e5); top: -150px; right: -100px; animation: float1 10s ease-in-out infinite; }
        .orb2 { width: 350px; height: 350px; background: radial-gradient(circle, #34d399, #059669); bottom: -100px; left: -80px; animation: float2 12s ease-in-out infinite; }
        @keyframes float1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-30px,20px)} }
        @keyframes float2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(20px,-20px)} }
        .disclaimer { background: rgba(251,191,36,0.07); border-bottom: 0.5px solid rgba(251,191,36,0.12); padding: 9px 24px; font-size: 12px; color: rgba(251,191,36,0.7); display: flex; align-items: center; gap: 8px; position: relative; z-index: 10; }
        .app { display: flex; flex: 1; position: relative; z-index: 10; min-height: 0; }
        .sidebar { width: 220px; border-right: 0.5px solid rgba(255,255,255,0.05); padding: 20px 12px; display: flex; flex-direction: column; gap: 2px; background: rgba(0,0,0,0.3); backdrop-filter: blur(20px); }
        .sidebar-logo { display: flex; align-items: center; gap: 9px; padding: 10px 12px; margin-bottom: 16px; }
        .sidebar-logo-mark { width: 30px; height: 30px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; box-shadow: 0 0 12px rgba(99,102,241,0.3); }
        .sidebar-logo-name { font-size: 15px; font-weight: 700; letter-spacing: -0.5px; }
        .sidebar-logo-name span { color: #6366f1; }
        .sidebar-section { font-size: 10px; color: rgba(255,255,255,0.2); letter-spacing: 0.08em; text-transform: uppercase; padding: 8px 12px 4px; margin-top: 8px; }
        .nav-item { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 9px; font-size: 13px; color: rgba(255,255,255,0.4); cursor: pointer; transition: all 0.2s; background: transparent; border: none; width: 100%; text-align: left; }
        .nav-item:hover { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.7); }
        .nav-item.active { background: rgba(99,102,241,0.1); color: #818cf8; border: 0.5px solid rgba(99,102,241,0.15); }
        .nav-item .icon { font-size: 14px; width: 18px; text-align: center; }
        .sidebar-bottom { margin-top: auto; padding-top: 16px; border-top: 0.5px solid rgba(255,255,255,0.05); }
        .user-row { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 9px; cursor: pointer; }
        .user-row:hover { background: rgba(255,255,255,0.04); }
        .avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #8b5cf6); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
        .user-name { font-size: 13px; font-weight: 500; }
        .user-plan { font-size: 10px; color: rgba(255,255,255,0.3); }
        .main { flex: 1; padding: 24px 28px; overflow: auto; }
        .top-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; gap: 12px; }
        .greeting { font-size: 22px; font-weight: 700; letter-spacing: -0.8px; margin-bottom: 4px; }
        .greeting-sub { font-size: 13px; color: rgba(255,255,255,0.35); }
        .top-actions { display: flex; gap: 10px; }
        .btn-sm { padding: 9px 20px; border-radius: 9px; font-size: 13px; cursor: pointer; font-weight: 500; transition: all 0.2s; }
        .btn-outline { background: transparent; border: 0.5px solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.6); }
        .btn-primary { background: linear-gradient(135deg, #6366f1, #8b5cf6); border: none; color: #fff; box-shadow: 0 0 20px rgba(99,102,241,0.3); }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 0 30px rgba(99,102,241,0.5); }
        .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
        .metric { background: rgba(255,255,255,0.03); border: 0.5px solid rgba(255,255,255,0.07); border-radius: 14px; padding: 16px 18px; transition: all 0.2s; cursor: default; }
        .metric:hover { border-color: rgba(255,255,255,0.12); background: rgba(255,255,255,0.05); }
        .metric-label { font-size: 11px; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
        .metric-value { font-size: 24px; font-weight: 700; letter-spacing: -1px; margin-bottom: 4px; }
        .metric-sub { font-size: 11px; color: rgba(255,255,255,0.25); }
        .metric-badge { display: inline-block; font-size: 10px; padding: 2px 8px; border-radius: 10px; margin-top: 6px; }
        .green { color: #34d399; } .blue { color: #818cf8; } .amber { color: #fbbf24; } .red { color: #f87171; }
        .badge-green { background: rgba(52,211,153,0.1); color: #34d399; }
        .badge-blue { background: rgba(129,140,248,0.1); color: #818cf8; }
        .mid-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 16px; }
        .card { background: rgba(255,255,255,0.02); border: 0.5px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 18px; }
        .card-title { font-size: 13px; font-weight: 600; margin-bottom: 3px; letter-spacing: -0.2px; }
        .card-sub { font-size: 11px; color: rgba(255,255,255,0.3); margin-bottom: 16px; }
        .regime-pill { display: inline-flex; align-items: center; gap: 7px; padding: 7px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; margin-bottom: 14px; }
        .regime-bull { background: rgba(52,211,153,0.1); color: #34d399; border: 0.5px solid rgba(52,211,153,0.2); }
        .pulse { width: 7px; height: 7px; border-radius: 50%; background: #34d399; animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(1.6)} }
        .regime-row { display: flex; justify-content: space-between; font-size: 12px; padding: 7px 0; border-bottom: 0.5px solid rgba(255,255,255,0.04); }
        .regime-row:last-child { border-bottom: none; }
        .regime-row span:first-child { color: rgba(255,255,255,0.35); }
        .conf-ring { position: relative; width: 88px; height: 88px; margin: 0 auto 14px; }
        .conf-ring svg { transform: rotate(-90deg); }
        .conf-center { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); text-align: center; }
        .conf-val { font-size: 20px; font-weight: 700; color: #818cf8; letter-spacing: -1px; }
        .conf-lbl { font-size: 9px; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 0.05em; }
        .conf-bar-row { display: flex; align-items: center; gap: 8px; font-size: 11px; margin-bottom: 7px; }
        .conf-bar-row span:first-child { width: 64px; color: rgba(255,255,255,0.35); }
        .bar-bg { flex: 1; height: 4px; background: rgba(255,255,255,0.05); border-radius: 2px; }
        .bar-fill { height: 4px; border-radius: 2px; background: #818cf8; }
        .goal-amount { font-size: 26px; font-weight: 700; letter-spacing: -1px; color: #34d399; }
        .goal-target { font-size: 12px; color: rgba(255,255,255,0.3); margin: 3px 0 14px; }
        .goal-bar-bg { background: rgba(255,255,255,0.05); border-radius: 6px; height: 8px; margin-bottom: 8px; overflow: hidden; }
        .goal-bar { height: 8px; border-radius: 6px; background: linear-gradient(90deg, #6366f1, #34d399); width: 34%; position: relative; }
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
        .quick-sim { display: flex; flex-direction: column; gap: 12px; }
        .input-label { font-size: 11px; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
        .amount-input { width: 100%; background: rgba(255,255,255,0.04); border: 0.5px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 11px 14px; font-size: 15px; font-weight: 600; color: #fff; outline: none; }
        .period-toggle { display: flex; gap: 6px; }
        .period-btn { flex: 1; padding: 9px; background: rgba(255,255,255,0.03); border: 0.5px solid rgba(255,255,255,0.08); border-radius: 8px; font-size: 12px; color: rgba(255,255,255,0.45); cursor: pointer; text-align: center; transition: all 0.2s; }
        .period-btn.active { background: rgba(99,102,241,0.15); border-color: #6366f1; color: #818cf8; }
        .sim-stat { display: flex; justify-content: space-between; font-size: 12px; padding: 7px 0; border-bottom: 0.5px solid rgba(255,255,255,0.04); }
        .sim-stat:last-child { border-bottom: none; }
        .sim-stat span:first-child { color: rgba(255,255,255,0.35); }
        .run-btn { width: 100%; background: linear-gradient(135deg, #6366f1, #8b5cf6); border: none; color: #fff; padding: 12px; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; box-shadow: 0 0 20px rgba(99,102,241,0.25); transition: all 0.2s; }
        .run-btn:hover { transform: translateY(-1px); box-shadow: 0 0 30px rgba(99,102,241,0.45); }

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
        @media (max-width: 640px) {
          .metrics { grid-template-columns: 1fr; }
          .disclaimer { padding: 9px 14px; }
          .main { padding: 14px; }
        }
      `}</style>
    </div>
  );
}
