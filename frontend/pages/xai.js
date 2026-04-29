import { useRouter } from "next/router";

export default function XAIPage() {
  const router = useRouter();

  const features = [
    {
      name: "Returns",
      icon: "📈",
      color: "#FFB700",
      desc: "Recent daily percentage gains or losses for each asset. High positive returns signal momentum — the agent may increase allocation.",
    },
    {
      name: "Volatility",
      icon: "〰️",
      color: "#34d399",
      desc: "Standard deviation of recent prices. High volatility signals risk — the agent may shift to safer assets to protect the portfolio.",
    },
    {
      name: "Momentum",
      icon: "🚀",
      color: "#60a5fa",
      desc: "The ratio of short-term to long-term moving averages. Rising momentum suggests an accelerating trend worth following.",
    },
    {
      name: "Market Regime",
      icon: "🌊",
      color: "#f472b6",
      desc: "A classification of the current market environment — bull, bear, or sideways. The agent adjusts its risk appetite based on regime.",
    },
  ];

  const faqs = [
    {
      q: "Why does XAI matter in finance?",
      a: "Financial decisions affect real people. An AI that just says 'buy' or 'sell' without explanation is a black box. XAI forces the model to show its reasoning, making it auditable, trustworthy, and regulatorily compliant.",
    },
    {
      q: "How is this different from SHAP or LIME?",
      a: "SHAP and LIME use approximations to explain model behaviour. Scrooge.ai uses direct perturbation — we literally remove each signal from the input and measure how much the agent's allocation changes. No approximations, no proxies.",
    },
    {
      q: "Can XAI reveal when the AI is wrong?",
      a: "Yes. If the top driver for a decision was 'regime' during a period of low market confidence, that's a signal the agent may have been overreacting to macro conditions. XAI makes these patterns visible.",
    },
    {
      q: "Is the XAI computed in real time?",
      a: "Every single decision logged during a simulation includes a feature importance breakdown, computed at the time of the decision. Nothing is post-hoc estimated.",
    },
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
          <div className="hero-badge">Explainable AI</div>
          <h1 className="hero-title">No black boxes.<br />Every decision explained.</h1>
          <p className="hero-sub">
            Scrooge.ai uses perturbation-based Explainable AI to show exactly which market signals drove every portfolio decision — in plain English, with numbers.
          </p>
        </div>

        {/* What is XAI */}
        <div className="what-section">
          <div className="section-label">What is XAI?</div>
          <div className="what-grid">
            <div className="what-text">
              <h2 className="section-title">Making AI accountable</h2>
              <p className="body-text">
                Explainable AI (XAI) is a set of techniques that make machine learning decisions transparent and interpretable. Instead of a model simply outputting a number, XAI surfaces the reasoning behind that number.
              </p>
              <p className="body-text" style={{ marginTop: 14 }}>
                In portfolio management, this is critical. Regulators, investors, and researchers all need to understand <em>why</em> an AI allocated capital the way it did — not just <em>what</em> it decided.
              </p>
            </div>
            <div className="stat-col">
              <div className="stat-card">
                <div className="stat-num">4</div>
                <div className="stat-label">Market signals tracked per decision</div>
              </div>
              <div className="stat-card">
                <div className="stat-num">100%</div>
                <div className="stat-label">Of decisions have XAI explanations</div>
              </div>
              <div className="stat-card">
                <div className="stat-num">0</div>
                <div className="stat-label">Approximations — direct perturbation only</div>
              </div>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="method-section">
          <div className="section-label">The Method</div>
          <h2 className="section-title">Perturbation-based feature importance</h2>
          <div className="method-steps">
            <div className="method-step">
              <div className="method-num">1</div>
              <div>
                <div className="method-title">Agent makes a decision</div>
                <div className="method-desc">The RL agent receives the full market observation (returns, volatility, momentum, regime) and outputs portfolio weights.</div>
              </div>
            </div>
            <div className="method-arrow">↓</div>
            <div className="method-step">
              <div className="method-num">2</div>
              <div>
                <div className="method-title">Each signal is removed, one at a time</div>
                <div className="method-desc">We zero out one feature at a time and re-run the agent. We measure how much the output weights change compared to the original decision.</div>
              </div>
            </div>
            <div className="method-arrow">↓</div>
            <div className="method-step">
              <div className="method-num">3</div>
              <div>
                <div className="method-title">Importance is quantified</div>
                <div className="method-desc">The larger the change in portfolio weights when a signal is removed, the more important that signal was. Results are normalised to percentages.</div>
              </div>
            </div>
            <div className="method-arrow">↓</div>
            <div className="method-step">
              <div className="method-num">4</div>
              <div>
                <div className="method-title">Translated into plain English</div>
                <div className="method-desc">The top driver and its contribution percentage are displayed in the dashboard, along with a human-readable explanation of what happened and why.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="features-section">
          <div className="section-label">Market Signals</div>
          <h2 className="section-title">What the AI looks at</h2>
          <div className="features-grid">
            {features.map((f, i) => (
              <div className="feature-card" key={i} style={{ borderColor: `${f.color}22` }}>
                <div className="feature-icon">{f.icon}</div>
                <div className="feature-name" style={{ color: f.color }}>{f.name}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="faq-section">
          <div className="section-label">Common Questions</div>
          <h2 className="section-title">XAI in depth</h2>
          <div className="faq-list">
            {faqs.map((faq, i) => (
              <div className="faq-item" key={i}>
                <div className="faq-q">{faq.q}</div>
                <div className="faq-a">{faq.a}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="cta-section">
          <h2 className="cta-title">See XAI in action</h2>
          <p className="cta-sub">Run a simulation and inspect every decision your AI agent makes.</p>
          <button className="btn-primary" onClick={() => router.push("/login")} type="button">Start for free →</button>
        </div>
      </div>

      <style jsx>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .page { background: #000; font-family: -apple-system, "SF Pro Display", BlinkMacSystemFont, sans-serif; color: #fff; min-height: 100vh; overflow-x: hidden; }
        .orb { position: fixed; border-radius: 50%; filter: blur(140px); opacity: 0.15; pointer-events: none; z-index: 0; }
        .orb1 { width: 500px; height: 500px; background: radial-gradient(circle, #FFB700, #FF8C00); top: -150px; left: -100px; }
        .orb2 { width: 350px; height: 350px; background: radial-gradient(circle, #34d399, #059669); bottom: 100px; right: -80px; }

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
        .hero-sub { font-size: 16px; color: rgba(255,255,255,0.45); line-height: 1.7; max-width: 520px; margin: 0 auto; }

        .section-label { font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #FFB700; margin-bottom: 12px; }
        .section-title { font-size: 28px; font-weight: 700; letter-spacing: -0.8px; margin-bottom: 24px; }
        .body-text { font-size: 14px; color: rgba(255,255,255,0.45); line-height: 1.75; }

        .what-section { margin-bottom: 72px; }
        .what-grid { display: grid; grid-template-columns: 1fr 280px; gap: 40px; align-items: start; }
        .stat-col { display: flex; flex-direction: column; gap: 12px; }
        .stat-card { background: rgba(255,183,0,0.05); border: 0.5px solid rgba(255,183,0,0.15); border-radius: 14px; padding: 20px; text-align: center; }
        .stat-num { font-size: 32px; font-weight: 800; color: #FFB700; letter-spacing: -1px; }
        .stat-label { font-size: 11px; color: rgba(255,255,255,0.35); margin-top: 4px; line-height: 1.4; }

        .method-section { margin-bottom: 72px; }
        .method-steps { background: rgba(255,255,255,0.015); border: 0.5px solid rgba(255,255,255,0.07); border-radius: 20px; padding: 32px; }
        .method-step { display: flex; gap: 20px; align-items: flex-start; }
        .method-num { width: 32px; height: 32px; border-radius: 50%; background: rgba(255,183,0,0.15); border: 0.5px solid rgba(255,183,0,0.3); color: #FFB700; font-size: 13px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .method-title { font-size: 14px; font-weight: 600; margin-bottom: 6px; }
        .method-desc { font-size: 13px; color: rgba(255,255,255,0.4); line-height: 1.6; }
        .method-arrow { font-size: 18px; color: rgba(255,183,0,0.3); text-align: center; padding: 8px 0 8px 52px; }

        .features-section { margin-bottom: 72px; }
        .features-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
        .feature-card { background: rgba(255,255,255,0.02); border: 0.5px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 22px; transition: border-color 0.2s; }
        .feature-card:hover { border-color: rgba(255,183,0,0.2); }
        .feature-icon { font-size: 28px; margin-bottom: 12px; }
        .feature-name { font-size: 15px; font-weight: 700; margin-bottom: 8px; }
        .feature-desc { font-size: 13px; color: rgba(255,255,255,0.38); line-height: 1.65; }

        .faq-section { margin-bottom: 72px; }
        .faq-list { display: flex; flex-direction: column; gap: 0; }
        .faq-item { padding: 22px 0; border-bottom: 0.5px solid rgba(255,255,255,0.05); }
        .faq-item:last-child { border-bottom: none; }
        .faq-q { font-size: 15px; font-weight: 600; margin-bottom: 10px; }
        .faq-a { font-size: 13px; color: rgba(255,255,255,0.42); line-height: 1.7; }

        .cta-section { text-align: center; padding: 60px; background: rgba(255,183,0,0.04); border: 0.5px solid rgba(255,183,0,0.1); border-radius: 20px; }
        .cta-title { font-size: 28px; font-weight: 700; letter-spacing: -0.8px; margin-bottom: 10px; }
        .cta-sub { font-size: 14px; color: rgba(255,255,255,0.35); margin-bottom: 28px; }
        .btn-primary { background: linear-gradient(135deg, #FFB700, #FF8C00); border: none; color: #000; padding: 14px 32px; border-radius: 12px; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
        .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }

        @media (max-width: 768px) {
          .nav { padding: 16px 20px; }
          .content { padding: 100px 20px 60px; }
          .hero-title { font-size: 32px; }
          .what-grid { grid-template-columns: 1fr; }
          .features-grid { grid-template-columns: 1fr; }
          .cta-section { padding: 36px 20px; }
        }
      `}</style>
    </div>
  );
}
