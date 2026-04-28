import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

export default function Home() {
  const [counts, setCounts] = useState({ c1: 0, c2: 0, c3: 0, c4: 0 });
  const [started, setStarted] = useState(false);
  const [activeDashNav, setActiveDashNav] = useState("Dashboard");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("token"));
  }, []);
  const statsRef = useRef(null);
  const chartRef = useRef(null);
  const canvasRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const section = statsRef.current;
    if (!section) return;

    const animate = (key, target, duration) => {
      const startedAt = Date.now();
      const timer = setInterval(() => {
        const p = Math.min((Date.now() - startedAt) / duration, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        const val = Math.floor(ease * target);
        setCounts((prev) => ({ ...prev, [key]: val }));
        if (p === 1) clearInterval(timer);
      }, 16);
    };

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started) {
            setStarted(true);
            animate("c1", 17, 1500);
            animate("c2", 4466, 2000);
            animate("c3", 280, 1800);
            animate("c4", 4, 1000);
            obs.disconnect();
          }
        });
      },
      { threshold: 0.3 }
    );
    obs.observe(section);
    return () => obs.disconnect();
  }, [started]);

  useEffect(() => {
    let mounted = true;
    import("chart.js/auto").then(({ default: Chart }) => {
      if (!mounted || !canvasRef.current) return;
      if (chartRef.current) chartRef.current.destroy();

      const months = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
      const scrooge = [10000, 10180, 10290, 10420, 10380, 10510, 10630, 10590, 10720, 10850, 10940, 11106];
      const nifty = [10000, 10120, 10200, 10310, 10250, 10380, 10420, 10390, 10480, 10560, 10620, 10710];

      chartRef.current = new Chart(canvasRef.current, {
        type: "line",
        data: {
          labels: months,
          datasets: [
            {
              data: scrooge,
              borderColor: "#FFB700",
              backgroundColor: "rgba(255,183,0,0.08)",
              borderWidth: 1.5,
              pointRadius: 0,
              fill: true,
              tension: 0.4,
            },
            {
              data: nifty,
              borderColor: "rgba(255,255,255,0.2)",
              backgroundColor: "transparent",
              borderWidth: 1,
              pointRadius: 0,
              fill: false,
              tension: 0.4,
              borderDash: [3, 3],
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { x: { display: false }, y: { display: false } },
        },
      });
    });

    return () => {
      mounted = false;
      if (chartRef.current) chartRef.current.destroy();
    };
  }, []);

  return (
    <div className="page">
      <div className="grid-bg" />
      <div className="orb orb1" />
      <div className="orb orb2" />
      <div className="orb orb3" />

      <nav className="nav">
        <div className="logo">
          <img src="/scroogeailogo.png" alt="Scrooge.ai" className="logo-mark" />
          <div className="logo-name">Scrooge<span>.</span>ai</div>
        </div>
        <div className="nav-center">
          <button className="nav-link" type="button" onClick={() => router.push("/simulate")}>How it works</button>
          <button className="nav-link" type="button" onClick={() => router.push("/dashboard")}>Performance</button>
          <button className="nav-link" type="button" onClick={() => router.push("/ai-decisions")}>XAI</button>
        </div>
        <div className="nav-right">
          {isLoggedIn ? (
            <button className="nav-btn nav-btn-primary" onClick={() => router.push("/dashboard")} type="button">Go to Dashboard →</button>
          ) : (
            <>
              <button className="nav-btn" onClick={() => router.push("/login")} type="button">Sign in</button>
              <button className="nav-btn nav-btn-primary" onClick={() => router.push("/login")} type="button">Get started</button>
            </>
          )}
        </div>
      </nav>

      <section className="hero">
        <div className="badge"><div className="badge-dot" /> Powered by Deep Reinforcement Learning · PPO + Dirichlet Policy</div>
        <h1 className="hero-title">
          <span className="plain">Your money.</span>
          <span className="gradient">Managed by AI.</span>
        </h1>
        <p className="hero-sub">Scrooge simulates an institutional-grade hedge fund using a custom PPO agent trained on 17 years of market data — with full explainability for every decision.</p>
        <div className="cta-row">
          <button className="btn-primary" onClick={() => router.push("/simulate")} type="button">Start Simulating Free</button>
          <button className="btn-secondary" onClick={() => router.push("/dashboard")} type="button">View Demo</button>
        </div>
        <div className="stats" ref={statsRef}>
          <div className="stat"><div className="stat-num">{counts.c1}</div><div className="stat-label">Years training data</div></div>
          <div className="stat-divider" />
          <div className="stat"><div className="stat-num">{counts.c2.toLocaleString()}</div><div className="stat-label">AI decisions logged</div></div>
          <div className="stat-divider" />
          <div className="stat"><div className="stat-num">{counts.c3}%</div><div className="stat-label">Historical return</div></div>
          <div className="stat-divider" />
          <div className="stat"><div className="stat-num">{counts.c4}</div><div className="stat-label">Asset classes</div></div>
        </div>
      </section>

      <div className="dashboard-preview">
        <div className="preview-glow" />
        <div className="preview-frame">
          <div className="preview-bar">
            <div className="dot dot-r" /><div className="dot dot-y" /><div className="dot dot-g" />
            <div className="url-bar"><span className="lock">🔒</span> scrooge.ai/dashboard</div>
          </div>
          <div className="dash-layout">
            <div className="dash-sidebar">
              <div className="dash-logo">
                <img src="/scroogeailogo.png" alt="Scrooge.ai" className="dash-logo-mark" />
                <div className="dash-logo-name">Scrooge.ai</div>
              </div>
              {["Dashboard", "Simulate", "AI Decisions", "XAI Insights", "Decision Log", "Reports"].map((item) => (
                <button key={item} className={`dash-nav ${activeDashNav === item ? "active" : ""}`} onClick={() => setActiveDashNav(item)} type="button">
                  <span className="dash-nav-icon">{item === "Dashboard" ? "📊" : item === "Simulate" ? "🤖" : item === "AI Decisions" ? "🧠" : item === "XAI Insights" ? "🔍" : item === "Decision Log" ? "📋" : "📄"}</span>{item}
                </button>
              ))}
            </div>
            <div className="dash-main">
              <div className="dash-header">
                <div><div className="dash-greeting">Good evening, Vishal 👋</div><div className="dash-sub">AI agent active · 4 asset classes · Last updated 2m ago</div></div>
                <button className="dash-simulate-btn" onClick={() => router.push("/simulate")} type="button">Run Simulation</button>
              </div>
              <div className="metrics-row">
                <div className="mini-card"><div className="mc-label">Portfolio Value</div><div className="mc-val" style={{ color: "#34d399" }}>₹11,106</div><div className="mc-sub">+₹1,106 since start</div></div>
                <div className="mini-card"><div className="mc-label">Annual Return</div><div className="mc-val" style={{ color: "#34d399" }}>+11.06%</div><div className="mc-sub">vs 10% Nifty avg</div></div>
                <div className="mini-card"><div className="mc-label">Sharpe Ratio</div><div className="mc-val" style={{ color: "#FFD166" }}>1.39</div><div className="mc-sub">Risk-adjusted</div></div>
                <div className="mini-card"><div className="mc-label">Max Drawdown</div><div className="mc-val" style={{ color: "#fbbf24" }}>-6.03%</div><div className="mc-sub">Worst loss period</div></div>
              </div>
              <div className="charts-row">
                <div className="chart-card">
                  <div className="chart-title">Portfolio vs Nifty 50</div>
                  <div className="chart-area"><canvas ref={canvasRef} /></div>
                </div>
                <div className="alloc-card">
                  <div className="alloc-title">Asset Allocation</div>
                  <div className="alloc-item"><div className="alloc-left"><div className="alloc-dot" style={{ background: "#FFB700" }} />Bond</div><div className="alloc-bar-bg"><div className="alloc-bar" style={{ width: "43%", background: "#FFB700" }} /></div><span style={{ fontSize: "10px", color: "#FFD166" }}>43%</span></div>
                  <div className="alloc-item"><div className="alloc-left"><div className="alloc-dot" style={{ background: "#34d399" }} />Equity</div><div className="alloc-bar-bg"><div className="alloc-bar" style={{ width: "34%", background: "#34d399" }} /></div><span style={{ fontSize: "10px", color: "#34d399" }}>34%</span></div>
                  <div className="alloc-item"><div className="alloc-left"><div className="alloc-dot" style={{ background: "#fbbf24" }} />Defensive</div><div className="alloc-bar-bg"><div className="alloc-bar" style={{ width: "23%", background: "#fbbf24" }} /></div><span style={{ fontSize: "10px", color: "#fbbf24" }}>23%</span></div>
                  <div className="alloc-item"><div className="alloc-left"><div className="alloc-dot" style={{ background: "rgba(255,255,255,0.2)" }} />Commodity</div><div className="alloc-bar-bg"><div className="alloc-bar" style={{ width: "0%", background: "rgba(255,255,255,0.2)" }} /></div><span style={{ fontSize: "10px", color: "rgba(255,255,255,0.2)" }}>0%</span></div>
                </div>
              </div>
              <div className="xai-strip">
                <div className="xai-icon">🧠</div>
                <div className="xai-text"><strong>Why did the AI rebalance today?</strong> Recent returns were strongly positive (+0.63%). The agent detected bullish momentum and maintained Bond-heavy allocation while preserving Equity exposure. Volatility remained low — no defensive shift needed.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="features">
        <h2 className="features-title">Built different.</h2>
        <p className="features-sub">Everything you&apos;d expect from an institutional hedge fund — in a student simulation.</p>
        <div className="features-grid">
          {[
            ["🤖", "Custom Dirichlet Policy", "Novel PPO policy that ensures valid portfolio weights by construction — a theoretical improvement over standard Gaussian policies used in existing literature.", "rgba(255,183,0,0.1)"],
            ["🔍", "Perturbation-based XAI", "Every decision explained in plain English. We measure how much the agent's allocation changes when each market signal is removed — real interpretability, not proxy math.", "rgba(52,211,153,0.1)"],
            ["📊", "17 Years of Training", "Trained on NIFTY 50 data from 2007–2025, including the 2008 financial crisis. The agent learned to survive and thrive across every market regime.", "rgba(251,191,36,0.1)"],
            ["🏦", "4 Asset Classes", "Equity, bonds, commodities, and defensive assets — each with realistic risk/return profiles and low correlations, enabling genuine portfolio diversification.", "rgba(139,92,246,0.1)"],
            ["📋", "Complete Audit Trail", "4,466 decisions logged with zero errors. Every timestep, weight, reward, and capital value — fully transparent, fully auditable, no black boxes.", "rgba(248,113,113,0.1)"],
            ["🌍", "SDG 10 — Reduced Inequalities", "Institutional-grade AI made accessible to everyone. No minimum investment, no Bloomberg terminal required. Just you and the same tools used by hedge funds.", "rgba(52,211,153,0.1)"],
          ].map(([icon, title, desc, bg], i) => (
            <div className="feature-card" key={title} style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="feature-icon" style={{ background: bg }}>{icon}</div>
              <div className="feature-title">{title}</div>
              <div className="feature-desc">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="footer">
        <div className="footer-sdg">🌍 Contributing to UN SDG 10 — Reduced Inequalities</div>
        <div className="footer-disclaimer">Scrooge.ai is a simulation platform built for academic research. No real financial transactions are executed. Past simulation performance does not guarantee future results. This platform is not a registered investment advisor. All investment decisions are simulated using historical market data.</div>
      </footer>

      <style jsx>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .page { background: #000; font-family: -apple-system, "SF Pro Display", BlinkMacSystemFont, sans-serif; color: #fff; overflow-x: hidden; }
        .grid-bg { position: fixed; inset: 0; z-index: 0; background-image: linear-gradient(rgba(255,183,0,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,183,0,0.07) 1px, transparent 1px); background-size: 48px 48px; mask-image: radial-gradient(ellipse 100% 100% at 50% 0%, black 30%, transparent 100%); pointer-events: none; }
        .orb { position: fixed; border-radius: 50%; filter: blur(100px); opacity: 0.35; pointer-events: none; }
        .orb1 { width: 600px; height: 600px; background: radial-gradient(circle, #FFB700, #FF8C00); top: -200px; left: -150px; animation: float1 8s ease-in-out infinite; }
        .orb2 { width: 400px; height: 400px; background: radial-gradient(circle, #FF8C00, #FF8C00); top: 200px; right: -100px; animation: float2 10s ease-in-out infinite; }
        .orb3 { width: 300px; height: 300px; background: radial-gradient(circle, #34d399, #059669); bottom: 100px; left: 25%; animation: float3 7s ease-in-out infinite; }
        @keyframes float1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(30px,-30px) scale(1.05)} }
        @keyframes float2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-20px,20px) scale(1.08)} }
        @keyframes float3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(15px,-25px) scale(1.03)} }
        .nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; display: flex; align-items: center; justify-content: space-between; padding: 20px 48px; background: rgba(0,0,0,0.4); backdrop-filter: blur(20px); border-bottom: 0.5px solid rgba(255,255,255,0.06); }
        .logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .logo-mark { width: 36px; height: 36px; border-radius: 10px; object-fit: cover; box-shadow: 0 0 20px rgba(255,183,0,0.5); }
        .logo-name { font-size: 18px; font-weight: 700; letter-spacing: -0.5px; color: #fff; } .logo-name span { color: #FFB700; }
        .nav-center { display: flex; gap: 4px; } .nav-link { padding: 7px 16px; border-radius: 8px; font-size: 13px; color: rgba(255,255,255,0.5); cursor: pointer; background: transparent; border: none; transition: all 0.2s; } .nav-link:hover { color: #fff; background: rgba(255,255,255,0.06); }
        .nav-right { display: flex; gap: 10px; align-items: center; } .nav-btn { padding: 8px 20px; border-radius: 8px; font-size: 13px; cursor: pointer; border: 0.5px solid rgba(255,255,255,0.15); background: transparent; color: rgba(255,255,255,0.7); transition: all 0.2s; } .nav-btn:hover { background: rgba(255,255,255,0.08); }
        .nav-btn-primary { background: #FFB700; border-color: #FFB700; color: #fff; box-shadow: 0 0 20px rgba(255,183,0,0.4); } .nav-btn-primary:hover { background: #FF8C00; box-shadow: 0 0 30px rgba(255,183,0,0.6); }
        .hero { position: relative; z-index: 10; text-align: center; padding: 160px 48px 80px; }
        .badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(255,183,0,0.08); border: 0.5px solid rgba(255,183,0,0.25); border-radius: 20px; padding: 7px 18px; font-size: 12px; color: #FFD166; margin-bottom: 28px; animation: fadeUp 0.8s ease both; }
        .badge-dot { width: 6px; height: 6px; border-radius: 50%; background: #FFB700; animation: pulse 2s infinite; } @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(1.8)} }
        .hero-title { font-size: 72px; font-weight: 800; letter-spacing: -3px; line-height: 1.05; margin-bottom: 24px; animation: fadeUp 0.8s 0.1s ease both; } .hero-title .plain { display: block; color: #fff; } .hero-title .gradient { display: block; background: linear-gradient(135deg, #FFB700 0%, #FF8C00 40%, #34d399 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .hero-sub { font-size: 18px; color: rgba(255,255,255,0.4); max-width: 560px; margin: 0 auto 44px; line-height: 1.7; animation: fadeUp 0.8s 0.2s ease both; }
        .cta-row { display: flex; gap: 14px; justify-content: center; margin-bottom: 72px; animation: fadeUp 0.8s 0.3s ease both; }
        .btn-primary { background: linear-gradient(135deg, #FFB700, #FF8C00); border: none; color: #fff; padding: 16px 36px; border-radius: 14px; font-size: 15px; font-weight: 600; cursor: pointer; box-shadow: 0 0 40px rgba(255,183,0,0.45); transition: all 0.3s; position: relative; overflow: hidden; }
        .btn-primary::before { content: ""; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent); }
        .btn-primary:hover { transform: translateY(-3px); box-shadow: 0 0 60px rgba(255,183,0,0.65); }
        .btn-secondary { background: rgba(255,255,255,0.05); border: 0.5px solid rgba(255,255,255,0.15); color: rgba(255,255,255,0.8); padding: 16px 36px; border-radius: 14px; font-size: 15px; font-weight: 500; cursor: pointer; backdrop-filter: blur(10px); transition: all 0.3s; }
        .btn-secondary:hover { background: rgba(255,255,255,0.1); transform: translateY(-2px); }
        .stats { display: flex; justify-content: center; gap: 64px; margin-bottom: 80px; animation: fadeUp 0.8s 0.4s ease both; }
        .stat { text-align: center; } .stat-num { font-size: 40px; font-weight: 800; letter-spacing: -2px; background: linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.5) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .stat-label { font-size: 11px; color: rgba(255,255,255,0.3); margin-top: 4px; letter-spacing: 0.08em; text-transform: uppercase; } .stat-divider { width: 0.5px; background: rgba(255,255,255,0.08); align-self: stretch; margin: 4px 0; }
        .dashboard-preview { position: relative; z-index: 10; max-width: 1000px; margin: 0 auto; padding: 0 48px 80px; animation: fadeUp 0.8s 0.5s ease both; }
        .preview-glow { position: absolute; inset: -2px; border-radius: 22px; background: linear-gradient(135deg, rgba(255,183,0,0.4), transparent 40%, rgba(139,92,246,0.3)); z-index: -1; filter: blur(1px); }
        .preview-frame { background: rgba(10,10,20,0.9); border: 0.5px solid rgba(255,255,255,0.08); border-radius: 20px; overflow: hidden; backdrop-filter: blur(20px); box-shadow: 0 40px 80px rgba(0,0,0,0.6), 0 0 0 0.5px rgba(255,255,255,0.05); }
        .preview-bar { background: rgba(255,255,255,0.02); padding: 12px 16px; display: flex; align-items: center; gap: 8px; border-bottom: 0.5px solid rgba(255,255,255,0.05); }
        .dot { width: 10px; height: 10px; border-radius: 50%; } .dot-r{background:#ff5f57;} .dot-y{background:#febc2e;} .dot-g{background:#28c840;}
        .url-bar { flex: 1; margin: 0 16px; background: rgba(255,255,255,0.03); border-radius: 6px; padding: 4px 14px; font-size: 11px; color: rgba(255,255,255,0.2); display: flex; align-items: center; gap: 6px; } .lock { color: rgba(255,255,255,0.15); font-size: 10px; }
        .dash-layout { display: grid; grid-template-columns: 180px 1fr; min-height: 380px; }
        .dash-sidebar { background: rgba(0,0,0,0.3); border-right: 0.5px solid rgba(255,255,255,0.04); padding: 16px 10px; display: flex; flex-direction: column; gap: 2px; }
        .dash-logo { display: flex; align-items: center; gap: 7px; padding: 8px 10px; margin-bottom: 12px; }
        .dash-logo-mark { width: 24px; height: 24px; border-radius: 6px; object-fit: cover; }
        .dash-logo-name { font-size: 13px; font-weight: 700; letter-spacing: -0.3px; }
        .dash-nav { display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:7px;font-size:11px;color:rgba(255,255,255,0.35);cursor:pointer;transition:all 0.2s; background: transparent; border: none; width: 100%; text-align: left; }
        .dash-nav:hover { background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.6); }
        .dash-nav.active { background:rgba(255,183,0,0.1);color:#FFD166; }
        .dash-nav-icon { font-size:12px;width:16px; }
        .dash-main { padding: 16px; display: flex; flex-direction: column; gap: 12px; }
        .dash-header { display:flex;justify-content:space-between;align-items:center; }
        .dash-greeting { font-size:14px;font-weight:600;letter-spacing:-0.3px; }
        .dash-sub { font-size:10px;color:rgba(255,255,255,0.3);margin-top:1px; }
        .dash-simulate-btn { background:linear-gradient(135deg,#FFB700,#FF8C00);border:none;color:#fff;padding:7px 16px;border-radius:8px;font-size:11px;font-weight:600;cursor:pointer;box-shadow:0 0 15px rgba(255,183,0,0.3); }
        .metrics-row { display:grid;grid-template-columns:repeat(4,1fr);gap:8px; }
        .mini-card { background:rgba(255,255,255,0.03);border:0.5px solid rgba(255,255,255,0.06);border-radius:10px;padding:10px 12px; }
        .mc-label { font-size:9px;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px; }
        .mc-val { font-size:16px;font-weight:700;letter-spacing:-0.5px; } .mc-sub { font-size:9px;color:rgba(255,255,255,0.25);margin-top:2px; }
        .charts-row { display:grid;grid-template-columns:1fr 160px;gap:8px; } .chart-card { background:rgba(255,255,255,0.02);border:0.5px solid rgba(255,255,255,0.05);border-radius:10px;padding:12px; }
        .chart-title { font-size:10px;font-weight:600;color:rgba(255,255,255,0.6);margin-bottom:8px; } .chart-area { position:relative;height:80px; }
        .alloc-card { background:rgba(255,255,255,0.02);border:0.5px solid rgba(255,255,255,0.05);border-radius:10px;padding:12px; } .alloc-title { font-size:10px;font-weight:600;color:rgba(255,255,255,0.6);margin-bottom:10px; }
        .alloc-item { display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;font-size:10px; } .alloc-left { display:flex;align-items:center;gap:6px;color:rgba(255,255,255,0.5); }
        .alloc-dot { width:6px;height:6px;border-radius:50%; } .alloc-bar-bg { width:60px;height:3px;background:rgba(255,255,255,0.06);border-radius:2px; } .alloc-bar { height:3px;border-radius:2px; }
        .xai-strip { background:rgba(255,183,0,0.05);border:0.5px solid rgba(255,183,0,0.12);border-radius:10px;padding:10px 14px;display:flex;align-items:center;gap:10px; }
        .xai-icon { width:28px;height:28px;background:rgba(255,183,0,0.15);border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0; }
        .xai-text { font-size:10px;color:rgba(255,255,255,0.5);line-height:1.5; } .xai-text strong { color:#FFD166; }
        .features { position:relative;z-index:10;padding:0 48px 80px;max-width:1000px;margin:0 auto; }
        .features-title { text-align:center;font-size:36px;font-weight:800;letter-spacing:-1.5px;margin-bottom:8px; }
        .features-sub { text-align:center;font-size:15px;color:rgba(255,255,255,0.4);margin-bottom:48px; }
        .features-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:16px; }
        .feature-card { background:rgba(255,255,255,0.02);border:0.5px solid rgba(255,255,255,0.07); border-radius:16px;padding:24px; transition:all 0.3s;cursor:default; }
        .feature-card:hover { background:rgba(255,255,255,0.04);border-color:rgba(255,183,0,0.3);transform:translateY(-4px); }
        .feature-icon { width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;margin-bottom:14px; }
        .feature-title { font-size:14px;font-weight:600;margin-bottom:6px;letter-spacing:-0.3px; }
        .feature-desc { font-size:12px;color:rgba(255,255,255,0.4);line-height:1.6; }
        .footer { position:relative;z-index:10;text-align:center;padding:32px 48px;border-top:0.5px solid rgba(255,255,255,0.05); }
        .footer-disclaimer { font-size:11px;color:rgba(255,255,255,0.2);line-height:1.6;max-width:600px;margin:0 auto; }
        .footer-sdg { display:inline-flex;align-items:center;gap:8px;background:rgba(52,211,153,0.06);border:0.5px solid rgba(52,211,153,0.12);border-radius:20px;padding:7px 18px;font-size:11px;color:#34d399;margin-bottom:16px; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }

        @media (max-width: 1100px) {
          .hero-title { font-size: 56px; }
          .stats { gap: 24px; }
          .features-grid { grid-template-columns: repeat(2, 1fr); }
          .dash-layout { grid-template-columns: 1fr; }
          .dash-sidebar { border-right: 0; border-bottom: 0.5px solid rgba(255,255,255,0.04); }
        }
        @media (max-width: 800px) {
          .nav { padding: 14px 16px; }
          .nav-center { display: none; }
          .hero { padding: 120px 20px 50px; }
          .hero-title { font-size: 42px; letter-spacing: -1.5px; }
          .cta-row { flex-direction: column; }
          .stats { flex-direction: column; }
          .stat-divider { display: none; }
          .dashboard-preview, .features, .footer { padding-left: 16px; padding-right: 16px; }
          .features-grid { grid-template-columns: 1fr; }
          .metrics-row { grid-template-columns: 1fr 1fr; }
          .charts-row { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .hero { padding: 100px 20px 60px; }
          .hero-title { font-size: 36px; letter-spacing: -1px; line-height: 1.2; }
          .hero-sub { font-size: 14px; max-width: 100%; margin-bottom: 32px; }
          .stats { flex-direction: column; gap: 20px; margin-bottom: 60px; }
          .stat { flex-direction: column; }
          .stat-divider { display: none; }
          .cta-row { flex-direction: column; gap: 10px; }
          .btn-primary, .btn-secondary { width: 100%; }
          .badge { font-size: 11px; }
          .features-grid { grid-template-columns: 1fr; }
          .metrics-row { grid-template-columns: repeat(2, 1fr); }
          .charts-row { grid-template-columns: 1fr; }
          .dashboard-preview { padding: 0 20px 60px; }
          .footer { padding: 20px 20px; }
        }
        @media (max-width: 520px) {
          .metrics-row { grid-template-columns: 1fr; }
          .nav-right { gap: 6px; }
          .nav-btn { padding: 7px 12px; font-size: 12px; }
          .hero { padding: 80px 16px 40px; }
          .hero-title { font-size: 28px; }
          .hero-sub { font-size: 13px; }
          .badge { padding: 5px 12px; font-size: 10px; }
          .dashboard-preview { padding: 0 16px 40px; }
        }
      `}</style>
    </div>
  );
}