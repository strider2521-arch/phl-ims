import { useData } from "../contexts/DataContext";
import { useTheme } from "../contexts/ThemeContext";

export default function Dashboard({ setPage }) {
  const { data } = useData();
  const { theme } = useTheme();

  const totalItems = data.items.reduce((s, i) => s + i.qty, 0);
  const lowStock = data.items.filter(i => i.qty <= i.lowStockThreshold);
  const totalRevenue = data.invoices.reduce((s, inv) => {
    const sub = inv.items.reduce((ss, li) => ss + li.qty * li.unitPrice, 0);
    return s + Math.max(0, sub - (inv.discountAmount || 0));
  }, 0);
  const paidInvoices = data.invoices.filter(i => i.status === "paid").length;

  const recentInvoices = [...data.invoices].reverse().slice(0, 5);
  const statusColor = { paid: theme.success, pending: theme.warning, draft: theme.textSecondary, cancelled: theme.danger };

  const g = (k) => `1px solid ${theme.border}`;
  const card = (topColor) => ({
    background: theme.glass, border: `1px solid ${theme.glassBorder}`,
    backdropFilter: "blur(12px)", borderRadius: 10,
    padding: "20px 24px", borderTop: `3px solid ${topColor}`,
  });

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, color: theme.accent, letterSpacing: 3, marginBottom: 8 }}>OVERVIEW</div>
        <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0, color: theme.text }}>Dashboard</h1>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Total Stock", value: totalItems, unit: "units", color: theme.accent },
          { label: "SKUs Active", value: data.items.length, unit: "products", color: theme.success },
          { label: "Low Stock", value: lowStock.length, unit: "SKUs", color: lowStock.length > 0 ? theme.danger : theme.success },
          { label: "Total Revenue", value: `£${totalRevenue.toFixed(2)}`, unit: `${paidInvoices} paid`, color: theme.warning },
        ].map(s => (
          <div key={s.label} style={card(s.color)}>
            <div style={{ fontSize: 11, color: theme.textSecondary, letterSpacing: 1, marginBottom: 10 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.color, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: theme.textMuted }}>{s.unit}</div>
          </div>
        ))}
      </div>

      {/* Two-column */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20, marginBottom: 24 }}>

        {/* Low Stock */}
        <div style={{ background: theme.glass, border: `1px solid ${theme.glassBorder}`, backdropFilter: "blur(12px)", borderRadius: 10, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: g('border'), display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 12, color: theme.text, fontWeight: 600 }}>Low Stock Alerts</div>
            {lowStock.length > 0 && <span style={{ fontSize: 10, background: theme.dangerBg, color: theme.danger, border: `1px solid ${theme.dangerBorder}`, padding: "2px 8px", borderRadius: 4 }}>{lowStock.length} ITEMS</span>}
          </div>
          <div>
            {lowStock.length === 0 ? (
              <div style={{ padding: "24px", fontSize: 13, color: theme.textSecondary, textAlign: "center" }}>✓ All stock levels healthy</div>
            ) : lowStock.map(item => (
              <div key={item.id} style={{ padding: "10px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: g('border'), background: theme.bgTertiary }}>
                <div>
                  <div style={{ fontSize: 13, color: theme.text, marginBottom: 2 }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: theme.textSecondary, fontFamily: "monospace" }}>{item.sku}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: theme.danger, fontFamily: "'JetBrains Mono', monospace" }}>{item.qty}</div>
                  <div style={{ fontSize: 10, color: theme.textSecondary }}>threshold: {item.lowStockThreshold}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Invoices */}
        <div style={{ background: theme.glass, border: `1px solid ${theme.glassBorder}`, backdropFilter: "blur(12px)", borderRadius: 10, overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: g('border'), display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 12, color: theme.text, fontWeight: 600 }}>Recent Invoices</div>
            <button onClick={() => setPage("invoices")} style={{ fontSize: 11, color: theme.accent, background: "none", border: "none", cursor: "pointer" }}>View all →</button>
          </div>
          <div>
            {recentInvoices.length === 0 ? (
              <div style={{ padding: "24px", fontSize: 13, color: theme.textSecondary, textAlign: "center" }}>No invoices yet</div>
            ) : recentInvoices.map(inv => {
              const sub = inv.items.reduce((s, li) => s + li.qty * li.unitPrice, 0);
              const total = Math.max(0, sub - (inv.discountAmount || 0));
              return (
                <div key={inv.id} style={{ padding: "10px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: g('border') }}>
                  <div>
                    <div style={{ fontSize: 13, color: theme.text, marginBottom: 2 }}>{inv.number}</div>
                    <div style={{ fontSize: 11, color: theme.textSecondary }}>{inv.customer.name}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: theme.text, fontFamily: "'JetBrains Mono', monospace" }}>£{total.toFixed(2)}</div>
                    <div style={{ fontSize: 10, color: statusColor[inv.status] || theme.textSecondary, letterSpacing: 1 }}>{inv.status?.toUpperCase()}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stock by Group */}
      <div style={{ background: theme.glass, border: `1px solid ${theme.glassBorder}`, backdropFilter: "blur(12px)", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: g('border') }}>
          <div style={{ fontSize: 12, color: theme.text, fontWeight: 600 }}>Stock by Group</div>
        </div>
        <div style={{ padding: "16px 20px", display: "flex", gap: 14, flexWrap: "wrap" }}>
          {data.groups.map(g => {
            const items = data.items.filter(i => i.groupId === g.id);
            const total = items.reduce((s, i) => s + i.qty, 0);
            const hasLow = items.some(i => i.qty <= i.lowStockThreshold);
            return (
              <div key={g.id} style={{
                flex: "1 1 160px", background: theme.bgTertiary, border: hasLow ? `1px solid ${theme.dangerBorder}` : g('border'),
                borderRadius: 8, padding: "14px",
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: theme.text, marginBottom: 4 }}>{g.name}</div>
                <div style={{ fontSize: 11, color: theme.textSecondary, marginBottom: 10 }}>{items.length} SKUs</div>
                <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: hasLow ? theme.danger : theme.accent }}>{total}</div>
                <div style={{ fontSize: 10, color: theme.textMuted }}>total units</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
