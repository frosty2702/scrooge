import { useState } from "react";
import { useRouter } from "next/router";

export default function KycPage() {
  const [step, setStep] = useState(2);
  const router = useRouter();

  return (
    <div className="page">
      <div className="card">
        <div className="progress"><div style={{ width: `${(step / 4) * 100}%` }} /></div>
        {step === 2 && (
          <section>
            <h2>Step 2: Personal Profile</h2>
            <div className="grid">
              <input placeholder="Full Name" />
              <input placeholder="Age" type="number" />
              <input placeholder="Occupation" />
              <input placeholder="Monthly Income" />
              <input placeholder="PAN Number" />
              <input placeholder="Phone Number" />
            </div>
          </section>
        )}
        {step === 3 && (
          <section>
            <h2>Step 3: Risk Profile</h2>
            <div className="chips">
              <button>Conservative</button><button>Moderate</button><button>Aggressive</button>
            </div>
            <input placeholder="Investment Experience" />
            <input placeholder="Reaction to 10% portfolio drop" />
          </section>
        )}
        {step === 4 && (
          <section>
            <h2>Step 4: Investment Goals</h2>
            <div className="grid">
              <input placeholder="Goal" />
              <input placeholder="Target Amount" />
              <input type="month" />
            </div>
          </section>
        )}
        <div className="actions">
          <button onClick={() => (step === 2 ? router.push("/login") : setStep((s) => s - 1))}>Back</button>
          {step < 4 ? (
            <button className="primary" onClick={() => setStep((s) => s + 1)}>Continue</button>
          ) : (
            <button className="primary" onClick={() => router.push("/dashboard")}>Complete KYC</button>
          )}
        </div>
      </div>
      <style jsx>{`
        .page { min-height: 100vh; background: #000; color: #fff; padding: 28px; display: grid; place-items: center; }
        .card { width: min(760px, 100%); background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 24px; }
        .progress { height: 6px; background: rgba(255,255,255,0.1); border-radius: 999px; margin-bottom: 20px; overflow: hidden; }
        .progress > div { height: 100%; background: linear-gradient(90deg,#6366f1,#34d399); }
        h2 { margin-bottom: 12px; font-size: 22px; }
        .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
        .chips { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 10px; }
        input, .chips button { background: rgba(255,255,255,0.06); color: #fff; border: 1px solid rgba(255,255,255,0.16); border-radius: 10px; padding: 11px; width: 100%; }
        .actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 16px; }
        button { padding: 10px 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.2); background: transparent; color: #fff; }
        .primary { border: 0; background: linear-gradient(135deg,#6366f1,#8b5cf6); }
        @media (max-width: 700px) { .grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
