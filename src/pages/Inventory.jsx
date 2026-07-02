import { useState, useEffect } from "react";
import { useData } from "../contexts/DataContext";
import { useTheme } from "../contexts/ThemeContext";
import * as api from "../utils/api";

export default function Inventory() {
  const { data, refreshData } = useData();
  const { theme } = useTheme();
  const [activeGroup, setActiveGroup] = useState(data.groups[0]?.id || null);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editGroup, setEditGroup] = useState(null);
  const [adjustItem, setAdjustItem] = useState(null);
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustNote, setAdjustNote] = useState("");

  const [groupForm, setGroupForm] = useState({ name: "", description: "" });
  const [itemForm, setItemForm] = useState({ name: "", sku: "", qty: "", unit: "vial", lowStockThreshold: 10, costPrice: "", salePrice: "" });
  // Keep the active tab valid: auto-select a group when one appears
   // (first group created, or after the previously-active one is deleted)
   useEffect(() => {
     if (data.groups.length === 0) return;
     if (!activeGroup || !data.groups.find(g => g.id === activeGroup)) {
       setActiveGroup(data.groups[0].id);
     }
   }, [data.groups]);

  const g = (k) => `1px solid ${theme.border}`;
  const inputStyle = {
    padding: "8px 10px", background: theme.inputBg, border: `1px solid ${theme.inputBorder}`,
    color: theme.text, fontSize: 13, outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box"
  };
  const btnPrimary = {
    padding: "8px 16px", background: theme.accent, border: "none", color: "#fff",
    fontSize: 12, fontWeight: 600, cursor: "pointer", letterSpacing: 0.5, borderRadius: 6
  };
  const btnSecondary = {
    padding: "8px 16px", background: "none", border: g('border'), color: theme.textSecondary,
    fontSize: 12, cursor: "pointer", borderRadius: 6
  };

  const groupItems = data.items.filter(i => i.groupId === activeGroup);

  const openNewGroup = () => { setGroupForm({ name: "", description: "" }); setEditGroup(null); setShowGroupModal(true); };
  const openEditGroup = (gr) => { setGroupForm({ name: gr.name, description: gr.description }); setEditGroup(gr); setShowGroupModal(true); };
  const openNewItem = () => { setItemForm({ name: "", sku: "", qty: "", unit: "vial", lowStockThreshold: 10, costPrice: "", salePrice: "" }); setEditItem(null); setShowItemModal(true); };
  const openEditItem = (item) => { setItemForm({ ...item }); setEditItem(item); setShowItemModal(true); };

  const saveGroup = async () => {
     if (!groupForm.name.trim()) return;
     try {
       let result;
       if (editGroup) result = await api.updateGroup(editGroup.id, groupForm);
       else result = await api.createGroup(groupForm);
       await refreshData();
       if (!editGroup && result?.id) setActiveGroup(result.id);
       setShowGroupModal(false);
     } catch (e) {
       console.error('Save group full error:', e);
       alert('Failed: ' + e.message + (e.data ? ' | Debug: ' + JSON.stringify(e.data) : ''));
     }
   };

  const deleteGroup = async (gid) => {
    if (!confirm("Delete this group and all its items?")) return;
    await api.deleteGroup(gid);
    await refreshData();
    if (activeGroup === gid) setActiveGroup(data.groups.find(g => g.id !== gid)?.id || null);
  };

  const saveItem = async () => {
    if (!itemForm.name || !itemForm.sku) return;
    try {
      const item = { groupId: activeGroup, ...itemForm, qty: Number(itemForm.qty), lowStockThreshold: Number(itemForm.lowStockThreshold), costPrice: parseFloat(itemForm.costPrice), salePrice: parseFloat(itemForm.salePrice) };
      if (editItem) await api.updateItem(editItem.id, item);
      else await api.createItem(item);
      await refreshData();
      setShowItemModal(false);
    } catch (e) {
      alert('Failed to save item: ' + e.message + ' — Check console.');
      console.error('Save item error:', e);
    }
  };

  const deleteItem = async (id) => {
    if (!confirm("Delete this item?")) return;
    await api.deleteItem(id);
    await refreshData();
  };

  const doAdjust = async () => {
    const delta = parseInt(adjustQty);
    if (isNaN(delta)) return;
    try {
      await api.adjustStock(adjustItem.id, delta, adjustNote || undefined);
      await refreshData();
      setAdjustItem(null);
      setAdjustQty("");
      setAdjustNote("");
    } catch (e) {
      alert('Failed to adjust stock: ' + e.message);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: theme.accent, letterSpacing: 3, marginBottom: 8 }}>STOCK</div>
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0, color: theme.text }}>Inventory</h1>
        </div>
        <button style={btnPrimary} onClick={openNewGroup}>+ New Group</button>
      </div>

      {/* Group Tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: g('border'), flexWrap: "wrap" }}>
        {data.groups.map(gr => {
          const count = data.items.filter(i => i.groupId === gr.id).length;
          const hasLow = data.items.filter(i => i.groupId === gr.id).some(i => i.qty <= i.lowStockThreshold);
          return (
            <button key={gr.id} onClick={() => setActiveGroup(gr.id)} style={{
              padding: "10px 20px", background: "none", border: "none", cursor: "pointer",
              color: activeGroup === gr.id ? theme.text : theme.textSecondary,
              borderBottom: `2px solid ${activeGroup === gr.id ? theme.accent : "transparent"}`,
              fontSize: 13, display: "flex", alignItems: "center", gap: 8
            }}>
              {gr.name}
              <span style={{ fontSize: 10, background: hasLow ? theme.dangerBg : theme.bgTertiary, color: hasLow ? theme.danger : theme.textSecondary, padding: "1px 5px", borderRadius: 3 }}>{count}</span>
            </button>
          );
        })}
      </div>

      {activeGroup && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
            <div>
              {data.groups.filter(gr => gr.id === activeGroup).map(gr => (
                <div key={gr.id}>
                  <span style={{ fontSize: 13, color: theme.textSecondary }}>{gr.description}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button style={btnSecondary} onClick={() => openEditGroup(data.groups.find(gr => gr.id === activeGroup))}>Edit Group</button>
              <button style={{ ...btnSecondary, color: theme.danger, borderColor: theme.dangerBorder }} onClick={() => deleteGroup(activeGroup)}>Delete Group</button>
              <button style={btnPrimary} onClick={openNewItem}>+ Add Item</button>
            </div>
          </div>

          {/* Items Table */}
          <div style={{ background: theme.glass, border: `1px solid ${theme.glassBorder}`, backdropFilter: "blur(12px)", borderRadius: 10, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: g('border') }}>
                  {["SKU", "Product Name", "QTY", "Unit", "Low Threshold", "Cost", "Sale Price", "Margin", ""].map(h => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, color: theme.textSecondary, letterSpacing: 1, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groupItems.length === 0 && (
                  <tr><td colSpan={9} style={{ padding: "32px", textAlign: "center", color: theme.textSecondary, fontSize: 13 }}>No items in this group. Add your first item.</td></tr>
                )}
                {groupItems.map(item => {
                  const isLow = item.qty <= item.lowStockThreshold;
                  const margin = item.costPrice > 0 ? Math.round(((item.salePrice - item.costPrice) / item.salePrice) * 100) : null;
                  return (
                    <tr key={item.id} style={{ borderBottom: g('border') }}>
                      <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: 12, color: theme.accent }}>{item.sku}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: theme.text }}>{item.name}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700, color: isLow ? theme.danger : theme.success }}>{item.qty}</span>
                        {isLow && <span style={{ fontSize: 9, color: theme.danger, marginLeft: 6, letterSpacing: 1 }}>LOW</span>}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 12, color: theme.textSecondary }}>{item.unit}</td>
                      <td style={{ padding: "12px 16px", fontSize: 12, color: theme.textSecondary, fontFamily: "monospace" }}>{item.lowStockThreshold}</td>
                      <td style={{ padding: "12px 16px", fontSize: 12, color: theme.textSecondary, fontFamily: "monospace" }}>£{Number(item.costPrice).toFixed(2)}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: theme.text, fontFamily: "monospace" }}>£{Number(item.salePrice).toFixed(2)}</td>
                      <td style={{ padding: "12px 16px", fontSize: 12, color: margin > 50 ? theme.success : margin > 30 ? theme.warning : theme.textSecondary }}>
                        {margin !== null ? `${margin}%` : "—"}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <button onClick={() => setAdjustItem(item)} style={{ ...btnSecondary, padding: "4px 10px", fontSize: 11 }}>Adjust</button>
                          <button onClick={() => openEditItem(item)} style={{ ...btnSecondary, padding: "4px 10px", fontSize: 11 }}>Edit</button>
                          <button onClick={() => deleteItem(item.id)} style={{ ...btnSecondary, padding: "4px 10px", fontSize: 11, color: theme.danger, borderColor: theme.dangerBorder }}>Del</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {data.groups.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px", color: theme.textSecondary }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>⊟</div>
          <div style={{ fontSize: 15, marginBottom: 8, color: theme.text }}>No groups yet</div>
          <div style={{ fontSize: 13 }}>Create a group (e.g. "Retatrutide") then add items within it.</div>
        </div>
      )}

      {/* Group Modal */}
      {showGroupModal && (
        <Modal theme={theme} title={editGroup ? "Edit Group" : "New Group"} onClose={() => setShowGroupModal(false)}>
          <Field theme={theme} label="Group Name"><input style={inputStyle} value={groupForm.name} onChange={e => setGroupForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Retatrutide" autoFocus /></Field>
          <Field theme={theme} label="Description"><input style={inputStyle} value={groupForm.description} onChange={e => setGroupForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description" /></Field>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 24 }}>
            <button style={btnSecondary} onClick={() => setShowGroupModal(false)}>Cancel</button>
            <button style={btnPrimary} onClick={saveGroup}>Save Group</button>
          </div>
        </Modal>
      )}

      {/* Item Modal */}
      {showItemModal && (
        <Modal theme={theme} title={editItem ? "Edit Item" : "Add Item"} onClose={() => setShowItemModal(false)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field theme={theme} label="Product Name"><input style={inputStyle} value={itemForm.name} onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Retatrutide 10mg" autoFocus /></Field>
            <Field theme={theme} label="SKU"><input style={inputStyle} value={itemForm.sku} onChange={e => setItemForm(f => ({ ...f, sku: e.target.value }))} placeholder="e.g. RETA-10" /></Field>
            <Field theme={theme} label="Quantity"><input style={inputStyle} type="number" value={itemForm.qty} onChange={e => setItemForm(f => ({ ...f, qty: e.target.value }))} /></Field>
            <Field theme={theme} label="Unit">
              <select style={inputStyle} value={itemForm.unit} onChange={e => setItemForm(f => ({ ...f, unit: e.target.value }))}>
                {["vial", "kit", "box", "unit", "sachet"].map(u => <option key={u}>{u}</option>)}
              </select>
            </Field>
            <Field theme={theme} label="Low Stock Threshold"><input style={inputStyle} type="number" value={itemForm.lowStockThreshold} onChange={e => setItemForm(f => ({ ...f, lowStockThreshold: e.target.value }))} /></Field>
            <Field theme={theme} label="Cost Price (£)"><input style={inputStyle} type="number" step="0.01" value={itemForm.costPrice} onChange={e => setItemForm(f => ({ ...f, costPrice: e.target.value }))} /></Field>
            <Field theme={theme} label="Sale Price (£)"><input style={inputStyle} type="number" step="0.01" value={itemForm.salePrice} onChange={e => setItemForm(f => ({ ...f, salePrice: e.target.value }))} /></Field>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 24 }}>
            <button style={btnSecondary} onClick={() => setShowItemModal(false)}>Cancel</button>
            <button style={btnPrimary} onClick={saveItem}>Save Item</button>
          </div>
        </Modal>
      )}

      {/* Adjust Modal */}
      {adjustItem && (
        <Modal theme={theme} title={`Adjust Stock — ${adjustItem.name}`} onClose={() => setAdjustItem(null)}>
          <div style={{ marginBottom: 16, padding: "12px", background: theme.bgTertiary, border: g('border'), borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: theme.textSecondary, marginBottom: 4 }}>CURRENT STOCK</div>
            <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: theme.accent }}>{adjustItem.qty} {adjustItem.unit}s</div>
          </div>
          <Field theme={theme} label="Adjustment (use + to add, - to remove)">
            <input style={inputStyle} type="number" value={adjustQty} onChange={e => setAdjustQty(e.target.value)} placeholder="+10 or -5" autoFocus />
          </Field>
          <Field theme={theme} label="Note (optional)">
            <input style={inputStyle} value={adjustNote} onChange={e => setAdjustNote(e.target.value)} placeholder="e.g. Restock delivery" />
          </Field>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 24 }}>
            <button style={btnSecondary} onClick={() => setAdjustItem(null)}>Cancel</button>
            <button style={btnPrimary} onClick={doAdjust}>Apply Adjustment</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ theme, title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: theme.modalOverlay, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: theme.bgSecondary, border: `1px solid ${theme.border}`, borderRadius: 12, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", padding: "28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: theme.text }}>{title}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: theme.textSecondary, cursor: "pointer", fontSize: 18 }}>×</button>
        </div>
        {children}
      </div>
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
