import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Sidebar from "../components/Sidebar";
import { fetchMySimulations, getToken } from "../lib/api";
import { explainInPlainEnglish } from "../lib/explain";

const ASSET_COLORS = ["#FFB700", "#34d399", "#fbbf24", "#f87171", "#ec4899"];

export default function XAIInsightsPage() {
  const router = useRouter();
  const [sims, setSims] = useState([]);
  const [loading, setLoading] = useState(true);
  const trendChartRef = useRef(null);
  const trendCanvasRef = useRef(null);

  useEffect(() => {
    if (!getToken()) { router.replace("/login"); return; }
    fetchMySimulations().then((data) => {
      if (data?.error === "unauthenticated") { router.replace("/login"); return; }
      if (Array.isArray(data)) setSims(data);
      setLoading(false);
    });
  }, []);

  // Aggregate feature importance across all simulations
  const aggregated = (() => {
    const totals = {};
    let count = 0;
    sims.forEach((s) => {
      (s.decisions || []).forEach((d) => {
        if (!d.feature_importance) return;
        Object.entries(d.feature_importance).forEach(([k, v]) => { totals[k] = (totals[k] || 0) + v; });
        count++;
      });
    });
    if (!count) return [];
    const sum = Object.values(totals).reduce((a, b) => a + b, 0);
    return Object.entries(totals)
      .map(([k, v]) => ({ name: k, pct: Math.round((v / sum) * 100) }))
      .sort((a, b) => b.pct - a.pct);
  })();

  // Per-simulation top feature
  const simTopFeatures = sims.map((s) => {
    const totals = {};
    (s.decisions || []).forEach((d) => {
      if (!d.feature_importance) return;
      Object.entries(d.feature_importance).forEach(([k, v]) => { totals[k] = (totals[k] || 0) + v; });
    });
    const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    return { date: s.created_at?.slice(0, 10), topFeature: sorted[0]?.[0] || "—", return: s.total_return_pct };
  });

  // Trend chart: feature importance per simulation over time
  useEffect(() => {
    if (sims.length < 2 || !trendCanvasRef.current) return;
    let active = true;
    import("chart.js/auto").then(({ default: Chart }) => {
      if (!active || !trendCanvasRef.current) return;
      if (trendChartRef.current) trendChartRef.current.destroy();

      const features = aggregated.map((f) => f.name);
      const labels = [...sims].reverse().map((s, i) => `Sim ${i + 1}`);

      const datasets = features.map((feat, fi) => ({
        label: feat.charAt(0).toUpperCase() + feat.slice(1),
        data: [...sims].reverse().map((s) => {
          const totals = {};
          let count = 0;
          (s.decisions || []).forEach((d) => {
            if (!d.feature_importance) return;
            Object.entries(d.feature_importance).forEach(([k, v]) => { totals[k] = (totals[k] || 0) + v; });
            count++;
          });
          const sum = Object.values(totals).reduce((a, b) => a + b, 0);
          return sum > 0 ? Math.round(((totals[feat] || 0) / sum) * 100) : 0;
        }),
        borderColor: ASSET_COLORS[fi],
        backgroundColor: "transparent",
        borderWidth: 2,
        pointRadius: 4,
        tension: 0.4,
      }));

      trendChartRef.current = new Chart(trendCanvasRef.current, {
        type: "line",
        data: { labels, datasets },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: true, labels: { color: "rgba(255,255,255,0.4)", boxWidth: 10, font: { size: 11 } } } },
          scales: {
            x: { ticks: { color: "rgba(255,255,255,0.3)", font: { size: 11 } }, grid: { color: "rgba(255,255,255,0.03)" } },
            y: { min: 0, max: 100, ticks: { color: "rgba(255,255,255,0.3)", font: { size: 11 }, callback: (v) => `${v}%` }, grid: { color: "rgba(255,255,255,0.03)" } },
          },
        },
      });
    });
    return () => { active = false; if (trendChartRef.current) trendChartRef.current.destroy(); };
  }, [sims]);

  const topFeature = aggregated[0];

  return (
    <div className="page">
      <div className="orb orb1" /><div className="orb orb2" />
      <div className="disclaimer">⚠ Simulation only — no real investments are made.</div>
      <div className="app">
        <Sidebar active="XAI Insights" />
        <div className="main">
          <div className="page-title">XAI Insights</div>
          <div className="page-sub">What drives every decision your AI agent makes</div>

          {loading && <div className="loading"><div className="spinner" /></div>}

          {!loading && sims.length === 0 && (
            <div className="empty">
              <div className="empty-icon">🔍</div>
              <div className="empty-title">No data yet</div>
              <div className="empty-sub">Run a simulation to see what drives the AI&apos;s decisions.</div>
              <button className="btn-primary" onClick={() => router.push("/simulate")} type="button">Run a Simulation →</button>
            </div>
          )}

          {!loading && sims.length > 0 && (
            <>
              {/* Top insight banner */}
              {topFeature && (
                <div className="insight-banner">
                  <div className="banner-icon">💡</div>
                  <div>
                    <div className="banner-title">In plain English</div>
                    <div className="banner-sub">
                      {explainInPlainEnglish(
                        aggregated,
                        sims[0]?.metrics,
                        sims.length === 1 ? sims[0]?.total_return_pct : null
                      ) || `Across ${sims.length} simulation${sims.length > 1 ? "s" : ""}, ${topFeature.name} was the most influential signal.`}
                    </div>
                  </div>
                </div>
              )}

              <div className="row-2col">
                {/* Aggregate importance */}
                <div className="card">
                  <div className="card-title">Aggregate Feature Importance</div>
                  <div className="card-sub">Averaged across all simulations and decisions</div>
                  {aggregated.map((feat, i) => (
                    <div className="imp-row" key={feat.name}>
                      <div className="imp-label">{feat.name.charAt(0).toUpperCase() + feat.name.slice(1)}</div>
                      <div className="imp-bar-bg"><div className="imp-bar" style={{ width: `${feat.pct}%`, background: ASSET_COLORS[i] }} /></div>
                      <div className="imp-pct" style={{ color: ASSET_COLORS[i] }}>{feat.pct}%</div>
                    </div>
                  ))}
                </div>

                {/* Per-simulation top driver table */}
                <div className="card">
                  <div className="card-title">Top Driver Per Simulation</div>
                  <div className="card-sub">What dominated each run</div>
                  <table className="driver-table">
                    <thead><tr><th>Sim</th><th>Date</th><th>Top Driver</th><th>Return</th></tr></thead>
                    <tbody>
                      {simTopFeatures.map((s, i) => (
                        <tr key={i}>
                          <td className="muted">#{simTopFeatures.length - i}</td>
                          <td className="date-cell">{s.date}</td>
                          <td><span className="driver-badge">{s.topFeature}</span></td>
                          <td className={s.return >= 0 ? "green" : "red"}>{s.return >= 0 ? "+" : ""}{s.return?.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Trend chart (only shown with 2+ sims) */}
              {sims.length >= 2 && (
                <div className="card trend-card">
                  <div className="card-title">Feature Importance Trend</div>
                  <div className="card-sub">How each feature&apos;s influence has shifted across simulations</div>
                  <div className="chart-area"><canvas ref={trendCanvasRef} /></div>
                </div>
              )}

              {/* Explanation */}
              <div className="card explanation-card">
                <div className="card-title">How XAI Works</div>
                <div className="card-sub">Perturbation-based feature importance</div>
                <div className="explanation-text">
                  For each decision, Scrooge.ai measures how much the AI&apos;s portfolio weights change when each market signal is removed (zeroed out). A large change means that signal was critical — a small change means it barely mattered. This is done without any proxy math or approximations: we directly measure the agent&apos;s sensitivity to each input.
                </div>
                <div className="feature-glossary">
                  {aggregated.map((feat, i) => (
                    <div className="glossary-row" key={feat.name}>
                      <div className="glossary-dot" style={{ background: ASSET_COLORS[i] }} />
                      <div>
                        <div className="glossary-name">{feat.name.charAt(0).toUpperCase() + feat.name.slice(1)}</div>
                        <div className="glossary-desc">
                          {feat.name === "returns" && "Recent daily returns — how each asset performed lately"}
                          {feat.name === "volatility" && "Standard deviation — how stable or erratic each asset has been"}
                          {feat.name === "momentum" && "Moving average ratio — whether the trend is accelerating or decelerating"}
                          {feat.name === "regime" && "Market regime indicator — bull, bear, or sideways market context"}
                          {!["returns","volatility","momentum","regime"].includes(feat.name) && "Market signal used by the agent to make allocation decisions"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .page { background: #000; font-family: -apple-system, 'SF Pro Display', BlinkMacSystemFont, sans-serif; color: #fff; min-height: 100vh; }
        .orb { position: fixed; border-radius: 50%; filter: blur(120px); opacity: 0.2; pointer-events: none; }
        .orb1 { width: 450px; height: 450px; background: radial-gradient(circle, #FFB700, #FF8C00); top: -100px; right: 0; }
        .orb2 { width: 300px; height: 300px; background: radial-gradient(circle, #34d399, #059669); bottom: 0; left: 0; }
        .disclaimer { background: rgba(251,191,36,0.07); border-bottom: 0.5px solid rgba(251,191,36,0.12); padding: 9px 24px; font-size: 12px; color: rgba(251,191,36,0.7); position: relative; z-index: 10; }
        .app { display: flex; position: relative; z-index: 10; min-height: calc(100vh - 37px); }
        .main { flex: 1; padding: 28px 32px; overflow: auto; }
        .page-title { font-size: 22px; font-weight: 700; letter-spacing: -0.8px; margin-bottom: 4px; }
        .page-sub { font-size: 13px; color: rgba(255,255,255,0.35); margin-bottom: 24px; }
        .loading { display: flex; justify-content: center; padding: 80px; }
        .spinner { width: 40px; height: 40px; border: 2px solid rgba(255,183,0,0.2); border-top-color: #FFB700; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .empty { text-align: center; padding: 80px 24px; }
        .empty-icon { font-size: 48px; margin-bottom: 16px; }
        .empty-title { font-size: 18px; font-weight: 600; margin-bottom: 8px; }
        .empty-sub { font-size: 14px; color: rgba(255,255,255,0.35); margin-bottom: 24px; }
        .btn-primary { background: linear-gradient(135deg, #FFB700, #FF8C00); border: none; color: #fff; padding: 12px 28px; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; }
        .insight-banner { background: rgba(255,183,0,0.07); border: 0.5px solid rgba(255,183,0,0.2); border-radius: 14px; padding: 18px 20px; margin-bottom: 16px; display: flex; align-items: flex-start; gap: 14px; }
        .banner-icon { font-size: 28px; flex-shrink: 0; }
        .banner-title { font-size: 14px; font-weight: 600; margin-bottom: 6px; }
        .highlight-text { color: #FFD166; }
        .banner-sub { font-size: 13px; color: rgba(255,255,255,0.45); line-height: 1.6; }
        .banner-sub strong { color: #FFD166; }
        .row-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
        .card { background: rgba(255,255,255,0.02); border: 0.5px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 18px; margin-bottom: 12px; }
        .card-title { font-size: 13px; font-weight: 600; margin-bottom: 3px; }
        .card-sub { font-size: 11px; color: rgba(255,255,255,0.3); margin-bottom: 16px; }
        .imp-row { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; font-size: 13px; }
        .imp-label { width: 80px; color: rgba(255,255,255,0.5); }
        .imp-bar-bg { flex: 1; height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; }
        .imp-bar { height: 6px; border-radius: 3px; transition: width 0.6s ease; }
        .imp-pct { width: 36px; text-align: right; font-weight: 600; font-size: 12px; }
        .driver-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .driver-table th { text-align: left; padding: 6px 10px; font-size: 10px; color: rgba(255,255,255,0.25); text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 0.5px solid rgba(255,255,255,0.06); }
        .driver-table td { padding: 9px 10px; border-bottom: 0.5px solid rgba(255,255,255,0.04); }
        .driver-table tr:last-child td { border-bottom: none; }
        .muted { color: rgba(255,255,255,0.2); }
        .date-cell { color: rgba(255,255,255,0.4); white-space: nowrap; }
        .driver-badge { background: rgba(255,183,0,0.12); color: #FFD166; padding: 3px 9px; border-radius: 6px; font-size: 11px; white-space: nowrap; }
        .green { color: #34d399; } .red { color: #f87171; }
        .trend-card { margin-bottom: 12px; }
        .chart-area { position: relative; height: 200px; }
        .explanation-text { font-size: 13px; color: rgba(255,255,255,0.5); line-height: 1.7; margin-bottom: 20px; background: rgba(255,183,0,0.05); border: 0.5px solid rgba(255,183,0,0.12); padding: 14px; border-radius: 10px; }
        .feature-glossary { display: flex; flex-direction: column; gap: 12px; }
        .glossary-row { display: flex; gap: 12px; align-items: flex-start; }
        .glossary-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 5px; }
        .glossary-name { font-size: 13px; font-weight: 500; margin-bottom: 2px; }
        .glossary-desc { font-size: 12px; color: rgba(255,255,255,0.35); }
        @media (max-width: 768px) {
          .row-2col { grid-template-columns: 1fr; }
          .main { padding: 16px; }
          .insight-banner { flex-direction: column; gap: 12px; }
          .banner-icon { font-size: 24px; }
        }
        @media (max-width: 480px) {
          .main { padding: 12px; }
          .page-title { font-size: 18px; }
          .insight-banner { padding: 12px 14px; }
          .banner-icon { font-size: 20px; }
          .card { padding: 14px; }
          .driver-table { font-size: 11px; }
          .driver-table th { padding: 5px 8px; font-size: 9px; }
          .driver-table td { padding: 7px 8px; }
        }
        @media (max-width: 900px) {
          .app { flex-direction: column; }
          .main { padding: 20px; }
          .row-2col { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
