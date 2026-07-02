import { useState, useEffect } from "react";
import { useData } from "../contexts/DataContext";
import { useTheme } from "../contexts/ThemeContext";
import * as api from "../utils/api";

export default function Protocols() {
  const { data } = useData();
  const { theme } = useTheme();
  const [protocols, setProtocols] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editProto, setEditProto] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const [form, setForm] = useState({
    itemId: "", name: "", description: "", reconstitution: "",
    dosage: "", administration: "", storage: "", references: ""
  });

  const loadProtocols = async () => {
    try {
      const p = await api.getProtocols();
      setProtocols(p);
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { loadProtocols(); }, []);

  const g = (k) => `1px solid ${theme.border}`;
  const inputStyle = {
    padding: "8px 10px", background: theme.inputBg, border: `1px solid ${theme.inputBorder}`,
    color: theme.text, fontSize: 13, outline: "none", fontFamily: "inherit", width: "100%",
    boxSizing: "border-box", borderRadius: 6
  };
  const btnPrimary = {
    padding: "8px 16px", background: theme.accent, border: "none", color: "#fff",
    fontSize: 12, fontWeight: 600, cursor: "pointer", borderRadius: 6
  };
  const btnSecondary = {
    padding: "8px 16px", background: "none", border: g('border'), color: theme.textSecondary,
    fontSize: 12, cursor: "pointer", borderRadius: 6
  };

  const openNew = () => {
    setForm({ itemId: "", name: "", description: "", reconstitution: "", dosage: "", administration: "", storage: "", references: "" });
    setEditProto(null);
    setShowForm(true);
  };

  const openEdit = (p) => {
    setForm({
      itemId: p.item_id || "", name: p.name || "", description: p.description || "",
      reconstitution: p.reconstitution || "", dosage: p.dosage || "",
      administration: p.administration || "", storage: p.storage || "", references: p.references || ""
    });
    setEditProto(p);
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name.trim()) return;
    try {
      if (editProto) {
        await api.updateProtocol(editProto.id, form);
      } else {
        await api.createProtocol(form);
      }
      setShowForm(false);
      await loadProtocols();
    } catch (e) {
      alert('Failed: ' + e.message);
    }
  };

  const del = async (id) => {
    if (!confirm("Delete this protocol entry?")) return;
    await api.deleteProtocol(id);
    await loadProtocols();
  };

  const section = (label, content) => {
    if (!content) return null;
    return (
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: theme.accent, letterSpacing: 1, marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 13, color: theme.text, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{content}</div>
      </div>
    );
  };

  const unusedItems = data.items.filter(i => !protocols.some(p => p.item_id === i.id));

  const Field = ({ label, children }) => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 10, color: theme.textSecondary, letterSpacing: 1, marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );

  if (loading) return null;

  return (
    <div>
      <div style={{ marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: theme.accent, letterSpacing: 3, marginBottom: 8 }}>REFERENCE</div>
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0, color: theme.text }}>Protocols</h1>
        </div>
        <button style={btnPrimary} onClick={openNew}>+ New Protocol</button>
      </div>

      {protocols.length === 0 && (
        <div style={{ textAlign: "center", padding: 60, color: theme.textSecondary }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>◈</div>
          <div style={{ fontSize: 15, marginBottom: 8, color: theme.text }}>No protocols yet</div>
          <div style={{ fontSize: 13 }}>Create protocol documents for your stocked peptides with dosing, reconstitution, and storage info.</div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 16 }}>
        {protocols.map(p => {
          const isExpanded = expanded === p.id;
          const linkedItem = data.items.find(i => i.id === p.item_id);
          return (
            <div key={p.id} style={{
              background: theme.glass, border: `1px solid ${theme.glassBorder}`,
              backdropFilter: "blur(12px)", borderRadius: 10, overflow: "hidden"
            }}>
              {/* Header */}
              <div style={{ padding: "16px 20px", borderBottom: g('border') }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: theme.text, marginBottom: 4 }}>{p.name}</div>
                    {linkedItem && (
                      <div style={{ fontSize: 11, color: theme.accent, fontFamily: "monospace" }}>{linkedItem.sku}</div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => openEdit(p)} style={{ ...btnSecondary, padding: "4px 10px", fontSize: 11 }}>Edit</button>
                    <button onClick={() => del(p.id)} style={{ ...btnSecondary, padding: "4px 10px", fontSize: 11, color: theme.danger, borderColor: theme.dangerBorder }}>Del</button>
                  </div>
                </div>
                {p.description && (
                  <div style={{ fontSize: 12, color: theme.textSecondary, marginTop: 8, lineHeight: 1.5 }}>
                    {isExpanded ? p.description : p.description.length > 120 ? p.description.slice(0, 120) + '…' : p.description}
                  </div>
                )}
              </div>

              {/* Collapsed summary */}
              {!isExpanded && (
                <div style={{ padding: "12px 20px", display: "flex", gap: 16, flexWrap: "wrap" }}>
                  {p.dosage && <Chip theme={theme} label="Dosage" value={p.dosage.length > 30 ? p.dosage.slice(0, 30) + '…' : p.dosage} />}
                  {p.administration && <Chip theme={theme} label="ROA" value={p.administration} />}
                  {p.reconstitution && <Chip theme={theme} label="Reconstitution" value="Available" />}
                </div>
              )}

              {/* Expanded detail */}
              {isExpanded && (
                <div style={{ padding: "16px 20px", borderTop: g('border'), background: theme.bgTertiary }}>
                  {section("Reconstitution", p.reconstitution)}
                  {section("Dosage Suggestions", p.dosage)}
                  {section("Administration", p.administration)}
                  {section("Storage", p.storage)}
                  {section("References", p.references)}
                  {!p.reconstitution && !p.dosage && !p.administration && !p.storage && !p.references && (
                    <div style={{ fontSize: 12, color: theme.textMuted, textAlign: "center", padding: 12 }}>No details added yet — click Edit to add content.</div>
                  )}
                </div>
              )}

              <div style={{ padding: "8px 20px", borderTop: g('border'), textAlign: "center" }}>
                <button onClick={() => setExpanded(isExpanded ? null : p.id)} style={{
                  background: "none", border: "none", color: theme.accent, fontSize: 11,
                  cursor: "pointer", padding: "4px 0", width: "100%"
                }}>
                  {isExpanded ? "▲ Show less" : "▼ Show details"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: theme.modalOverlay, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: theme.bgSecondary, border: `1px solid ${theme.border}`, borderRadius: 12, width: "100%", maxWidth: 640, maxHeight: "90vh", overflowY: "auto", padding: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: theme.text }}>{editProto ? "Edit Protocol" : "New Protocol"}</div>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", color: theme.textSecondary, cursor: "pointer", fontSize: 18 }}>×</button>
            </div>

            {!editProto && (
              <Field label="Link to Stock Item">
                <select style={inputStyle} value={form.itemId} onChange={e => {
                  const item = data.items.find(i => i.id === e.target.value);
                  setForm(f => ({ ...f, itemId: e.target.value, name: item ? item.name : "" }));
                }}>
                  <option value="">— Select an item —</option>
                  {data.items.map(i => (
                    <option key={i.id} value={i.id} disabled={protocols.some(p => p.item_id === i.id)}>
                      {i.name} ({i.sku}) {protocols.some(p => p.item_id === i.id) ? '— already has protocol' : ''}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            <Field label="Protocol Name">
              <input style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Peptide name" />
            </Field>

            <Field label="Description / Overview">
              <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 60 }} rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief overview of the peptide…" />
            </Field>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Reconstitution">
                <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 50 }} rows={2} value={form.reconstitution} onChange={e => setForm(f => ({ ...f, reconstitution: e.target.value }))} placeholder="e.g. Add 2ml bacteriostatic water…" />
              </Field>
              <Field label="Dosage Suggestions">
                <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 50 }} rows={2} value={form.dosage} onChange={e => setForm(f => ({ ...f, dosage: e.target.value }))} placeholder="e.g. 250mcg every other day…" />
              </Field>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Administration / ROA">
                <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 50 }} rows={2} value={form.administration} onChange={e => setForm(f => ({ ...f, administration: e.target.value }))} placeholder="e.g. Subcutaneous injection" />
              </Field>
              <Field label="Storage">
                <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 50 }} rows={2} value={form.storage} onChange={e => setForm(f => ({ ...f, storage: e.target.value }))} placeholder="e.g. Store at 2-8°C" />
              </Field>
            </div>

            <Field label="References / Sources">
              <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 50 }} rows={2} value={form.references} onChange={e => setForm(f => ({ ...f, references: e.target.value }))} placeholder="Links to studies, sources…" />
            </Field>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 24 }}>
              <button style={btnSecondary} onClick={() => setShowForm(false)}>Cancel</button>
              <button style={btnPrimary} onClick={save}>{editProto ? "Save Changes" : "Create Protocol"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Chip({ theme, label, value }) {
  return (
    <div style={{ fontSize: 11, background: theme.bgTertiary, border: `1px solid ${theme.border}`, borderRadius: 6, padding: "4px 10px", color: theme.textSecondary }}>
      <span style={{ color: theme.accent, marginRight: 4 }}>{label}:</span> {value}
    </div>
  );
}
