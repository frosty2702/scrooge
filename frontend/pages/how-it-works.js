import { useRouter } from "next/router";

export default function HowItWorksPage() {
  const router = useRouter();

  const steps = [
    {
      num: "01",
      title: "Create Your Account",
      desc: "Sign up in seconds. No credit card, no real money. Scrooge.ai is a fully simulated environment built for learning and research.",
      icon: "👤",
    },
    {
      num: "02",
      title: "Complete KYC",
      desc: "Fill in a short investor profile — your risk tolerance, investment horizon, and goals. This personalises the AI agent's behaviour for your simulation.",
      icon: "📋",
    },
    {
      num: "03",
      title: "Run a Simulation",
      desc: "Pick a date range and let the Reinforcement Learning agent trade on historical market data. The agent rebalances a multi-asset portfolio every day using real price signals.",
      icon: "🤖",
    },
    {
      num: "04",
      title: "Inspect AI Decisions",
      desc: "Every allocation decision is logged with full transparency — what the agent bought, sold, and why. View confidence scores and decision rationale in plain English.",
      icon: "🧠",
    },
    {
      num: "05",
      title: "Understand with XAI",
      desc: "Perturbation-based Explainable AI measures exactly how much each market signal (returns, volatility, momentum, market regime) influenced every decision.",
      icon: "🔍",
    },
    {
      num: "06",
      title: "Review Your Performance",
      desc: "See cumulative returns, Sharpe ratio, max drawdown, and benchmark comparisons. Export a full report for your records or coursework submission.",
      icon: "📊",
    },
  ];

  const tech = [
    { label: "RL Agent", value: "PPO (Proximal Policy Optimisation) via Stable-Baselines3" },
    { label: "Environment", value: "Custom Gymnasium environment with multi-asset portfolio dynamics" },
    { label: "Market Data", value: "Historical OHLCV data — Equities, Bonds, Commodities, Crypto, Real Estate" },
    { label: "XAI Method", value: "Perturbation-based feature importance (direct sensitivity measurement)" },
    { label: "Backend", value: "FastAPI + SQLAlchemy — RESTful API with JWT authentication" },
    { label: "Frontend", value: "Next.js — server-side rendered React with real-time chart visualisations" },
  ];

  return (
    <div className="page">
      <div className="orb orb1" />
      <div className="orb orb2" />

      {/* Nav */}
      <nav className="nav">
        <div className="nav-logo" onClick={() => router.push("/")} style={{ cursor: "pointer" }}>
          <span className="logo-icon">$</span>
          <span className="logo-text">Scrooge.ai</span>
        </div>
        <div className="nav-right">
          <button className="nav-btn" onClick={() => router.push("/login")} type="button">Sign in</button>
          <button className="nav-btn nav-btn-primary" onClick={() => router.push("/login")} type="button">Get started</button>
        </div>
      </nav>

      <div className="content">
        {/* Hero */}
        <div className="hero">
          <div className="hero-badge">How It Works</div>
          <h1 className="hero-title">From sign-up to insights<br />in six steps</h1>
          <p className="hero-sub">
            Scrooge.ai is an AI-powered portfolio simulation platform. A Reinforcement Learning agent trades on your behalf using real historical data — and every single decision is fully explained.
          </p>
          <div className="hero-actions">
            <button className="btn-primary" onClick={() => router.push("/login")} type="button">Try it free →</button>
            <a className="btn-secondary" href="/docs/scrooge-documentation.pdf" download>
              Download Documentation ↓
            </a>
          </div>
        </div>

        {/* Steps */}
        <div className="steps-section">
          <div className="section-label">The Process</div>
          <div className="steps-grid">
            {steps.map((step, i) => (
              <div className="step-card" key={i}>
                <div className="step-top">
                  <div className="step-icon">{step.icon}</div>
                  <div className="step-num">{step.num}</div>
                </div>
                <div className="step-title">{step.title}</div>
                <div className="step-desc">{step.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Architecture */}
        <div className="arch-section">
          <div className="section-label">Under the Hood</div>
          <h2 className="section-title">What powers Scrooge.ai</h2>
          <div className="tech-grid">
            {tech.map((t, i) => (
              <div className="tech-row" key={i}>
                <div className="tech-label">{t.label}</div>
                <div className="tech-value">{t.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="cta-section">
          <h2 className="cta-title">Ready to see your AI agent in action?</h2>
          <p className="cta-sub">No real money. No risk. Just intelligent simulation.</p>
          <button className="btn-primary" onClick={() => router.push("/login")} type="button">Start for free →</button>
        </div>
      </div>

      <style jsx>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .page { background: #000; font-family: -apple-system, "SF Pro Display", BlinkMacSystemFont, sans-serif; color: #fff; min-height: 100vh; overflow-x: hidden; }
        .orb { position: fixed; border-radius: 50%; filter: blur(140px); opacity: 0.15; pointer-events: none; z-index: 0; }
        .orb1 { width: 500px; height: 500px; background: radial-gradient(circle, #FFB700, #FF8C00); top: -150px; right: -100px; }
        .orb2 { width: 350px; height: 350px; background: radial-gradient(circle, #34d399, #059669); bottom: 100px; left: -100px; }

        .nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; display: flex; align-items: center; justify-content: space-between; padding: 20px 48px; background: rgba(0,0,0,0.6); backdrop-filter: blur(20px); border-bottom: 0.5px solid rgba(255,255,255,0.06); }
        .nav-logo { display: flex; align-items: center; gap: 10px; }
        .logo-icon { width: 28px; height: 28px; background: linear-gradient(135deg, #FFB700, #FF8C00); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; color: #000; }
        .logo-text { font-size: 15px; font-weight: 700; letter-spacing: -0.5px; }
        .nav-right { display: flex; gap: 10px; align-items: center; }
        .nav-btn { padding: 8px 20px; border-radius: 8px; font-size: 13px; cursor: pointer; border: 0.5px solid rgba(255,255,255,0.15); background: transparent; color: rgba(255,255,255,0.7); transition: all 0.2s; }
        .nav-btn:hover { background: rgba(255,255,255,0.08); }
        .nav-btn-primary { background: #FFB700; border-color: #FFB700; color: #000; font-weight: 600; }
        .nav-btn-primary:hover { background: #FF8C00; }

        .content { max-width: 960px; margin: 0 auto; padding: 120px 32px 80px; position: relative; z-index: 10; }

        .hero { text-align: center; margin-bottom: 80px; }
        .hero-badge { display: inline-block; background: rgba(255,183,0,0.1); border: 0.5px solid rgba(255,183,0,0.3); color: #FFB700; font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; padding: 6px 14px; border-radius: 20px; margin-bottom: 20px; }
        .hero-title { font-size: 48px; font-weight: 800; letter-spacing: -1.5px; line-height: 1.1; margin-bottom: 18px; }
        .hero-sub { font-size: 16px; color: rgba(255,255,255,0.45); line-height: 1.7; max-width: 540px; margin: 0 auto 32px; }
        .hero-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
        .btn-primary { background: linear-gradient(135deg, #FFB700, #FF8C00); border: none; color: #000; padding: 14px 32px; border-radius: 12px; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
        .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
        .btn-secondary { background: transparent; border: 0.5px solid rgba(255,255,255,0.2); color: rgba(255,255,255,0.7); padding: 14px 32px; border-radius: 12px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; text-decoration: none; display: inline-block; }
        .btn-secondary:hover { background: rgba(255,255,255,0.06); color: #fff; }

        .section-label { font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #FFB700; margin-bottom: 12px; }
        .section-title { font-size: 28px; font-weight: 700; letter-spacing: -0.8px; margin-bottom: 32px; }

        .steps-section { margin-bottom: 80px; }
        .steps-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        .step-card { background: rgba(255,255,255,0.02); border: 0.5px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 22px; transition: border-color 0.2s; }
        .step-card:hover { border-color: rgba(255,183,0,0.2); }
        .step-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; }
        .step-icon { font-size: 24px; }
        .step-num { font-size: 11px; font-weight: 700; color: rgba(255,183,0,0.4); letter-spacing: 0.05em; }
        .step-title { font-size: 14px; font-weight: 600; margin-bottom: 8px; }
        .step-desc { font-size: 12px; color: rgba(255,255,255,0.38); line-height: 1.65; }

        .arch-section { background: rgba(255,255,255,0.015); border: 0.5px solid rgba(255,255,255,0.07); border-radius: 20px; padding: 36px; margin-bottom: 60px; }
        .tech-grid { display: flex; flex-direction: column; gap: 0; }
        .tech-row { display: flex; gap: 24px; padding: 14px 0; border-bottom: 0.5px solid rgba(255,255,255,0.05); align-items: baseline; }
        .tech-row:last-child { border-bottom: none; }
        .tech-label { font-size: 12px; font-weight: 600; color: #FFD166; width: 160px; flex-shrink: 0; }
        .tech-value { font-size: 13px; color: rgba(255,255,255,0.45); line-height: 1.5; }

        .cta-section { text-align: center; padding: 60px; background: rgba(255,183,0,0.04); border: 0.5px solid rgba(255,183,0,0.1); border-radius: 20px; }
        .cta-title { font-size: 28px; font-weight: 700; letter-spacing: -0.8px; margin-bottom: 10px; }
        .cta-sub { font-size: 14px; color: rgba(255,255,255,0.35); margin-bottom: 28px; }

        @media (max-width: 768px) {
          .nav { padding: 16px 20px; }
          .content { padding: 100px 20px 60px; }
          .hero-title { font-size: 32px; }
          .steps-grid { grid-template-columns: 1fr; }
          .tech-row { flex-direction: column; gap: 4px; }
          .tech-label { width: auto; }
          .cta-section { padding: 36px 20px; }
        }
      `}</style>
    </div>
  );
}
