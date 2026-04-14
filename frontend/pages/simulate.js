import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";

export default function SimulatePage() {
  const [selectedPeriod, setSelectedPeriod] = useState("1year");
  const [running, setRunning] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const chartCanvasRef = useRef(null);
  const chartRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    if (!showResults) return;
    let active = true;
    import("chart.js/auto").then(({ default: Chart }) => {
      if (!active || !chartCanvasRef.current) return;
      if (chartRef.current) chartRef.current.destroy();
      const weeks = Array.from({ length: 52 }, (_, i) => `W${i + 1}`);
      const data = [
        10000, 10075, 10120, 10190, 10255, 10310, 10365, 10420, 10495, 10540, 10480, 10525, 10590,
        10610, 10655, 10720, 10680, 10740, 10810, 10865, 10810, 10890, 10930, 10885, 10960, 11010,
        11055, 11020, 11070, 11120, 11180, 11220, 11165, 11235, 11290, 11350, 11310, 11370, 11420,
        11485, 11430, 11495, 11560, 11620, 11595, 11640, 11695, 11720, 11680, 11630, 11580, 11106,
      ];

      chartRef.current = new Chart(chartCanvasRef.current, {
        type: "line",
        data: {
          labels: weeks,
          datasets: [
            {
              data,
              borderColor: "#6366f1",
              backgroundColor: "rgba(99,102,241,0.07)",
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
  }, [showResults]);

  const runSim = () => {
    setShowResults(false);
    setRunning(true);
    setTimeout(() => {
      setRunning(false);
      setShowResults(true);
    }, 2200);
  };

  return (
    <div className="page">
      <div className="orb orb1" />
      <div className="orb orb2" />
      <div className="disclaimer">⚠ Simulation only — no real investments are made. Past performance does not guarantee future results.</div>
      <div className="app">
        <div className="sidebar">
          <button className="sidebar-logo" onClick={() => router.push("/dashboard")} type="button">
            <div className="sidebar-logo-mark">S</div>
            <div className="sidebar-logo-name">Scrooge<span>.</span>ai</div>
          </button>
          <button className="nav-item" onClick={() => router.push("/dashboard")} type="button"><span>📊</span> Dashboard</button>
          <div className="nav-item active"><span>🤖</span> Simulate</div>
          <div className="nav-item"><span>🧠</span> AI Decisions</div>
          <div className="nav-item"><span>📈</span> Portfolio</div>
          <div className="nav-item"><span>🔍</span> XAI Insights</div>
          <div className="nav-item"><span>📋</span> Decision Log</div>
          <div className="nav-item"><span>📄</span> Reports</div>
          <div className="nav-item"><span>⚙️</span> Settings</div>
        </div>
        <div className="main">
          <div className="page-title">Run a Simulation</div>
          <div className="page-sub">Let the AI agent simulate your investment across 4 asset classes</div>
          <div className="sim-input-card">
            <div className="input-row">
              <div className="field-group">
                <label>Investment Amount</label>
                <input className="amount-input" type="text" defaultValue="₹10,000" id="amountInput" />
              </div>
              <div className="field-group">
                <label>Time Horizon</label>
                <div className="period-toggle">
                  <button className={`period-btn ${selectedPeriod === "6months" ? "active" : ""}`} onClick={() => setSelectedPeriod("6months")} type="button">6 Months</button>
                  <button className={`period-btn ${selectedPeriod === "1year" ? "active" : ""}`} onClick={() => setSelectedPeriod("1year")} type="button">1 Year</button>
                </div>
              </div>
              <button className={`run-btn ${running ? "loading" : ""}`} onClick={runSim} type="button">Simulate Now</button>
            </div>
          </div>

          {running && (
            <div className="loading-state">
              <div className="loading-spinner" />
              <div className="loading-text">AI agent is making decisions...</div>
              <div className="loading-sub">Analyzing 17 years of market data</div>
            </div>
          )}

          {showResults && (
            <div className="results">
              <div className="results-header">
                <div className="results-title">Simulation Results — 1 Year</div>
                <div className="results-time">Simulated on historical data · 252 trading days</div>
              </div>
              <div className="metrics-row">
                <div className="metric" style={{ animationDelay: "0s" }}><div className="metric-label">Final Value</div><div className="metric-value green">₹11,106</div><div className="metric-sub">Started with ₹10,000</div></div>
                <div className="metric" style={{ animationDelay: "0.05s" }}><div className="metric-label">Annual Return</div><div className="metric-value green">+11.06%</div><div className="metric-sub">vs 10% market average</div></div>
                <div className="metric" style={{ animationDelay: "0.1s" }}><div className="metric-label">Sharpe Ratio</div><div className="metric-value blue">1.39</div><div className="metric-sub">Risk-adjusted return</div></div>
                <div className="metric" style={{ animationDelay: "0.15s" }}><div className="metric-label">Max Drawdown</div><div className="metric-value amber">-6.03%</div><div className="metric-sub">Worst loss period</div></div>
              </div>
              <div className="charts-row">
                <div className="card">
                  <div className="card-title">Capital Growth Curve</div>
                  <div className="card-sub">Portfolio value over the simulation period</div>
                  <div className="chart-area"><canvas ref={chartCanvasRef} /></div>
                </div>
                <div className="card">
                  <div className="card-title">Asset Allocation</div>
                  <div className="card-sub">How the AI distributed your money</div>
                  <div className="alloc-item"><div className="alloc-left"><div className="alloc-dot" style={{ background: "#6366f1" }} />Bond</div><div style={{ display: "flex", alignItems: "center", gap: "8px" }}><div className="alloc-bar-bg"><div className="alloc-bar" style={{ width: "43%", background: "#6366f1" }} /></div><div className="alloc-pct blue">43%</div></div></div>
                  <div className="alloc-item"><div className="alloc-left"><div className="alloc-dot" style={{ background: "#34d399" }} />Equity</div><div style={{ display: "flex", alignItems: "center", gap: "8px" }}><div className="alloc-bar-bg"><div className="alloc-bar" style={{ width: "34%", background: "#34d399" }} /></div><div className="alloc-pct green">34%</div></div></div>
                  <div className="alloc-item"><div className="alloc-left"><div className="alloc-dot" style={{ background: "#fbbf24" }} />Defensive</div><div style={{ display: "flex", alignItems: "center", gap: "8px" }}><div className="alloc-bar-bg"><div className="alloc-bar" style={{ width: "23%", background: "#fbbf24" }} /></div><div className="alloc-pct amber">23%</div></div></div>
                  <div className="alloc-item"><div className="alloc-left"><div className="alloc-dot" style={{ background: "rgba(255,255,255,0.15)" }} />Commodity</div><div style={{ display: "flex", alignItems: "center", gap: "8px" }}><div className="alloc-bar-bg"><div className="alloc-bar" style={{ width: "0%" }} /></div><div className="alloc-pct" style={{ color: "rgba(255,255,255,0.2)" }}>0%</div></div></div>
                </div>
              </div>
              <div className="charts-row">
                <div className="card xai-card">
                  <div className="card-title">Why did the AI make these decisions?</div>
                  <div className="card-sub">Perturbation-based feature importance across all decisions</div>
                  <div className="xai-explain"><strong>AI Explanation:</strong> The agent primarily responded to strong recent returns (49%) and moderate volatility (26%). The momentum indicator (MA ratio) confirmed a bullish trend. Market regime was stable throughout the simulation period, requiring no defensive reallocation.</div>
                  <div className="imp-row"><div className="imp-label">Returns</div><div className="imp-bar-bg"><div className="imp-bar" style={{ width: "49%", background: "#6366f1" }} /></div><div className="imp-pct">49%</div></div>
                  <div className="imp-row"><div className="imp-label">Volatility</div><div className="imp-bar-bg"><div className="imp-bar" style={{ width: "26%", background: "#8b5cf6" }} /></div><div className="imp-pct">26%</div></div>
                  <div className="imp-row"><div className="imp-label">Momentum</div><div className="imp-bar-bg"><div className="imp-bar" style={{ width: "20%", background: "#34d399" }} /></div><div className="imp-pct">20%</div></div>
                  <div className="imp-row"><div className="imp-label">Regime</div><div className="imp-bar-bg"><div className="imp-bar" style={{ width: "5%", background: "#fbbf24" }} /></div><div className="imp-pct">5%</div></div>
                </div>
                <div className="card comparison-card">
                  <div className="card-title">Strategy Comparison</div>
                  <div className="card-sub">PPO Agent vs classical strategies (17 years)</div>
                  <table className="comp-table">
                    <thead><tr><th>Strategy</th><th>Return</th><th>Sharpe</th><th>Drawdown</th></tr></thead>
                    <tbody>
                      <tr><td>Equal Weight</td><td className="green">301%</td><td>1.13</td><td className="red">-17%</td></tr>
                      <tr><td>Mean Variance</td><td className="amber">123%</td><td>0.61</td><td className="red">-19%</td></tr>
                      <tr className="highlight"><td>PPO Agent<span className="ai-badge">AI</span></td><td className="green">280%</td><td className="blue">1.04</td><td className="amber">-18.6%</td></tr>
                    </tbody>
                  </table>
                  <div style={{ marginTop: "12px", fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>PPO delivers 2.3x the return of Mean Variance</div>
                </div>
              </div>
              <div className="bottom-actions">
                <button className="btn-outline" onClick={() => setShowResults(false)} type="button">Run another</button>
                <button className="btn-outline" type="button">View AI decisions</button>
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
        .orb1 { width: 450px; height: 450px; background: radial-gradient(circle, #6366f1, #4f46e5); top: -100px; left: -100px; }
        .orb2 { width: 300px; height: 300px; background: radial-gradient(circle, #34d399, #059669); bottom: 0; right: 0; }
        .disclaimer { background: rgba(251,191,36,0.07); border-bottom: 0.5px solid rgba(251,191,36,0.12); padding: 9px 24px; font-size: 12px; color: rgba(251,191,36,0.7); position: relative; z-index: 10; }
        .app { display: flex; position: relative; z-index: 10; min-height: calc(100vh - 37px); }
        .sidebar { width: 220px; border-right: 0.5px solid rgba(255,255,255,0.05); padding: 20px 12px; background: rgba(0,0,0,0.3); backdrop-filter: blur(20px); }
        .sidebar-logo { display: flex; align-items: center; gap: 9px; padding: 10px 12px; margin-bottom: 16px; cursor: pointer; border: none; background: transparent; color: #fff; width: 100%; text-align: left; }
        .sidebar-logo-mark { width: 30px; height: 30px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; }
        .sidebar-logo-name { font-size: 15px; font-weight: 700; letter-spacing: -0.5px; }
        .sidebar-logo-name span { color: #6366f1; }
        .nav-item { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 9px; font-size: 13px; color: rgba(255,255,255,0.4); cursor: pointer; transition: all 0.2s; margin-bottom: 2px; border: none; background: transparent; width: 100%; text-align: left; }
        .nav-item:hover { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.7); }
        .nav-item.active { background: rgba(99,102,241,0.1); color: #818cf8; border: 0.5px solid rgba(99,102,241,0.15); }
        .main { flex: 1; padding: 28px 32px; }
        .page-title { font-size: 22px; font-weight: 700; letter-spacing: -0.8px; margin-bottom: 4px; }
        .page-sub { font-size: 13px; color: rgba(255,255,255,0.35); margin-bottom: 28px; }
        .sim-input-card { background: rgba(255,255,255,0.02); border: 0.5px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 28px; margin-bottom: 20px; }
        .input-row { display: grid; grid-template-columns: 1fr 1fr 200px; gap: 20px; align-items: end; }
        .field-group label { font-size: 11px; color: rgba(255,255,255,0.35); display: block; margin-bottom: 8px; letter-spacing: 0.06em; text-transform: uppercase; }
        .amount-input { width: 100%; background: rgba(255,255,255,0.04); border: 0.5px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 14px 18px; font-size: 20px; font-weight: 700; color: #fff; outline: none; letter-spacing: -0.5px; transition: border-color 0.2s; }
        .amount-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
        .period-toggle { display: flex; background: rgba(255,255,255,0.04); border: 0.5px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 4px; }
        .period-btn { flex: 1; padding: 11px 16px; border-radius: 9px; font-size: 14px; font-weight: 500; border: none; background: transparent; color: rgba(255,255,255,0.4); cursor: pointer; transition: all 0.2s; }
        .period-btn.active { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; box-shadow: 0 0 15px rgba(99,102,241,0.3); }
        .run-btn { width: 100%; background: linear-gradient(135deg, #6366f1, #8b5cf6); border: none; color: #fff; padding: 15px; border-radius: 12px; font-size: 15px; font-weight: 600; cursor: pointer; box-shadow: 0 0 25px rgba(99,102,241,0.3); transition: all 0.3s; position: relative; overflow: hidden; }
        .run-btn::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255,255,255,0.1), transparent); }
        .run-btn:hover { transform: translateY(-2px); box-shadow: 0 0 40px rgba(99,102,241,0.5); }
        .run-btn.loading { opacity: 0.7; }
        .loading-state { text-align: center; padding: 48px; }
        .loading-spinner { width: 48px; height: 48px; border: 2px solid rgba(99,102,241,0.2); border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
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
        .green{color:#34d399;} .blue{color:#818cf8;} .amber{color:#fbbf24;} .red{color:#f87171;}
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
        .xai-explain { background: rgba(99,102,241,0.06); border: 0.5px solid rgba(99,102,241,0.15); border-radius: 12px; padding: 14px; margin-bottom: 14px; font-size: 13px; color: rgba(255,255,255,0.65); line-height: 1.7; }
        .xai-explain strong { color: #a5b4fc; }
        .imp-row { display: flex; align-items: center; gap: 8px; margin-bottom: 9px; font-size: 12px; }
        .imp-label { width: 72px; color: rgba(255,255,255,0.4); }
        .imp-bar-bg { flex: 1; height: 5px; background: rgba(255,255,255,0.05); border-radius: 3px; }
        .imp-bar { height: 5px; border-radius: 3px; }
        .imp-pct { width: 32px; text-align: right; color: #818cf8; font-size: 11px; }
        .comparison-card { animation: fadeIn 0.4s 0.3s ease both; }
        .comp-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .comp-table th { text-align: left; padding: 8px 12px; font-size: 10px; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 0.5px solid rgba(255,255,255,0.06); }
        .comp-table td { padding: 11px 12px; border-bottom: 0.5px solid rgba(255,255,255,0.04); }
        .comp-table tr:last-child td { border-bottom: none; }
        .comp-table tr.highlight td { background: rgba(99,102,241,0.06); }
        .ai-badge { display: inline-block; background: rgba(99,102,241,0.15); color: #818cf8; font-size: 9px; padding: 2px 7px; border-radius: 8px; margin-left: 6px; }
        .bottom-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 16px; animation: fadeIn 0.4s 0.4s ease both; flex-wrap: wrap; }
        .btn-outline { background: transparent; border: 0.5px solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.6); padding: 11px 24px; border-radius: 10px; font-size: 13px; cursor: pointer; transition: all 0.2s; }
        .btn-outline:hover { background: rgba(255,255,255,0.05); }
        .btn-primary { background: linear-gradient(135deg, #6366f1, #8b5cf6); border: none; color: #fff; padding: 11px 24px; border-radius: 10px; font-size: 13px; font-weight: 500; cursor: pointer; }

        @media (max-width: 1200px) {
          .input-row { grid-template-columns: 1fr; }
          .metrics-row { grid-template-columns: repeat(2,1fr); }
          .charts-row { grid-template-columns: 1fr; }
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
