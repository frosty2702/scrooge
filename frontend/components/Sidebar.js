import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { logout as doLogout, getUser } from "../lib/api";

const NAV = [
  { icon: "📊", label: "Dashboard",    path: "/dashboard",    section: "main" },
  { icon: "🤖", label: "Simulate",     path: "/simulate",     section: "main" },
  { icon: "🧠", label: "AI Decisions", path: "/ai-decisions", section: "main" },
  { icon: "📈", label: "Portfolio",    path: "/portfolio",    section: "main" },
  { icon: "🔍", label: "XAI Insights", path: "/xai-insights", section: "analysis" },
  { icon: "📋", label: "History",      path: "/history",      section: "analysis" },
  { icon: "📄", label: "Reports",      path: "/reports",      section: "analysis" },
  { icon: "⚙️", label: "Settings",    path: "/settings",     section: "account" },
];

export default function Sidebar({ active }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => { setUser(getUser()); }, []);

  // Close sidebar on route change (mobile)
  useEffect(() => { setOpen(false); }, [router.pathname]);

  // Prevent body scroll when sidebar open on mobile
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.body.style.overflow = open ? "hidden" : "";
    }
    return () => { if (typeof document !== "undefined") document.body.style.overflow = ""; };
  }, [open]);

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const navGroup = (section) =>
    NAV.filter((n) => n.section === section).map((n) => (
      <button key={n.path}
        className={`nav-item ${active === n.label ? "active" : ""}`}
        onClick={() => router.push(n.path)}
        type="button">
        <span className="icon">{n.icon}</span>{n.label}
      </button>
    ));

  const sidebarContent = (
    <div className="sidebar-inner">
      <div className="logo-row">
        <div className="logo-mark">S</div>
        <div className="logo-name">Scrooge<span>.</span>ai</div>
        {/* Close button on mobile */}
        <button className="close-btn" onClick={() => setOpen(false)} type="button" aria-label="Close menu">✕</button>
      </div>

      <div className="section-label">Main</div>
      {navGroup("main")}
      <div className="section-label">Analysis</div>
      {navGroup("analysis")}
      <div className="section-label">Account</div>
      {navGroup("account")}

      <div className="bottom">
        <div className="user-row">
          <div className="avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{user?.name || "Guest"}</div>
            <div className="user-sub">{user?.risk_profile || "—"}</div>
          </div>
        </div>
        <button className="logout-btn" onClick={() => doLogout(router)} type="button">
          ↩ Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="mobile-bar">
        <button className="hamburger" onClick={() => setOpen(true)} type="button" aria-label="Open menu">
          <span /><span /><span />
        </button>
        <div className="mobile-logo">
          <div className="logo-mark-sm">S</div>
          <div className="logo-name-sm">Scrooge<span>.</span>ai</div>
        </div>
        <div className="mobile-avatar" onClick={() => router.push("/settings")}>{initials}</div>
      </div>

      {/* Desktop sidebar */}
      <div className="sidebar desktop-only">
        {sidebarContent}
      </div>

      {/* Mobile overlay */}
      {open && <div className="overlay" onClick={() => setOpen(false)} />}

      {/* Mobile drawer */}
      <div className={`sidebar mobile-drawer ${open ? "open" : ""}`}>
        {sidebarContent}
      </div>

      <style jsx global>{`
        /* ── Desktop sidebar ───────────────────────────────────────────────── */
        .sidebar { width: 220px; min-width: 220px; border-right: 0.5px solid rgba(255,255,255,0.05); background: rgba(0,0,0,0.3); backdrop-filter: blur(20px); flex-shrink: 0; min-height: 100vh; }
        .sidebar-inner { display: flex; flex-direction: column; gap: 2px; padding: 20px 12px; height: 100%; }
        .logo-row { display: flex; align-items: center; gap: 9px; padding: 10px 12px; margin-bottom: 16px; }
        .logo-mark { width: 30px; height: 30px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; color: #fff; box-shadow: 0 0 12px rgba(99,102,241,0.3); flex-shrink: 0; }
        .logo-name { font-size: 15px; font-weight: 700; letter-spacing: -0.5px; color: #fff; flex: 1; }
        .logo-name span { color: #6366f1; }
        .close-btn { display: none; background: transparent; border: none; color: rgba(255,255,255,0.4); font-size: 18px; cursor: pointer; padding: 4px; line-height: 1; margin-left: auto; }
        .section-label { font-size: 10px; color: rgba(255,255,255,0.2); letter-spacing: 0.08em; text-transform: uppercase; padding: 8px 12px 4px; margin-top: 6px; }
        .nav-item { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 9px; font-size: 13px; color: rgba(255,255,255,0.4); cursor: pointer; transition: all 0.2s; background: transparent; border: none; width: 100%; text-align: left; margin-bottom: 1px; }
        .nav-item:hover { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.7); }
        .nav-item.active { background: rgba(99,102,241,0.1); color: #818cf8; border: 0.5px solid rgba(99,102,241,0.15); }
        .icon { font-size: 14px; width: 18px; text-align: center; flex-shrink: 0; }
        .bottom { margin-top: auto; padding-top: 16px; border-top: 0.5px solid rgba(255,255,255,0.05); }
        .user-row { display: flex; align-items: center; gap: 10px; padding: 8px 12px; margin-bottom: 6px; }
        .avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #8b5cf6); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; color: #fff; }
        .user-info { overflow: hidden; }
        .user-name { font-size: 13px; font-weight: 500; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .user-sub { font-size: 10px; color: rgba(255,255,255,0.3); text-transform: capitalize; }
        .logout-btn { width: 100%; padding: 9px 12px; border-radius: 9px; font-size: 13px; color: rgba(255,255,255,0.35); cursor: pointer; transition: all 0.2s; background: transparent; border: 0.5px solid rgba(255,255,255,0.08); text-align: left; }
        .logout-btn:hover { background: rgba(239,68,68,0.08); color: #f87171; border-color: rgba(239,68,68,0.2); }

        /* ── Mobile bar ────────────────────────────────────────────────────── */
        .mobile-bar { display: none; position: fixed; top: 0; left: 0; right: 0; z-index: 100; background: rgba(0,0,0,0.85); backdrop-filter: blur(20px); border-bottom: 0.5px solid rgba(255,255,255,0.06); height: 56px; padding: 0 16px; align-items: center; justify-content: space-between; }
        .hamburger { background: transparent; border: none; cursor: pointer; display: flex; flex-direction: column; gap: 5px; padding: 6px; }
        .hamburger span { display: block; width: 22px; height: 1.5px; background: rgba(255,255,255,0.7); border-radius: 2px; transition: all 0.2s; }
        .mobile-logo { display: flex; align-items: center; gap: 8px; }
        .logo-mark-sm { width: 26px; height: 26px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 7px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: #fff; }
        .logo-name-sm { font-size: 15px; font-weight: 700; letter-spacing: -0.5px; color: #fff; }
        .logo-name-sm span { color: #6366f1; }
        .mobile-avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #8b5cf6); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: #fff; cursor: pointer; }

        /* ── Mobile drawer ─────────────────────────────────────────────────── */
        .overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 199; backdrop-filter: blur(2px); }
        .mobile-drawer { display: none; position: fixed; top: 0; left: 0; bottom: 0; width: 280px; z-index: 200; background: #0a0a0a; border-right: 0.5px solid rgba(255,255,255,0.08); transform: translateX(-100%); transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1); }
        .mobile-drawer .close-btn { display: block; }
        .mobile-drawer.open { transform: translateX(0); }

        /* ── Responsive ────────────────────────────────────────────────────── */
        @media (max-width: 768px) {
          .desktop-only { display: none; }
          .mobile-bar { display: flex; }
          .overlay { display: block; }
          .mobile-drawer { display: block; }
        }
      `}</style>
    </>
  );
}
