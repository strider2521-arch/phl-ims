import { useState, useEffect } from "react";
import { useData } from "../contexts/DataContext";
import { useTheme } from "../contexts/ThemeContext";
import { createInvoice as apiCreateInvoice, updateInvoice as apiUpdateInvoice } from "../utils/api";

export default function CreateInvoice({ setPage, editingInvoice, setEditingInvoice }) {
  const { data, refreshData } = useData();
  const { theme } = useTheme();
  const [customer, setCustomer] = useState({ name: "", email: "", address: "" });
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [status, setStatus] = useState("draft");
  const [lines, setLines] = useState([]);
  const [notes, setNotes] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountType, setDiscountType] = useState("fixed"); // 'fixed' or 'percent'
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const g = (k) => `1px solid ${theme.border}`;
  const inputStyle = {
    padding: "8px 10px", background: theme.inputBg, border: `1px solid ${theme.inputBorder}`,
    color: theme.text, fontSize: 13, outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box", borderRadius: 6
  };

  useEffect(() => {
    if (editingInvoice) {
      setCustomer(editingInvoice.customer);
      setDate(editingInvoice.date);
      setStatus(editingInvoice.status);
      setLines(editingInvoice.items.map(i => ({ ...i })));
      setNotes(editingInvoice.notes || "");
      setDiscountAmount(editingInvoice.discountAmount || 0);
    }
  }, []);

  const addItem = (item) => {
    const existing = lines.findIndex(l => l.itemId === item.id);
    if (existing >= 0) {
      const updated = [...lines];
      updated[existing].qty += 1;
      setLines(updated);
    } else {
      setLines(l => [...l, { itemId: item.id, sku: item.sku, name: item.name, qty: 1, unitPrice: item.salePrice }]);
    }
  };

  const updateLine = (idx, field, val) => {
    const updated = [...lines];
    updated[idx][field] = field === "qty" || field === "unitPrice" ? Number(val) : val;
    setLines(updated);
  };

  const removeLine = (idx) => setLines(l => l.filter((_, i) => i !== idx));

  const subtotal = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
  const discountVal = discountType === 'percent' ? subtotal * (discountAmount / 100) : parseFloat(discountAmount) || 0;
  const total = Math.max(0, subtotal - discountVal);
  const discountPct = subtotal > 0 ? (discountVal / subtotal * 100) : 0;

  const validate = () => {
    if (!customer.name.trim()) return "Customer name is required.";
    if (lines.length === 0) return "Add at least one item.";
    for (const line of lines) {
      const stockItem = data.items.find(i => i.id === line.itemId);
      if (stockItem && line.qty > stockItem.qty && status !== "draft") {
        return `Insufficient stock for ${line.name} (have ${stockItem.qty}, need ${line.qty})`;
      }
    }
    return null;
  };

  const saveInvoice = async () => {
    setError("");
    const err = validate();
    if (err) { setError(err); return; }

    const settings = JSON.parse(localStorage.getItem('pims_settings') || '{}');
    const payload = {
      customer,
      date,
      status,
      notes,
      invoicePrefix: settings.invoicePrefix || 'INV-',
      discountAmount: discountVal,
      items: lines.map(l => ({ itemId: l.itemId, sku: l.sku, name: l.name, qty: l.qty, unitPrice: l.unitPrice }))
    };

    try {
      if (editingInvoice) {
        await apiUpdateInvoice(editingInvoice.id, payload);
      } else {
        await apiCreateInvoice(payload);
      }
      await refreshData();
      setEditingInvoice(null);
      setSaved(true);
      setTimeout(() => setPage("invoices"), 1200);
    } catch (e) {
      setError(e.message);
    }
  };

  const filteredItems = groupFilter === "all" ? data.items : data.items.filter(i => i.groupId === groupFilter);

  return (
    <div>
      <div style={{ marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: theme.accent, letterSpacing: 3, marginBottom: 8 }}>BILLING</div>
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0, color: theme.text }}>
            {editingInvoice ? `Edit ${editingInvoice.number}` : "New Invoice"}
          </h1>
        </div>
        <button onClick={() => setPage("invoices")} style={{ padding: "8px 16px", background: "none", border: g('border'), color: theme.textSecondary, fontSize: 12, cursor: "pointer", borderRadius: 6 }}>← Back</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 24 }}>
        {/* Left: Form */}
        <div>
          {/* Customer */}
          <Section theme={theme} title="Customer Details">
            <Field theme={theme} label="Name *"><input style={inputStyle} value={customer.name} onChange={e => setCustomer(c => ({ ...c, name: e.target.value }))} placeholder="Full name" autoFocus /></Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field theme={theme} label="Email"><input style={inputStyle} type="email" value={customer.email} onChange={e => setCustomer(c => ({ ...c, email: e.target.value }))} /></Field>
              <Field theme={theme} label="Address"><input style={inputStyle} value={customer.address} onChange={e => setCustomer(c => ({ ...c, address: e.target.value }))} /></Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
              <Field theme={theme} label="Invoice Date"><input style={inputStyle} type="date" value={date} onChange={e => setDate(e.target.value)} /></Field>
              <Field theme={theme} label="Status">
                <select style={inputStyle} value={status} onChange={e => setStatus(e.target.value)}>
                  {["draft", "pending", "paid", "cancelled"].map(s => <option key={s}>{s}</option>)}
                </select>
              </Field>
            </div>
          </Section>

          {/* Line Items */}
          <Section theme={theme} title="Line Items">
            {lines.length === 0 ? (
              <div style={{ padding: "20px", textAlign: "center", color: theme.textSecondary, fontSize: 13, border: `1px dashed ${theme.border}`, borderRadius: 8 }}>
                Select items from the panel on the right →
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr style={{ borderBottom: g('border') }}>
                  {["SKU", "Product", "Qty", "Unit Price", "Total", ""].map(h => (
                    <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontSize: 10, color: theme.textSecondary, letterSpacing: 1 }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {lines.map((l, idx) => {
                    const stockItem = data.items.find(i => i.id === l.itemId);
                    const overStock = stockItem && l.qty > stockItem.qty;
                    return (
                      <tr key={idx} style={{ borderBottom: g('border') }}>
                        <td style={{ padding: "8px 10px", fontFamily: "monospace", fontSize: 12, color: theme.accent }}>{l.sku}</td>
                        <td style={{ padding: "8px 10px", fontSize: 13, color: theme.text }}>
                          <div>{l.name}</div>
                          {stockItem && <div style={{ fontSize: 10, color: overStock ? theme.danger : theme.textSecondary }}>Stock: {stockItem.qty}</div>}
                        </td>
                        <td style={{ padding: "8px 10px" }}>
                          <input type="number" min="1" value={l.qty} onChange={e => updateLine(idx, "qty", e.target.value)}
                            style={{ ...inputStyle, width: 60, borderColor: overStock ? theme.danger : theme.inputBorder }} />
                        </td>
                        <td style={{ padding: "8px 10px" }}>
                          <input type="number" step="0.01" value={l.unitPrice} onChange={e => updateLine(idx, "unitPrice", e.target.value)}
                            style={{ ...inputStyle, width: 80 }} />
                        </td>
                        <td style={{ padding: "8px 10px", fontFamily: "monospace", fontSize: 13, color: theme.text }}>£{(l.qty * l.unitPrice).toFixed(2)}</td>
                        <td style={{ padding: "8px 10px" }}>
                          <button onClick={() => removeLine(idx)} style={{ background: "none", border: "none", color: theme.danger, cursor: "pointer", fontSize: 16 }}>×</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {lines.length > 0 && (
              <div style={{ padding: "12px 10px 0", borderTop: g('border'), marginTop: 8 }}>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 24, marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: theme.textSecondary }}>Subtotal: <strong style={{ fontFamily: "monospace", color: theme.text }}>£{subtotal.toFixed(2)}</strong></span>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 13, color: theme.textSecondary }}>Discount:</span>
                  <div style={{ display: "flex", gap: 4 }}>
                    <input type="number" min="0" step={discountType === 'percent' ? "1" : "0.01"} value={discountAmount}
                      onChange={e => setDiscountAmount(parseFloat(e.target.value) || 0)}
                      style={{ ...inputStyle, width: 80, textAlign: "right", fontFamily: "monospace" }} />
                    <select value={discountType} onChange={e => setDiscountType(e.target.value)}
                      style={{ ...inputStyle, width: 90 }}>
                      <option value="fixed">£ Fixed</option>
                      <option value="percent">%</option>
                    </select>
                  </div>
                  {discountVal > 0 && <span style={{ fontSize: 12, color: theme.success, fontFamily: "monospace" }}>-£{discountVal.toFixed(2)} ({discountPct.toFixed(1)}%)</span>}
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "monospace", color: theme.text }}>Total: £{total.toFixed(2)}</div>
                </div>
              </div>
            )}
          </Section>

          <Section theme={theme} title="Notes">
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              style={{ ...inputStyle, resize: "vertical" }} placeholder="Delivery instructions, order notes…" />
          </Section>

          {error && <div style={{ padding: "12px", background: theme.dangerBg, border: `1px solid ${theme.dangerBorder}`, color: theme.danger, fontSize: 13, marginBottom: 16, borderRadius: 8 }}>{error}</div>}
          {saved && <div style={{ padding: "12px", background: theme.successBg, border: `1px solid ${theme.successBorder}`, color: theme.success, fontSize: 13, marginBottom: 16, borderRadius: 8 }}>✓ Invoice saved! Redirecting…</div>}

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setPage("invoices")} style={{ padding: "10px 20px", background: "none", border: g('border'), color: theme.textSecondary, fontSize: 13, cursor: "pointer", borderRadius: 6 }}>Cancel</button>
            <button onClick={saveInvoice} style={{ padding: "10px 24px", background: theme.accent, border: "none", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", borderRadius: 6 }}>
              {editingInvoice ? "Update Invoice" : "Create Invoice"}
            </button>
          </div>
        </div>

        {/* Right: Item Picker */}
        <div style={{ background: theme.glass, border: `1px solid ${theme.glassBorder}`, backdropFilter: "blur(12px)", height: "fit-content", position: "sticky", top: 0, borderRadius: 10, overflow: "hidden" }}>
          <div style={{ padding: "16px", borderBottom: g('border') }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: theme.text, marginBottom: 12 }}>Add Products</div>
            <select style={{ ...inputStyle }} value={groupFilter} onChange={e => setGroupFilter(e.target.value)}>
              <option value="all">All Groups</option>
              {data.groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div style={{ maxHeight: 500, overflowY: "auto" }}>
            {filteredItems.map(item => {
              const inCart = lines.find(l => l.itemId === item.id);
              const isLow = item.qty <= item.lowStockThreshold;
              return (
                <div key={item.id} style={{ padding: "12px 16px", borderBottom: g('border'), cursor: item.qty === 0 ? "not-allowed" : "pointer", opacity: item.qty === 0 ? 0.4 : 1, transition: "background 0.15s" }}
                  onClick={() => item.qty > 0 && addItem(item)}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontFamily: "monospace", color: theme.accent, marginBottom: 2 }}>{item.sku}</div>
                      <div style={{ fontSize: 13, color: theme.text }}>{item.name}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 13, fontFamily: "monospace", color: theme.text }}>£{item.salePrice.toFixed(2)}</div>
                      <div style={{ fontSize: 10, color: isLow ? theme.danger : theme.success }}>{item.qty} in stock</div>
                    </div>
                  </div>
                  {inCart && <div style={{ fontSize: 10, color: theme.accent, marginTop: 4 }}>✓ {inCart.qty} in invoice</div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ theme, title, children }) {
  return (
    <div style={{ background: theme.glass, border: `1px solid ${theme.glassBorder}`, backdropFilter: "blur(12px)", marginBottom: 16, borderRadius: 10, overflow: "hidden" }}>
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${theme.border}`, fontSize: 12, fontWeight: 600, color: theme.text }}>{title}</div>
      <div style={{ padding: "16px" }}>{children}</div>
    </div>
  );
}

function Field({ theme, label, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 10, color: theme.textSecondary, letterSpacing: 1, marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}