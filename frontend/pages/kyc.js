import { useState } from "react";
import { useRouter } from "next/router";

const API = "http://localhost:8000";

export default function KycPage() {
  const [step, setStep] = useState(2);
  const router = useRouter();

  // Step 3: Risk profile
  const [riskProfile, setRiskProfile] = useState("");

  // Step 4: Investment goal
  const [investmentGoal, setInvestmentGoal] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleComplete = async () => {
    setError("");

    // Read registration data stored by login.js
    let reg;
    try {
      reg = JSON.parse(sessionStorage.getItem("reg") || "null");
    } catch {
      reg = null;
    }

    if (!reg) {
      router.push("/login");
      return;
    }

    if (!riskProfile) {
      setError("Please select a risk profile in Step 3");
      setStep(3);
      return;
    }

    const goal = investmentGoal.trim() || "General wealth creation";

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: reg.name,
          email: reg.email,
          password: reg.password,
          risk_profile: riskProfile.toLowerCase(),
          investment_goal: goal,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Registration failed");
        return;
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      sessionStorage.removeItem("reg");
      router.push("/dashboard");
    } catch {
      setError("Network error. Is the server running?");
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    setError("");
    if (step === 3 && !riskProfile) {
      setError("Please select a risk profile to continue");
      return;
    }
    setStep((s) => s + 1);
  };

  return (
    <div className="page">
      <div className="card">
        <div className="progress">
          <div style={{ width: `${(step / 4) * 100}%` }} />
        </div>

        <div className="step-label">Step {step} of 4</div>

        {error && <div className="error-msg">{error}</div>}

        {step === 2 && (
          <section>
            <h2>Personal Profile</h2>
            <p className="step-desc">Tell us a bit about yourself</p>
            <div className="grid">
              <input placeholder="Full Name" />
              <input placeholder="Age" type="number" />
              <input placeholder="Occupation" />
              <input placeholder="Monthly Income (₹)" />
              <input placeholder="PAN Number" />
              <input placeholder="Phone Number" />
            </div>
          </section>
        )}

        {step === 3 && (
          <section>
            <h2>Risk Profile</h2>
            <p className="step-desc">How would you describe your risk appetite?</p>
            <div className="chips">
              {["Conservative", "Moderate", "Aggressive"].map((r) => (
                <button
                  key={r}
                  className={`chip ${riskProfile === r ? "chip-active" : ""}`}
                  onClick={() => setRiskProfile(r)}
                  type="button"
                >
                  {r === "Conservative" && "🛡️ "}
                  {r === "Moderate" && "⚖️ "}
                  {r === "Aggressive" && "🚀 "}
                  {r}
                </button>
              ))}
            </div>
            <div className="field">
              <label>Investment Experience</label>
              <input placeholder="e.g. 3 years in mutual funds" />
            </div>
            <div className="field">
              <label>Reaction to a 10% portfolio drop</label>
              <input placeholder="e.g. I would hold and wait for recovery" />
            </div>
          </section>
        )}

        {step === 4 && (
          <section>
            <h2>Investment Goals</h2>
            <p className="step-desc">What are you investing for?</p>
            <div className="grid">
              <div className="field">
                <label>Goal</label>
                <input
                  placeholder="e.g. Retirement, House, Education"
                  value={investmentGoal}
                  onChange={(e) => setInvestmentGoal(e.target.value)}
                />
              </div>
              <div className="field">
                <label>Target Amount (₹)</label>
                <input
                  placeholder="e.g. 50,00,000"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                />
              </div>
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label>Target Date</label>
                <input
                  type="month"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                />
              </div>
            </div>
          </section>
        )}

        <div className="actions">
          <button
            className="btn-back"
            onClick={() => (step === 2 ? router.push("/login") : setStep((s) => s - 1))}
            type="button"
          >
            ← Back
          </button>
          {step < 4 ? (
            <button className="btn-primary" onClick={handleContinue} type="button">
              Continue →
            </button>
          ) : (
            <button
              className="btn-primary"
              onClick={handleComplete}
              type="button"
              disabled={loading}
            >
              {loading ? "Setting up your account…" : "Complete Setup →"}
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: #000;
          color: #fff;
          padding: 28px;
          display: grid;
          place-items: center;
          font-family: -apple-system, "SF Pro Display", BlinkMacSystemFont, sans-serif;
        }
        .card {
          width: min(760px, 100%);
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 32px;
        }
        .progress {
          height: 4px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 999px;
          margin-bottom: 8px;
          overflow: hidden;
        }
        .progress > div {
          height: 100%;
          background: linear-gradient(90deg, #6366f1, #34d399);
          border-radius: 999px;
          transition: width 0.4s ease;
        }
        .step-label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.3);
          margin-bottom: 28px;
          letter-spacing: 0.05em;
        }
        h2 {
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -0.5px;
          margin-bottom: 4px;
        }
        .step-desc {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.4);
          margin-bottom: 20px;
        }
        .error-msg {
          background: rgba(239, 68, 68, 0.1);
          border: 0.5px solid rgba(239, 68, 68, 0.3);
          color: #f87171;
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 13px;
          margin-bottom: 20px;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 8px;
        }
        .field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
        .field label {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.35);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        input {
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
          border: 0.5px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px;
          padding: 13px 14px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
          width: 100%;
        }
        input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }
        input::placeholder { color: rgba(255, 255, 255, 0.2); }
        .chips {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }
        .chip {
          padding: 12px 20px;
          border-radius: 12px;
          border: 0.5px solid rgba(255, 255, 255, 0.15);
          background: rgba(255, 255, 255, 0.04);
          color: rgba(255, 255, 255, 0.6);
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .chip:hover {
          border-color: rgba(99, 102, 241, 0.5);
          color: #fff;
        }
        .chip-active {
          background: rgba(99, 102, 241, 0.15);
          border-color: #6366f1;
          color: #fff;
          box-shadow: 0 0 16px rgba(99, 102, 241, 0.2);
        }
        .actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 28px;
          padding-top: 20px;
          border-top: 0.5px solid rgba(255, 255, 255, 0.06);
        }
        .btn-back {
          padding: 11px 20px;
          border-radius: 12px;
          border: 0.5px solid rgba(255, 255, 255, 0.15);
          background: transparent;
          color: rgba(255, 255, 255, 0.5);
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-back:hover { color: #fff; border-color: rgba(255, 255, 255, 0.3); }
        .btn-primary {
          padding: 11px 24px;
          border-radius: 12px;
          border: none;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 0 20px rgba(99, 102, 241, 0.3);
          transition: all 0.2s;
        }
        .btn-primary:hover { box-shadow: 0 0 30px rgba(99, 102, 241, 0.5); transform: translateY(-1px); }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        @media (max-width: 768px) {
          .grid { grid-template-columns: 1fr; }
          .card { padding: 24px; width: 100%; }
          .page { padding: 16px; }
          .actions { flex-direction: column-reverse; gap: 8px; }
          .btn-back, .btn-primary { width: 100%; }
          h2 { font-size: 20px; }
        }
        @media (max-width: 480px) {
          .grid { grid-template-columns: 1fr; }
          .chips { gap: 8px; }
          .chip { padding: 10px 14px; font-size: 13px; }
          .card { padding: 16px; border-radius: 16px; }
          .page { padding: 12px; }
          .step-label { margin-bottom: 20px; }
          h2 { font-size: 18px; margin-bottom: 2px; }
          .step-desc { font-size: 13px; margin-bottom: 16px; }
          .field { margin-bottom: 10px; }
          input { padding: 11px 12px; font-size: 13px; }
          .actions { margin-top: 20px; padding-top: 16px; gap: 8px; }
          .btn-back, .btn-primary { padding: 10px 16px; font-size: 13px; }
        }
        @media (max-width: 700px) {
          .grid { grid-template-columns: 1fr; }
          .chips { flex-direction: column; }
          .chip { width: 100%; }
        }
      `}</style>
    </div>
  );
}
