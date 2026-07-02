import { useState } from "react";
import { useData } from "../contexts/DataContext";
import { useTheme } from "../contexts/ThemeContext";
import { updateInvoiceStatus as apiUpdateStatus, deleteInvoice as apiDeleteInvoice } from "../utils/api";

const statusColor = (theme) => ({ paid: theme.success, pending: theme.warning, draft: theme.textSecondary, cancelled: theme.danger });
const statusBg = (theme) => ({ paid: theme.successBg, pending: theme.warningBg, draft: theme.bgTertiary, cancelled: theme.dangerBg });

export default function Invoices({ setPage, setEditingInvoice }) {
  const { data, refreshData } = useData();
  const { theme } = useTheme();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [viewInvoice, setViewInvoice] = useState(null);

  const g = (k) => `1px solid ${theme.border}`;
  const sc = statusColor(theme);
  const sbg = statusBg(theme);

  const filtered = data.invoices.filter(inv => {
    const matchSearch = !search || inv.number.toLowerCase().includes(search.toLowerCase()) || inv.customer.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || inv.status === filter;
    return matchSearch && matchFilter;
  }).reverse();

  const updateStatus = async (id, status) => {
    try {
      await apiUpdateStatus(id, status);
      await refreshData();
      if (viewInvoice?.id === id) setViewInvoice(v => ({ ...v, status }));
    } catch (e) {
      alert('Failed to update status: ' + e.message);
    }
  };

  const deleteInvoice = async (id) => {
    if (!confirm("Delete this invoice? Stock will NOT be restored automatically.")) return;
    try {
      await apiDeleteInvoice(id);
      await refreshData();
      setViewInvoice(null);
    } catch (e) {
      alert('Failed to delete invoice: ' + e.message);
    }
  };

  const printInvoice = (inv) => {
    const subtotal = inv.items.reduce((s, li) => s + li.qty * li.unitPrice, 0);
    const disc = inv.discountAmount || 0;
    const total = Math.max(0, subtotal - disc);
    const discPct = subtotal > 0 ? (disc / subtotal * 100) : 0;
    const win = window.open("", "_blank");
    win.document.write(`
      <html><head><title>${inv.number}</title>
      <style>
        body { font-family: Inter, sans-serif; max-width: 700px; margin: 40px auto; color: #111; }
        h1 { font-size: 28px; } .meta { color: #666; font-size: 13px; }
        table { width: 100%; border-collapse: collapse; margin: 24px 0; }
        th { background: #f5f5f5; padding: 10px; text-align: left; font-size: 12px; }
        td { padding: 10px; border-bottom: 1px solid #eee; font-size: 13px; }
        .total { font-size: 20px; font-weight: 700; text-align: right; margin-top: 16px; }
        @media print { button { display: none; } }
      </style></head><body>
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px">
        <div><div style="font-size:11px;letter-spacing:3px;color:#2563EB;margin-bottom:6px">PRIME HELIX</div><h1 style="margin:0">${inv.number}</h1><div class="meta">${inv.date} · ${inv.status.toUpperCase()}</div></div>
        <div style="text-align:right"><div style="font-weight:600">${inv.customer.name}</div><div class="meta">${inv.customer.email || ""}</div><div class="meta">${inv.customer.address || ""}</div></div>
      </div>
      <table><thead><tr><th>SKU</th><th>Product</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead><tbody>
        ${inv.items.map(li => `<tr><td style="font-family:monospace;color:#2563EB">${li.sku}</td><td>${li.name}</td><td>${li.qty}</td><td>£${li.unitPrice.toFixed(2)}</td><td>£${(li.qty * li.unitPrice).toFixed(2)}</td></tr>`).join("")}
      </tbody></table>
      ${disc > 0 ? `<div style="text-align:right;font-size:15px;margin-bottom:4px">Subtotal: £${subtotal.toFixed(2)}</div><div style="text-align:right;font-size:13px;color:#666;margin-bottom:4px">Discount: -£${disc.toFixed(2)} (${discPct.toFixed(1)}%)</div>` : ''}
      ${inv.notes ? `<div style="font-size:12px;color:#666;margin-bottom:16px">Notes: ${inv.notes}</div>` : ""}
      <div class="total">Total: £${total.toFixed(2)}</div>
      <script>window.print()</script></body></html>
    `);
  };

  return (
    <div>
      <div style={{ marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: theme.accent, letterSpacing: 3, marginBottom: 8 }}>BILLING</div>
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0, color: theme.text }}>Invoices</h1>
        </div>
        <button onClick={() => { setEditingInvoice(null); setPage("create-invoice"); }} style={{ padding: "8px 16px", background: theme.accent, border: "none", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", borderRadius: 6 }}>
          + New Invoice
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <input
          placeholder="Search invoices or customer…"
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ padding: "8px 12px", background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.text, fontSize: 13, outline: "none", width: 260, borderRadius: 6 }}
        />
        {["all", "draft", "pending", "paid", "cancelled"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "6px 14px", background: filter === f ? theme.accent : "none",
            border: g('border'), color: filter === f ? "#fff" : theme.textSecondary,
            fontSize: 12, cursor: "pointer", borderRadius: 6
          }}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: theme.glass, border: `1px solid ${theme.glassBorder}`, backdropFilter: "blur(12px)", borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: g('border') }}>
              {["Invoice #", "Customer", "Date", "Items", "Total", "Status", ""].map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, color: theme.textSecondary, letterSpacing: 1 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ padding: "40px", textAlign: "center", color: theme.textSecondary, fontSize: 13 }}>No invoices found.</td></tr>
            )}
            {filtered.map(inv => {
              const sub = inv.items.reduce((s, li) => s + li.qty * li.unitPrice, 0);
              const disc = inv.discountAmount || 0;
              const total = Math.max(0, sub - disc);
              return (
                <tr key={inv.id} style={{ borderBottom: g('border'), cursor: "pointer", transition: "background 0.15s" }} onClick={() => setViewInvoice(inv)}>
                  <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: 13, color: theme.accent }}>{inv.number}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: theme.text }}>
                    <div>{inv.customer.name}</div>
                    <div style={{ fontSize: 11, color: theme.textSecondary }}>{inv.customer.email}</div>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: theme.textSecondary }}>{inv.date}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: theme.textSecondary }}>{inv.items.length} line{inv.items.length !== 1 ? "s" : ""}</td>
                  <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 600, fontFamily: "monospace", color: theme.text }}>£{total.toFixed(2)}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontSize: 10, padding: "3px 8px", background: sbg[inv.status], color: sc[inv.status], borderRadius: 4, letterSpacing: 1 }}>
                      {inv.status?.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => printInvoice(inv)} style={{ padding: "4px 10px", background: "none", border: g('border'), color: theme.textSecondary, fontSize: 11, cursor: "pointer", borderRadius: 6 }}>Print</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Invoice Detail Modal */}
      {viewInvoice && (() => {
        const inv = data.invoices.find(i => i.id === viewInvoice.id) || viewInvoice;
        const subtotalM = inv.items.reduce((s, li) => s + li.qty * li.unitPrice, 0);
        const discM = inv.discountAmount || 0;
        const total = Math.max(0, subtotalM - discM);
        const discPctM = subtotalM > 0 ? (discM / subtotalM * 100) : 0;
        const scm = statusColor(theme);
        const sbgm = statusBg(theme);
        return (
          <div style={{ position: "fixed", inset: 0, background: theme.modalOverlay, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setViewInvoice(null)}>
            <div style={{ background: theme.bgSecondary, border: `1px solid ${theme.border}`, borderRadius: 12, width: "100%", maxWidth: 640, padding: "28px", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                <div>
                  <div style={{ fontFamily: "monospace", fontSize: 11, color: theme.accent, letterSpacing: 2, marginBottom: 4 }}>PRIME HELIX</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: theme.text, marginBottom: 4 }}>{inv.number}</div>
                  <div style={{ fontSize: 12, color: theme.textSecondary }}>{inv.date}</div>
                </div>
                <button onClick={() => setViewInvoice(null)} style={{ background: "none", border: "none", color: theme.textSecondary, cursor: "pointer", fontSize: 20 }}>×</button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                <div style={{ background: theme.bgTertiary, padding: "14px", borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: theme.textSecondary, letterSpacing: 1, marginBottom: 8 }}>BILL TO</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: theme.text, marginBottom: 4 }}>{inv.customer.name}</div>
                  <div style={{ fontSize: 12, color: theme.textSecondary }}>{inv.customer.email}</div>
                  <div style={{ fontSize: 12, color: theme.textSecondary }}>{inv.customer.address}</div>
                </div>
                <div style={{ background: theme.bgTertiary, padding: "14px", borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: theme.textSecondary, letterSpacing: 1, marginBottom: 8 }}>STATUS</div>
                  <span style={{ fontSize: 12, padding: "4px 12px", background: sbgm[inv.status], color: scm[inv.status], borderRadius: 4 }}>{inv.status?.toUpperCase()}</span>
                  <div style={{ marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {["draft", "pending", "paid", "cancelled"].map(s => (
                      <button key={s} onClick={() => updateStatus(inv.id, s)} style={{
                        padding: "3px 8px", fontSize: 10, cursor: "pointer", borderRadius: 4,
                        background: inv.status === s ? sbgm[s] : "none",
                        border: `1px solid ${scm[s]}40`, color: scm[s]
                      }}>{s}</button>
                    ))}
                  </div>
                </div>
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
                <thead><tr style={{ borderBottom: g('border') }}>
                  {["SKU", "Product", "Qty", "Price", "Total"].map(h => (
                    <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontSize: 10, color: theme.textSecondary, letterSpacing: 1 }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {inv.items.map((li, idx) => (
                    <tr key={idx} style={{ borderBottom: g('border') }}>
                      <td style={{ padding: "10px", fontFamily: "monospace", fontSize: 12, color: theme.accent }}>{li.sku}</td>
                      <td style={{ padding: "10px", fontSize: 13, color: theme.text }}>{li.name}</td>
                      <td style={{ padding: "10px", fontSize: 13, color: theme.text }}>{li.qty}</td>
                      <td style={{ padding: "10px", fontSize: 13, fontFamily: "monospace", color: theme.text }}>£{li.unitPrice.toFixed(2)}</td>
                      <td style={{ padding: "10px", fontSize: 13, fontFamily: "monospace", color: theme.text }}>£{(li.qty * li.unitPrice).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {discM > 0 && <div style={{ textAlign: "right", fontSize: 14, color: theme.textSecondary, marginBottom: 4 }}>Subtotal: £{subtotalM.toFixed(2)}</div>}
              {discM > 0 && <div style={{ textAlign: "right", fontSize: 13, color: theme.success, marginBottom: 4 }}>Discount: -£{discM.toFixed(2)} ({discPctM.toFixed(1)}% off)</div>}
              <div style={{ textAlign: "right", fontSize: 20, fontWeight: 700, fontFamily: "monospace", color: theme.text, marginBottom: 16 }}>
                Total: £{total.toFixed(2)}
              </div>
              {inv.notes && <div style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 16 }}>Notes: {inv.notes}</div>}

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button onClick={() => deleteInvoice(inv.id)} style={{ padding: "8px 16px", background: "none", border: `1px solid ${theme.dangerBorder}`, color: theme.danger, fontSize: 12, cursor: "pointer", borderRadius: 6 }}>Delete</button>
                <button onClick={() => printInvoice(inv)} style={{ padding: "8px 16px", background: "none", border: g('border'), color: theme.textSecondary, fontSize: 12, cursor: "pointer", borderRadius: 6 }}>Print / Export</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}