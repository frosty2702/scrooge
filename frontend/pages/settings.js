import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Sidebar from "../components/Sidebar";
import { fetchMe, updateMe, getToken } from "../lib/api";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [riskProfile, setRiskProfile] = useState("");
  const [investmentGoal, setInvestmentGoal] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getToken()) { router.replace("/login"); return; }
    fetchMe().then((data) => {
      if (data?.error === "unauthenticated") { router.replace("/login"); return; }
      if (!data?.error) {
        setUser(data);
        setName(data.name || "");
        setRiskProfile(data.risk_profile || "");
        setInvestmentGoal(data.investment_goal || "");
      }
    });
  }, []);

  const handleSave = async () => {
    setError("");
    setSaving(true);
    setSaved(false);
    const data = await updateMe({ name, risk_profile: riskProfile, investment_goal: investmentGoal });
    setSaving(false);
    if (data?.error) { setError("Failed to save. Please try again."); return; }
    // Update localStorage so sidebar name updates
    const stored = JSON.parse(localStorage.getItem("user") || "{}");
    localStorage.setItem("user", JSON.stringify({ ...stored, name: data.name, risk_profile: data.risk_profile, investment_goal: data.investment_goal }));
    setUser(data);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }) : "—";

  return (
    <div className="page">
      <div className="orb orb1" /><div className="orb orb2" />
      <div className="disclaimer">⚠ Simulation only — no real investments are made.</div>
      <div className="app">
        <Sidebar active="Settings" />
        <div className="main">
          <div className="page-title">Settings</div>
          <div className="page-sub">Manage your account and investment preferences</div>

          <div className="sections">
            {/* Profile */}
            <div className="section-card">
              <div className="section-title">Profile</div>
              <div className="field">
                <label>Full Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              </div>
              <div className="field">
                <label>Email Address</label>
                <input value={user?.email || ""} disabled className="disabled" />
                <div className="field-hint">Email cannot be changed</div>
              </div>
              <div className="field">
                <label>Member Since</label>
                <input value={memberSince} disabled className="disabled" />
              </div>
            </div>

            {/* Investment preferences */}
            <div className="section-card">
              <div className="section-title">Investment Preferences</div>
              <div className="field">
                <label>Risk Profile</label>
                <div className="chips">
                  {["conservative", "moderate", "aggressive"].map((r) => (
                    <button key={r} type="button"
                      className={`chip ${riskProfile === r ? "chip-active" : ""}`}
                      onClick={() => setRiskProfile(r)}>
                      {r === "conservative" && "🛡️ "}
                      {r === "moderate" && "⚖️ "}
                      {r === "aggressive" && "🚀 "}
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="field">
                <label>Investment Goal</label>
                <input value={investmentGoal} onChange={(e) => setInvestmentGoal(e.target.value)}
                  placeholder="e.g. Retirement, House, Education" />
              </div>
            </div>

            {/* Account info */}
            <div className="section-card">
              <div className="section-title">Account</div>
              <div className="info-row"><span>User ID</span><span className="muted">#{user?.id}</span></div>
              <div className="info-row"><span>Account status</span><span className="green">Active</span></div>
              <div className="info-row"><span>Data storage</span><span className="muted">SQLite (local)</span></div>
            </div>
          </div>

          {error && <div className="error-msg">{error}</div>}
          {saved && <div className="success-msg">✓ Changes saved successfully</div>}

          <div className="actions">
            <button className="btn-primary" onClick={handleSave} disabled={saving} type="button">
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .page { background: #000; font-family: -apple-system, 'SF Pro Display', BlinkMacSystemFont, sans-serif; color: #fff; min-height: 100vh; }
        .orb { position: fixed; border-radius: 50%; filter: blur(120px); opacity: 0.2; pointer-events: none; }
        .orb1 { width: 450px; height: 450px; background: radial-gradient(circle, #FFB700, #FF8C00); top: -100px; right: -100px; }
        .orb2 { width: 300px; height: 300px; background: radial-gradient(circle, #34d399, #059669); bottom: 0; left: 0; }
        .disclaimer { background: rgba(251,191,36,0.07); border-bottom: 0.5px solid rgba(251,191,36,0.12); padding: 9px 24px; font-size: 12px; color: rgba(251,191,36,0.7); position: relative; z-index: 10; }
        .app { display: flex; position: relative; z-index: 10; min-height: calc(100vh - 37px); }
        .main { flex: 1; padding: 28px 32px; overflow: auto; }
        .page-title { font-size: 22px; font-weight: 700; letter-spacing: -0.8px; margin-bottom: 4px; }
        .page-sub { font-size: 13px; color: rgba(255,255,255,0.35); margin-bottom: 28px; }
        .sections { display: flex; flex-direction: column; gap: 16px; max-width: 640px; }
        .section-card { background: rgba(255,255,255,0.02); border: 0.5px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 22px; }
        .section-title { font-size: 14px; font-weight: 600; margin-bottom: 20px; color: #fff; }
        .field { margin-bottom: 16px; }
        .field label { font-size: 11px; color: rgba(255,255,255,0.35); display: block; margin-bottom: 7px; text-transform: uppercase; letter-spacing: 0.06em; }
        .field-hint { font-size: 11px; color: rgba(255,255,255,0.2); margin-top: 5px; }
        input { width: 100%; background: rgba(255,255,255,0.04); border: 0.5px solid rgba(255,255,255,0.1); border-radius: 11px; padding: 12px 14px; font-size: 14px; color: #fff; outline: none; transition: border-color 0.2s; }
        input:focus { border-color: #FFB700; box-shadow: 0 0 0 3px rgba(255,183,0,0.1); }
        input::placeholder { color: rgba(255,255,255,0.2); }
        .disabled { opacity: 0.4; cursor: not-allowed; }
        .chips { display: flex; gap: 10px; flex-wrap: wrap; }
        .chip { padding: 10px 18px; border-radius: 10px; border: 0.5px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.5); font-size: 13px; cursor: pointer; transition: all 0.2s; }
        .chip:hover { border-color: rgba(255,183,0,0.4); color: #fff; }
        .chip-active { background: rgba(255,183,0,0.12); border-color: #FFB700; color: #fff; }
        .info-row { display: flex; justify-content: space-between; font-size: 13px; padding: 10px 0; border-bottom: 0.5px solid rgba(255,255,255,0.04); }
        .info-row:last-child { border-bottom: none; }
        .info-row span:first-child { color: rgba(255,255,255,0.4); }
        .muted { color: rgba(255,255,255,0.3); }
        .green { color: #34d399; }
        .error-msg { background: rgba(239,68,68,0.08); border: 0.5px solid rgba(239,68,68,0.2); color: #f87171; padding: 12px 16px; border-radius: 10px; font-size: 13px; margin-top: 16px; max-width: 640px; }
        .success-msg { background: rgba(52,211,153,0.08); border: 0.5px solid rgba(52,211,153,0.2); color: #34d399; padding: 12px 16px; border-radius: 10px; font-size: 13px; margin-top: 16px; max-width: 640px; }
        .actions { margin-top: 20px; max-width: 640px; display: flex; justify-content: flex-end; }
        .btn-primary { background: linear-gradient(135deg, #FFB700, #FF8C00); border: none; color: #fff; padding: 12px 32px; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-primary:not(:disabled):hover { box-shadow: 0 0 30px rgba(255,183,0,0.4); transform: translateY(-1px); }
        @media (max-width: 768px) {
          .main { padding: 16px; }
          .sections { max-width: 100%; }
          .section-card { padding: 16px; }
          .chips { gap: 8px; }
          .chip { padding: 8px 14px; font-size: 12px; }
        }
        @media (max-width: 480px) {
          .main { padding: 12px; }
          .page-title { font-size: 18px; }
          .section-card { padding: 14px; }
          .field { margin-bottom: 12px; }
          .chips { flex-wrap: wrap; }
          .chip { width: 100%; text-align: center; }
          .actions { justify-content: center; margin-top: 16px; }
          .btn-primary { width: 100%; }
          .error-msg, .success-msg { max-width: 100%; }
        }
        @media (max-width: 900px) {
          .app { flex-direction: column; }
          .main { padding: 20px; }
        }
      `}</style>
    </div>
  );
}
