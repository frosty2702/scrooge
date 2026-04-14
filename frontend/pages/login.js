import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

export default function LoginPage() {
  const [tab, setTab] = useState("login");
  const router = useRouter();

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
        <Link className="back-btn" href="/">
          ← Back to home
        </Link>
      </nav>

      <div className="main">
        <div className="left">
          <div className="left-title">
            Intelligent investing,
            <br />
            <span className="grad">powered by AI.</span>
          </div>
          <div className="left-sub">
            Join thousands simulating institutional-grade portfolio management.
            Our PPO agent has made 4,466 decisions across 17 years of market
            data.
          </div>
          <div className="stat-list">
            <div className="stat-item">
              <div className="stat-icon" style={{ background: "rgba(99,102,241,0.1)" }}>
                🤖
              </div>
              <div className="stat-text">
                <strong>Custom Dirichlet Policy</strong>
                Novel PPO architecture for valid portfolio weights
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon" style={{ background: "rgba(52,211,153,0.1)" }}>
                🔍
              </div>
              <div className="stat-text">
                <strong>Full XAI Transparency</strong>
                Every decision explained in plain English
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon" style={{ background: "rgba(251,191,36,0.1)" }}>
                📊
              </div>
              <div className="stat-text">
                <strong>280% Historical Return</strong>
                Outperforming mean-variance by 2.3x over 17 years
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-icon" style={{ background: "rgba(139,92,246,0.1)" }}>
                🌍
              </div>
              <div className="stat-text">
                <strong>SDG 10 — Reduced Inequalities</strong>
                Democratizing institutional AI for everyone
              </div>
            </div>
          </div>
        </div>

        <div className="right">
          <div className="form-title">
            {tab === "login" ? "Welcome back" : "Create account"}
          </div>
          <div className="form-sub">
            {tab === "login"
              ? "Sign in to your portfolio dashboard"
              : "Start your AI investing journey"}
          </div>

          <div className="tabs">
            <button
              className={`tab ${tab === "login" ? "active" : ""}`}
              onClick={() => setTab("login")}
              type="button"
            >
              Sign in
            </button>
            <button
              className={`tab ${tab === "register" ? "active" : ""}`}
              onClick={() => setTab("register")}
              type="button"
            >
              Register
            </button>
          </div>

          {tab === "login" ? (
            <div>
              <div className="field">
                <label>Email Address</label>
                <input type="email" placeholder="you@example.com" />
              </div>
              <div className="field">
                <label>Password</label>
                <input type="password" placeholder="••••••••" />
              </div>
              <button className="submit-btn" onClick={() => router.push("/dashboard")} type="button">
                Sign in
              </button>
            </div>
          ) : (
            <div>
              <div className="field">
                <label>Full Name</label>
                <input type="text" placeholder="Vishal Rajendran" />
              </div>
              <div className="field">
                <label>Email Address</label>
                <input type="email" placeholder="you@example.com" />
              </div>
              <div className="field">
                <label>Password</label>
                <input type="password" placeholder="••••••••" />
              </div>
              <button className="submit-btn" onClick={() => router.push("/kyc")} type="button">
                Create account
              </button>
            </div>
          )}

          <div className="divider">
            <div className="divider-line" />
            <div className="divider-text">or continue with</div>
            <div className="divider-line" />
          </div>

          <button className="google-btn" type="button">
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          <div className="disclaimer">
            This platform is for <span>simulation purposes only</span>. No real
            investments are made. Past performance does not guarantee future
            results.
          </div>
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
          0%,
          100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(-20px, 20px);
          }
        }
        @keyframes float2 {
          0%,
          100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(15px, -15px);
          }
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
        .logo-name span {
          color: #6366f1;
        }
        .back-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 0.5px solid rgba(255, 255, 255, 0.12);
          color: rgba(255, 255, 255, 0.6);
          padding: 8px 18px;
          border-radius: 8px;
          font-size: 13px;
          cursor: pointer;
        }
        .main {
          flex: 1;
          display: flex;
          position: relative;
          z-index: 10;
          min-height: 0;
        }
        .left {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 60px 80px;
          border-right: 0.5px solid rgba(255, 255, 255, 0.05);
        }
        .left-title {
          font-size: 40px;
          font-weight: 800;
          letter-spacing: -2px;
          line-height: 1.1;
          margin-bottom: 16px;
        }
        .left-title .grad {
          background: linear-gradient(135deg, #6366f1, #8b5cf6, #34d399);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .left-sub {
          font-size: 15px;
          color: rgba(255, 255, 255, 0.4);
          line-height: 1.7;
          margin-bottom: 40px;
          max-width: 380px;
        }
        .stat-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .stat-item {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .stat-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
        }
        .stat-text {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.5);
        }
        .stat-text strong {
          color: #fff;
          display: block;
          font-size: 14px;
          margin-bottom: 1px;
        }
        .right {
          width: 480px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 60px 64px;
        }
        .form-title {
          font-size: 26px;
          font-weight: 700;
          letter-spacing: -1px;
          margin-bottom: 6px;
        }
        .form-sub {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.4);
          margin-bottom: 32px;
        }
        .tabs {
          display: flex;
          background: rgba(255, 255, 255, 0.04);
          border: 0.5px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 4px;
          margin-bottom: 28px;
        }
        .tab {
          flex: 1;
          padding: 10px;
          text-align: center;
          font-size: 13px;
          font-weight: 500;
          border-radius: 9px;
          cursor: pointer;
          border: none;
          background: transparent;
          color: rgba(255, 255, 255, 0.4);
          transition: all 0.2s;
        }
        .tab.active {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #fff;
          box-shadow: 0 0 20px rgba(99, 102, 241, 0.3);
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
          margin-top: 4px;
          box-shadow: 0 0 30px rgba(99, 102, 241, 0.35);
          transition: all 0.3s;
          position: relative;
          overflow: hidden;
        }
        .submit-btn::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), transparent);
        }
        .submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 50px rgba(99, 102, 241, 0.55);
        }
        .divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 20px 0;
        }
        .divider-line {
          flex: 1;
          height: 0.5px;
          background: rgba(255, 255, 255, 0.07);
        }
        .divider-text {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.25);
        }
        .google-btn {
          width: 100%;
          background: rgba(255, 255, 255, 0.04);
          border: 0.5px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.6);
          padding: 13px;
          border-radius: 12px;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.2s;
        }
        .google-btn:hover {
          background: rgba(255, 255, 255, 0.08);
        }
        .disclaimer {
          margin-top: 24px;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.2);
          text-align: center;
          line-height: 1.6;
        }
        .disclaimer span {
          color: rgba(255, 255, 255, 0.35);
        }

        @media (max-width: 1120px) {
          .left {
            padding: 48px 44px;
          }
          .right {
            width: 430px;
            padding: 48px 36px;
          }
        }
        @media (max-width: 900px) {
          .nav {
            padding: 16px 20px;
          }
          .left {
            display: none;
          }
          .right {
            width: 100%;
            max-width: 560px;
            margin: 0 auto;
            padding: 34px 20px 42px;
          }
        }
      `}</style>
    </div>
  );
}
