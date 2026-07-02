import { useState, useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext";

const STORAGE_KEY = "pims_knowledge";

function loadDocs() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}

function saveDocs(docs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
}

function uid() {
  return crypto.randomUUID();
}

const CATEGORIES = ["Dosage", "Protocol", "General", "Storage", "Safety"];

const SEED_DOCS = [
  {
    id: "seed-cjc-ipa",
    title: "CJC-1295 (No DAC) + Ipamorelin Protocol",
    category: "Protocol",
    content: `CJC-1295 (No DAC) + Ipamorelin — Growth Hormone Stack

═══════════════════════════════════════════
  OVERVIEW
═══════════════════════════════════════════

CJC-1295 (no DAC) is a GHRH analog that amplifies GH release pulses. Ipamorelin is a selective GH secretagogue that triggers a clean GH pulse without spiking cortisol or prolactin. Together they amplify the body's natural pulsatile GH release.

- Half-life: ~30 min (both peptides)
- GH pulse amplification: 2-4x
- Minimum protocol: 90 days
- Administration: Subcutaneous (abdomen)

═══════════════════════════════════════════
  DOSING PROTOCOL
═══════════════════════════════════════════

┌─────────────────┬─────────────┬──────────────┐
│                 │ Month 1     │ Month 2+     │
├─────────────────┼─────────────┼──────────────┤
│ Dose per peptide│ 100 mcg     │ 200 mcg      │
│ Syringe draw    │ 10 units    │ 20 units     │
│ Frequency       │ 5 nights/wk │ 5 nights/wk  │
│ Timing          │ ~30min pre-bed              │
│ Site            │ SubQ (abdomen)              │
└─────────────────┴─────────────┴──────────────┘

Both peptides mixed in same syringe. One injection nightly.

═══════════════════════════════════════════
  RECONSTITUTION (if lyophilized)
═══════════════════════════════════════════

- Use bacteriostatic water (BAC water)
- Inject BAC water slowly down vial wall, not directly onto powder
- Swirl gently — do not shake
- Let sit 5-10 min until fully dissolved
- Store reconstituted in fridge (2-8°C)
- Use within 30 days once reconstituted

Typical concentration: 2 mg/mL (1 mL BAC per 2 mg vial per peptide)

═══════════════════════════════════════════
  TIMELINE — WHAT TO EXPECT
═══════════════════════════════════════════

Week 1: Improved sleep quality (most commonly reported early effect)
Week 4: Increased energy, better workout recovery
Week 8: Skin elasticity improvements, early body composition shifts
Week 12: Measurable body composition change (reduced visceral fat, improved lean mass)
Month 6: Full protocol benefits

═══════════════════════════════════════════
  SIDE EFFECTS & MANAGEMENT
═══════════════════════════════════════════

Water retention / facial puffiness — Common (15-25%), weeks 1-4
  → Self-resolving. Reduce sodium. Notify provider if >4 weeks

Increased hunger (Ipamorelin ghrelin effect) — Common (20-35%), ongoing
  → Expected mechanism effect. Meal-plan accordingly

Flushing / warmth post-injection — Uncommon (5-10%), 30-60 min post-injection
  → Brief, self-resolving. Inject into abdomen (not thigh)

Tingling in hands/wrists — Uncommon (5-10%), weeks 2-6
  → Carpal tunnel-like from GH elevation. Reduce dose if persistent

Fatigue / lethargy — Uncommon (<10%), first 1-2 weeks
  → Adaptation phase, typically resolves

═══════════════════════════════════════════
  OPTIMIZATION TIPS
═══════════════════════════════════════════

• Inject ~30 min before bed (aligns with natural GH release during deep sleep)
• Fast for 2+ hours before injection (insulin blunts GH release)
• No alcohol on injection nights (can reduce GH pulse by 50-75%)
• 5-on / 2-off schedule preserves receptor sensitivity
• Prioritize sleep hygiene — poor sleep undermines the primary mechanism

═══════════════════════════════════════════
  CYCLING
═══════════════════════════════════════════

Common practice: 90 days on protocol, then evaluate with physician.
Annual cycling (3 months on, 1 month off) is a common physician preference.
No strong evidence for mandatory cycling with no-DAC formulation.

═══════════════════════════════════════════
  STACKING
═══════════════════════════════════════════

Pairs well with: BPC-157, TB-500, MOTS-c, NAD+ therapy
Approach with caution: MK-677 (insulin resistance risk), GHRP-6 (more sides), exogenous HGH

═══════════════════════════════════════════
  REFERENCES
═══════════════════════════════════════════

Raun K, et al. Eur J Endocrinol. 1998 — Ipamorelin characterization
Teichman SL, et al. J Clin Endocrinol Metab. 2006 — CJC-1295 study
Source: RxPepsDirect clinical protocol guide`,
    created_at: 1720000000000,
    updated_at: 1720000000000
  }
];

export default function KnowledgeBase() {
  const { theme } = useTheme();
  const [docs, setDocs] = useState([]);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const [form, setForm] = useState({ title: "", category: "General", content: "" });

  useEffect(() => {
    let existing = loadDocs();
    if (existing.length === 0) {
      existing = SEED_DOCS;
      saveDocs(existing);
    }
    setDocs(existing);
  }, []);

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

  const persist = (updated) => { setDocs(updated); saveDocs(updated); };

  const openNew = () => {
    setForm({ title: "", category: "General", content: "" });
    setEditId(null);
    setShowForm(true);
  };

  const openEdit = (doc) => {
    setForm({ title: doc.title, category: doc.category, content: doc.content });
    setEditId(doc.id);
    setShowForm(true);
  };

  const save = () => {
    if (!form.title.trim()) return;
    if (editId) {
      persist(docs.map(d => d.id === editId ? { ...d, ...form, updated_at: Date.now() } : d));
    } else {
      persist([...docs, { id: uid(), ...form, created_at: Date.now(), updated_at: Date.now() }]);
    }
    setShowForm(false);
  };

  const del = (id) => {
    if (!confirm("Delete this document?")) return;
    persist(docs.filter(d => d.id !== id));
    if (expanded === id) setExpanded(null);
  };

  const filtered = docs.filter(d => {
    if (filterCat !== "all" && d.category !== filterCat) return false;
    if (search && !d.title.toLowerCase().includes(search.toLowerCase()) &&
        !d.content.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }).reverse();

  const Field = ({ label, children }) => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 10, color: theme.textSecondary, letterSpacing: 1, marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: theme.accent, letterSpacing: 3, marginBottom: 8 }}>KNOWLEDGE BASE</div>
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0, color: theme.text }}>Knowledge Base</h1>
        </div>
        <button style={btnPrimary} onClick={openNew}>+ New Document</button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <input placeholder="Search documents…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ padding: "8px 12px", background: theme.inputBg, border: `1px solid ${theme.inputBorder}`,
            color: theme.text, fontSize: 13, outline: "none", width: 260, borderRadius: 6 }} />
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          style={{ padding: "8px 12px", background: theme.inputBg, border: `1px solid ${theme.inputBorder}`,
            color: theme.text, fontSize: 13, outline: "none", borderRadius: 6 }}>
          <option value="all">All Categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <span style={{ fontSize: 12, color: theme.textMuted }}>{filtered.length} document{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {docs.length === 0 && (
        <div style={{ textAlign: "center", padding: 60, color: theme.textSecondary }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>📚</div>
          <div style={{ fontSize: 15, marginBottom: 8, color: theme.text }}>No documents yet</div>
          <div style={{ fontSize: 13 }}>Create internal knowledge documents — dosages, protocols, safety info, and more.</div>
        </div>
      )}

      {/* Document list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.map(doc => {
          const isExpanded = expanded === doc.id;
          return (
            <div key={doc.id} style={{
              background: theme.glass, border: `1px solid ${theme.glassBorder}`,
              backdropFilter: "blur(12px)", borderRadius: 10, overflow: "hidden"
            }}>
              <div style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                onClick={() => setExpanded(isExpanded ? null : doc.id)}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>{doc.title}</span>
                    <span style={{
                      fontSize: 10, padding: "2px 8px", borderRadius: 4, background: theme.accentGlass,
                      color: theme.accent, letterSpacing: 0.5
                    }}>{doc.category}</span>
                  </div>
                  <div style={{ fontSize: 11, color: theme.textMuted }}>
                    {new Date(doc.updated_at).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: theme.textMuted }}>
                  {isExpanded ? "▲" : "▼"}
                </div>
              </div>

              {isExpanded && (
                <div style={{ padding: "0 20px 14px", borderTop: g('border') }}>
                  <div style={{ padding: "12px 0", fontSize: 13, color: theme.text, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                    {doc.content}
                  </div>
                  <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                    <button onClick={() => openEdit(doc)} style={{ ...btnSecondary, padding: "5px 12px", fontSize: 11 }}>Edit</button>
                    <button onClick={() => del(doc.id)} style={{ ...btnSecondary, padding: "5px 12px", fontSize: 11, color: theme.danger, borderColor: theme.dangerBorder }}>Delete</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: theme.modalOverlay, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: theme.bgSecondary, border: `1px solid ${theme.border}`, borderRadius: 12, width: "100%", maxWidth: 640, maxHeight: "90vh", overflowY: "auto", padding: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: theme.text }}>{editId ? "Edit Document" : "New Document"}</div>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", color: theme.textSecondary, cursor: "pointer", fontSize: 18 }}>×</button>
            </div>

            <Field label="Title">
              <input style={inputStyle} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Document title" autoFocus />
            </Field>

            <Field label="Category">
              <select style={inputStyle} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>

            <Field label="Content">
              <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 200 }} rows={8} value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder="Write your document content here.&#10;&#10;Dosages, reconstitution steps, safety info, references…" />
            </Field>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 24 }}>
              <button style={btnSecondary} onClick={() => setShowForm(false)}>Cancel</button>
              <button style={btnPrimary} onClick={save}>{editId ? "Save Changes" : "Create Document"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
