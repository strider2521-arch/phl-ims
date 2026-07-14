import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext";
import { useTheme } from "../contexts/ThemeContext";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "⬡" },
  { id: "knowledge", label: "Knowledge Base", icon: "📚" },
  { id: "inventory", label: "Inventory", icon: "⊟" },
  { id: "invoices", label: "Invoices", icon: "⊞" },
  { id: "pricelist", label: "Price List", icon: "💰" },
  { id: "settings", label: "Settings", icon: "⚙" },
];

export default function Layout({ children, page, setPage }) {
  const { user, logout } = useAuth();
  const { data } = useData();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const lowStockCount = data?.items?.filter(i => i.qty <= i.lowStockThreshold).length || 0;
  const totalItems = data?.items?.reduce((s, i) => s + i.qty, 0) || 0;
  const maxPossible = data?.items?.reduce((s, i) => s + Math.max(i.qty, i.lowStockThreshold * 3), 0) || 1;
  const healthPct = Math.min(100, Math.round((totalItems / maxPossible) * 100));

  const styles = `
    .pims-root { display: flex; min-height: 100vh; background: ${theme.bg}; color: ${theme.text}; font-family: 'Inter', sans-serif; }
    .pims-sidebar { width: ${theme.sidebarWidth}px; flex-shrink: 0; display: flex; flex-direction: column; padding: 24px 0; height: 100vh; position: sticky; top: 0; overflow-y: auto; }
    .pims-main { flex: 1; padding: 28px 32px; overflow-y: auto; min-height: 100vh; }
    .pims-hamburger { display: none; }
    @media (max-width: 768px) {
      .pims-root { flex-direction: column; }
      .pims-sidebar { position: fixed; top: 0; left: 0; z-index: 100; transform: translateX(-100%); transition: transform 0.25s ease; }
      .pims-sidebar.open { transform: translateX(0); background: ${theme.bg} !important; }
      .pims-main { padding: 16px; padding-top: 56px; }
      .pims-hamburger { display: flex; position: fixed; top: 0; left: 0; right: 0; z-index: 200; padding: 10px 12px; justify-content: space-between; align-items: center; background: ${theme.bg}; border-bottom: 1px solid ${theme.border}; }
    }
  `;

  const g = (key) => `1px solid ${theme.border}`;

  const sidebarContent = (
    <>
      <div style={{ padding: "0 20px 24px", borderBottom: g('border') }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: theme.accent, letterSpacing: 3, marginBottom: 4 }}>PRIME HELIX</div>
        <div style={{ fontSize: 13, color: theme.textSecondary, letterSpacing: 1 }}>IMS v2.0</div>
      </div>

      {/* User + Sign out — at top for mobile accessibility */}
      <div style={{ padding: "14px 20px", borderBottom: g('border'), display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <div style={{ fontSize: 12, color: theme.text, fontWeight: 600 }}>{user?.username}</div>
          <div style={{ fontSize: 10, color: theme.accent, letterSpacing: 1 }}>{user?.role?.toUpperCase()}</div>
        </div>
        <button onClick={logout} style={{
          fontSize: 11, color: theme.danger, background: "transparent",
          border: `1px solid ${theme.dangerBorder}`, padding: "5px 10px", cursor: "pointer", borderRadius: 6
        }}>Sign out</button>
      </div>

      <div style={{ padding: "14px 20px", borderBottom: g('border') }}>
        <div style={{ fontSize: 10, color: theme.textSecondary, letterSpacing: 2, marginBottom: 8 }}>STOCK HEALTH</div>
        <div style={{ height: 4, background: theme.border, borderRadius: 2, marginBottom: 6, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${healthPct}%`, borderRadius: 2, background: healthPct > 60 ? theme.success : healthPct > 30 ? theme.warning : theme.danger, transition: "width 0.6s ease" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: theme.textSecondary }}>
          <span>{healthPct}% capacity</span>
          {lowStockCount > 0 && <span style={{ color: theme.danger }}>{lowStockCount} low</span>}
        </div>
      </div>

      <nav style={{ padding: "8px 0", flex: 1 }}>
        {NAV.map(n => {
          const active = page === n.id;
          return (
            <button key={n.id} onClick={() => { setPage(n.id); setMobileOpen(false); }} style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%",
              padding: "10px 20px", background: active ? theme.accentGlass : "transparent",
              border: "none", cursor: "pointer", color: active ? theme.accent : theme.textSecondary,
              fontSize: 13, textAlign: "left", fontWeight: active ? 600 : 400,
              borderRight: `3px solid ${active ? theme.accent : "transparent"}`,
              transition: "all 0.15s",
            }}>
              <span style={{ fontSize: 16, width: 20, textAlign: "center" }}>{n.icon}</span>
              {n.label}
              {n.id === "invoices" && <span style={{ marginLeft: "auto", fontSize: 10, background: theme.accentGlass, color: theme.accent, borderRadius: 4, padding: "1px 6px" }}>{data?.invoices?.length || 0}</span>}
            </button>
          );
        })}
      </nav>

      <div style={{ padding: "16px 20px", borderTop: g('border') }}>
        <button onClick={toggleTheme} style={{
          fontSize: 11, color: theme.textSecondary, background: theme.glass,
          border: g('glassBorder'), padding: "6px 10px", cursor: "pointer",
          width: "100%", borderRadius: 6,
        }}>
          {theme.name === "dark" ? "☀️ Light" : "🌙 Dark"}
        </button>
      </div>
    </>
  );

  return (
    <>
      <style>{styles}</style>

      <div className="pims-root">
        {/* Hamburger + mobile header */}
        <div className="pims-hamburger">
          <button onClick={() => setMobileOpen(true)} style={{
            background: theme.bgSecondary, border: g('border'), color: theme.text,
            fontSize: 18, padding: "6px 10px", cursor: "pointer", borderRadius: 6,
          }}>☰</button>
          <button onClick={logout} style={{
            background: "transparent", border: `1px solid ${theme.dangerBorder}`, color: theme.danger,
            fontSize: 11, padding: "6px 10px", cursor: "pointer", borderRadius: 6,
          }}>Sign out</button>
        </div>

        {/* Mobile overlay */}
        {mobileOpen && (
          <div onClick={() => setMobileOpen(false)} style={{
            position: "fixed", inset: 0, background: theme.modalOverlay,
            zIndex: 99,
          }} />
        )}

        {/* Sidebar */}
        <aside className={`pims-sidebar ${mobileOpen ? 'open' : ''}`} style={{ background: theme.sidebarBg, borderRight: g('border') }}>
          {sidebarContent}
        </aside>

        {/* Main content */}
        <main className="pims-main">
          {children}
        </main>
      </div>
    </>
  );
}
