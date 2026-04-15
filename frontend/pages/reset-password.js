import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { token } = router.query;

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleReset = async () => {
    setError("");
    if (!newPassword || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Reset failed");
        setLoading(false);
        return;
      }
      setSuccess(true);
    } catch {
      setError("Network error. Is the server running?");
    }
    setLoading(false);
  };

  return (
    <div className="page">
      <div className="grid-bg" />
      <div className="orb orb1" />
      <div className="orb orb2" />

      <nav className="nav">
        <div className="logo">
          <div className="logo-mark">S</div>
          <div className="logo-name">
            Scrooge<span>.</span>ai
          </div>
        </div>
        <Link className="back-btn" href="/login">
          ← Back to login
        </Link>
      </nav>

      <div className="main">
        <div className="card">
          <div className="card-title">Reset Password</div>
          <div className="card-sub">Enter your new password below</div>

          {!success ? (
            <>
              {error && <div className="error-msg">{error}</div>}

              <div className="field">
                <label>New Password</label>
                <input
                  type="password"
                  placeholder="Min. 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleReset()}
                />
              </div>

              <div className="field">
                <label>Confirm Password</label>
                <input
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleReset()}
                />
              </div>

              <button className="submit-btn" onClick={handleReset} type="button" disabled={loading}>
                {loading ? "Resetting…" : "Reset Password"}
              </button>
            </>
          ) : (
            <>
              <div className="success-msg">Password reset successfully!</div>
              <div className="success-sub">You can now log in with your new password.</div>
              <button className="submit-btn" onClick={() => router.push("/login")} type="button">
                Go to Login →
              </button>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        .page {
          background: #000;
          font-family: -apple-system, "SF Pro Display", BlinkMacSystemFont, sans-serif;
          color: #fff;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
        }
        .orb {
          position: fixed;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.3;
          pointer-events: none;
          z-index: 0;
        }
        .orb1 {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, #6366f1, #4f46e5);
          top: -150px;
          right: -100px;
          animation: float1 8s ease-in-out infinite;
        }
        .orb2 {
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, #34d399, #059669);
          bottom: -50px;
          left: -50px;
          animation: float2 10s ease-in-out infinite;
        }
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-20px, 20px); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(15px, -15px); }
        }
        .grid-bg {
          position: fixed;
          inset: 0;
          background-image: linear-gradient(rgba(99, 102, 241, 0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.06) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
          z-index: 0;
        }
        .nav {
          position: relative;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 48px;
        }
        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }
        .logo-mark {
          width: 34px;
          height: 34px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          font-weight: 700;
          box-shadow: 0 0 20px rgba(99, 102, 241, 0.4);
        }
        .logo-name {
          font-size: 17px;
          font-weight: 700;
          letter-spacing: -0.5px;
        }
        .logo-name span { color: #6366f1; }
        .back-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 0.5px solid rgba(255, 255, 255, 0.12);
          color: rgba(255, 255, 255, 0.6);
          padding: 8px 18px;
          border-radius: 8px;
          font-size: 13px;
          cursor: pointer;
          text-decoration: none;
        }
        .main {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 10;
          padding: 20px;
        }
        .card {
          background: rgba(15, 15, 15, 0.8);
          border: 0.5px solid rgba(255, 255, 255, 0.12);
          border-radius: 20px;
          padding: 48px;
          width: 100%;
          max-width: 440px;
          backdrop-filter: blur(10px);
        }
        .card-title {
          font-size: 26px;
          font-weight: 700;
          letter-spacing: -1px;
          margin-bottom: 8px;
        }
        .card-sub {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.4);
          margin-bottom: 28px;
        }
        .error-msg {
          background: rgba(239, 68, 68, 0.1);
          border: 0.5px solid rgba(239, 68, 68, 0.3);
          color: #f87171;
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 13px;
          margin-bottom: 20px;
        }
        .success-msg {
          background: rgba(52, 211, 153, 0.1);
          border: 0.5px solid rgba(52, 211, 153, 0.3);
          color: #6ee7b7;
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 12px;
        }
        .success-sub {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.4);
          margin-bottom: 24px;
        }
        .field {
          margin-bottom: 18px;
        }
        .field label {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
          display: block;
          margin-bottom: 7px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .field input {
          width: 100%;
          background: rgba(255, 255, 255, 0.04);
          border: 0.5px solid rgba(255, 255, 255, 0.1);
          border-radius: 11px;
          padding: 13px 16px;
          font-size: 14px;
          color: #fff;
          outline: none;
          transition: border-color 0.2s;
        }
        .field input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }
        .field input::placeholder {
          color: rgba(255, 255, 255, 0.2);
        }
        .submit-btn {
          width: 100%;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border: none;
          color: #fff;
          padding: 14px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 8px;
          box-shadow: 0 0 30px rgba(99, 102, 241, 0.35);
          transition: all 0.3s;
          position: relative;
          overflow: hidden;
        }
        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        .submit-btn::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), transparent);
        }
        .submit-btn:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 0 50px rgba(99, 102, 241, 0.55);
        }

        @media (max-width: 900px) {
          .nav {
            padding: 16px 20px;
          }
          .card {
            padding: 36px 24px;
          }
          .card-title {
            font-size: 22px;
          }
        }
      `}</style>
    </div>
  );
}
