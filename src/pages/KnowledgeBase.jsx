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

const TEMPLATE_SECTIONS = [
  { key: "overview", label: "Overview", placeholder: "What is this peptide? How does it work? Key facts…" },
  { key: "dosing", label: "Dosing Protocol", placeholder: "Dose ranges, frequency, timing, injection site…" },
  { key: "reconstitution", label: "Reconstitution", placeholder: "BAC water amount, concentration, storage after reconstitution…" },
  { key: "timeline", label: "Timeline", placeholder: "What to expect at week 1, 4, 8, 12, etc…" },
  { key: "sideEffects", label: "Side Effects", placeholder: "List side effects with frequency, timing, and mitigation tips…" },
  { key: "cycling", label: "Cycling", placeholder: "On/off cycles, protocol length, receptor sensitivity…" },
  { key: "stacking", label: "Stacking", placeholder: "What pairs well, what to avoid, interactions…" },
];

const SEED_SECTIONS = [
  {
    heading: "Overview",
    body: `CJC-1295 (no DAC) is a GHRH analog that amplifies GH release pulses. Ipamorelin is a selective GH secretagogue that triggers a clean GH pulse without spiking cortisol or prolactin. Together they amplify the body's natural pulsatile GH release.

Half-life: ~30 min (both peptides)  |  GH pulse amplification: 2-4×  |  Minimum protocol: 90 days  |  Administration: Subcutaneous (abdomen)`
  },
  {
    heading: "Dosing Protocol",
    body: `┌─────────────────────┬─────────────────┬──────────────────┐
│                     │ Month 1         │ Month 2+         │
├─────────────────────┼─────────────────┼──────────────────┤
│ Dose per peptide    │ 100 mcg         │ 200 mcg          │
├─────────────────────┼─────────────────┼──────────────────┤
│ Syringe draw        │ 10 units (0.1mL)│ 20 units (0.2mL) │
├─────────────────────┼─────────────────┼──────────────────┤
│ Frequency           │ 5 nights / week │ 5 nights / week  │
├─────────────────────┼─────────────────┼──────────────────┤
│ Timing              │ ~30 min before bed                │
├─────────────────────┼─────────────────┼──────────────────┤
│ Injection site      │ Subcutaneous (abdomen)            │
└─────────────────────┴─────────────────┴──────────────────┘

Both peptides mixed in same syringe. One injection nightly.`
  },
  {
    heading: "Reconstitution",
    body: `- Use bacteriostatic water (BAC water)
- Inject BAC water slowly down vial wall, not directly onto powder
- Swirl gently — do not shake
- Let sit 5-10 min until fully dissolved
- Store reconstituted in fridge (2-8°C)
- Use within 30 days once reconstituted

Concentration: 2 mg/mL (1 mL BAC per 2 mg vial per peptide)`
  },
  {
    heading: "Timeline",
    body: `Week 1 — Improved sleep quality (most commonly reported early effect)
Week 4 — Increased energy, better workout recovery
Week 8 — Skin elasticity improvements, early body composition shifts
Week 12 — Measurable body composition change (reduced visceral fat, improved lean mass)
Month 6 — Full protocol benefits`
  },
  {
    heading: "Side Effects",
    body: `Water retention / facial puffiness — Common (15-25%), weeks 1-4
→ Self-resolving. Reduce sodium. Notify provider if persistent beyond week 4.

Increased hunger (Ipamorelin ghrelin effect) — Common (20-35%), ongoing
→ Expected mechanism effect. Meal-plan accordingly. Not a sign to discontinue.

Flushing / warmth post-injection — Uncommon (5-10%), 30-60 min post
→ Brief, self-resolving. Inject into abdomen (not thigh) to reduce flush.

Tingling in hands/wrists — Uncommon (5-10%), weeks 2-6
→ Carpal tunnel-like effect from GH elevation. Reduce dose if persistent.

Fatigue / initial lethargy — Uncommon (<10%), first 1-2 weeks
→ Adaptation phase. Typically resolves within 2 weeks.`
  },
  {
    heading: "Cycling",
    body: `Common practice: 90 days on protocol, then evaluate with physician. Annual cycling (3 months on, 1 month off) is a common physician preference. No strong evidence for mandatory cycling with no-DAC formulation.`
  },
  {
    heading: "Stacking",
    body: `Pairs well with: BPC-157, TB-500, MOTS-c, NAD+ therapy
Use caution: MK-677 (insulin resistance risk), GHRP-6 (more sides), exogenous HGH`
  }
];

// ── Content renderer ─────────────────────────────────────────

function isRuler(line) {
  return /^[═▔▁─━]+$/.test(line.trim()) && line.trim().length > 5;
}
function isTableBorder(line) {
  return /^[┌├└┐┤┘┴┬┼─╌]+/.test(line.trim());
}
function isTableRow(line) {
  return line.trimStart().startsWith("│");
}
function isBullet(line) {
  return /^[•\-]\s/.test(line.trim());
}
function isNote(line) {
  return line.trimStart().startsWith("→");
}
function hasPipes(line) {
  return line.includes("|") && !line.trimStart().startsWith("→") && !line.trimStart().startsWith("│");
}

function parseContent(text) {
  const lines = text.split("\n");
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) { i++; continue; }

    if (isRuler(line)) {
      const headerLine = lines[i + 1]?.trim();
      const closingRuler = lines[i + 2] && isRuler(lines[i + 2]);
      if (headerLine && closingRuler) {
        blocks.push({ type: "section", text: headerLine.replace(/^#\s*/, "") });
        i += 3;
        continue;
      }
    }

    if (isTableBorder(line)) {
      const tableRows = [];
      while (i < lines.length && (isTableBorder(lines[i]) || isTableRow(lines[i]))) {
        if (isTableRow(lines[i])) {
          const cells = lines[i].split("│").slice(1, -1).map(c => c.trim());
          if (cells.length > 0) tableRows.push({ cells });
        }
        i++;
      }
      if (tableRows.length > 0) {
        const header = tableRows[0]?.cells?.length > 1 ? tableRows[0] : null;
        const body = header ? tableRows.slice(1) : tableRows;
        blocks.push({ type: "table", header, body });
        continue;
      }
    }

    if (isBullet(trimmed)) {
      const items = [];
      while (i < lines.length && isBullet(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[•\-]\s*/, ""));
        i++;
      }
      blocks.push({ type: "bullets", items });
      continue;
    }

    if (isNote(trimmed)) {
      const notes = [];
      while (i < lines.length && isNote(lines[i].trim())) {
        notes.push(lines[i].trim().replace(/^→\s*/, ""));
        i++;
      }
      blocks.push({ type: "notes", items: notes });
      continue;
    }

    if (hasPipes(trimmed)) {
      const parts = trimmed.split("|").map(s => s.trim()).filter(Boolean);
      blocks.push({ type: "stats", items: parts });
      i++;
      continue;
    }

    const paraLines = [];
    while (i < lines.length) {
      const l = lines[i].trim();
      if (!l || isBullet(l) || isNote(l) || isTableBorder(l) || isTableRow(l) || isRuler(l) || hasPipes(l)) break;
      paraLines.push(l);
      i++;
    }
    if (paraLines.length > 0) {
      blocks.push({ type: "paragraph", text: paraLines.join(" ") });
    }
  }
  return blocks;
}

function StatChips({ items, theme }) {
  const colors = [theme.accent, theme.success, theme.warning, theme.danger];
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
      {items.map((item, idx) => {
        const [label, ...rest] = item.split(":");
        const value = rest.join(":").trim();
        return (
          <div key={idx} style={{
            flex: "1 1 160px", background: theme.bgTertiary, border: `1px solid ${theme.border}`,
            borderRadius: 8, padding: "12px 14px"
          }}>
            <div style={{ fontSize: 9, color: colors[idx % colors.length], letterSpacing: 1, marginBottom: 4, textTransform: "uppercase" }}>{label.trim()}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>{value}</div>
          </div>
        );
      })}
    </div>
  );
}

function RichContent({ text, theme }) {
  const blocks = parseContent(text);
  const g = (k) => `1px solid ${theme.border}`;

  return (
    <div>
      {blocks.map((block, idx) => {
        switch (block.type) {
          case "section":
            return (
              <div key={idx} style={{ marginBottom: 16, marginTop: idx > 0 ? 24 : 0, borderBottom: `1px solid ${theme.border}`, paddingBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: theme.accent, letterSpacing: 1.5, textTransform: "uppercase" }}>{block.text}</div>
              </div>
            );
          case "paragraph":
            return <p key={idx} style={{ fontSize: 13, color: theme.text, lineHeight: 1.7, margin: "0 0 12px 0" }}>{block.text}</p>;
          case "table":
            return (
              <div key={idx} style={{ marginBottom: 16, borderRadius: 8, overflow: "hidden", border: g('border') }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  {block.header && (
                    <thead>
                      <tr style={{ background: theme.accentGlass }}>
                        {block.header.cells.map((cell, ci) => (
                          <th key={ci} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10, color: theme.accent, letterSpacing: 1, fontWeight: 600, borderBottom: g('border') }}>{cell}</th>
                        ))}
                      </tr>
                    </thead>
                  )}
                  <tbody>
                    {block.body.map((row, ri) => (
                      <tr key={ri} style={{ background: ri % 2 === 0 ? "transparent" : theme.bgTertiary }}>
                        {row.cells.map((cell, ci) => (
                          <td key={ci} style={{ padding: "10px 14px", fontSize: 12, color: ci === 0 ? theme.textSecondary : theme.text, fontWeight: ci === 0 ? 600 : 400, fontFamily: ci > 0 ? "'JetBrains Mono', monospace" : "inherit", borderBottom: ri < block.body.length - 1 ? g('border') : "none" }}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "bullets":
            return (
              <div key={idx} style={{ marginBottom: 12 }}>
                {block.items.map((item, bi) => (
                  <div key={bi} style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 13, color: theme.text, lineHeight: 1.6 }}>
                    <span style={{ color: theme.accent, flexShrink: 0 }}>•</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            );
          case "notes":
            return (
              <div key={idx} style={{ marginBottom: 12, marginLeft: 8, borderLeft: `2px solid ${theme.accent}30`, paddingLeft: 12 }}>
                {block.items.map((item, ni) => (
                  <div key={ni} style={{ fontSize: 12, color: theme.textSecondary, lineHeight: 1.6, marginBottom: 4 }}>{item}</div>
                ))}
              </div>
            );
          case "stats":
            return <StatChips key={idx} items={block.items} theme={theme} />;
          default:
            return null;
        }
      })}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────

function emptyForm() {
  const obj = {};
  TEMPLATE_SECTIONS.forEach(s => obj[s.key] = "");
  return obj;
}

export default function KnowledgeBase() {
  const { theme } = useTheme();
  const [docs, setDocs] = useState([]);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [formTitle, setFormTitle] = useState("");
  const [formCat, setFormCat] = useState("General");
  const [formSections, setFormSections] = useState(emptyForm());

  useEffect(() => {
    let existing = loadDocs();
    if (existing.length === 0) {
      existing = [{ id: "seed-cjc-ipa", title: "CJC-1295 (No DAC) + Ipamorelin Protocol", category: "Protocol", sections: SEED_SECTIONS, created_at: Date.now(), updated_at: Date.now() }];
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
  const textareaStyle = {
    ...inputStyle, resize: "vertical", minHeight: 80, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, lineHeight: 1.5
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
    setFormTitle("");
    setFormCat("General");
    setFormSections(emptyForm());
    setEditId(null);
    setShowForm(true);
  };

  const openEdit = (doc) => {
    setFormTitle(doc.title);
    setFormCat(doc.category);
    const vals = emptyForm();
    if (doc.sections) {
      doc.sections.forEach(s => {
        const match = TEMPLATE_SECTIONS.find(t => t.label === s.heading);
        if (match) vals[match.key] = s.body;
      });
    }
    setFormSections(vals);
    setEditId(doc.id);
    setShowForm(true);
  };

  const save = () => {
    if (!formTitle.trim()) return;
    const sections = TEMPLATE_SECTIONS
      .filter(t => formSections[t.key]?.trim())
      .map(t => ({ heading: t.label, body: formSections[t.key].trim() }));

    if (!sections.length) { alert("Fill in at least one section."); return; }

    const now = Date.now();
    if (editId) {
      persist(docs.map(d => d.id === editId ? { ...d, title: formTitle, category: formCat, sections, updated_at: now } : d));
    } else {
      persist([...docs, { id: uid(), title: formTitle, category: formCat, sections, created_at: now, updated_at: now }]);
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
    if (search) {
      const q = search.toLowerCase();
      if (d.title.toLowerCase().includes(q)) return true;
      const body = (d.sections || []).map(s => s.body).join(" ").toLowerCase();
      if (body.includes(q)) return true;
      return false;
    }
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
      {/* Header */}
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
          style={{ padding: "8px 12px", background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.text, fontSize: 13, outline: "none", width: 260, borderRadius: 6 }} />
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          style={{ padding: "8px 12px", background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, color: theme.text, fontSize: 13, outline: "none", borderRadius: 6 }}>
          <option value="all" style={{ background: theme.bgSecondary, color: theme.text }}>All Categories</option>
          {CATEGORIES.map(c => <option key={c} style={{ background: theme.bgSecondary, color: theme.text }}>{c}</option>)}
        </select>
        <span style={{ fontSize: 12, color: theme.textMuted }}>{filtered.length} document{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Empty state */}
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
          const sections = doc.sections || [];
          const preview = sections[0]?.body ? sections[0].body.slice(0, 100) + "…" : "";

          return (
            <div key={doc.id} style={{ background: theme.glass, border: `1px solid ${theme.glassBorder}`, backdropFilter: "blur(12px)", borderRadius: 10, overflow: "hidden" }}>
              {/* Header row */}
              <div style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                onClick={() => setExpanded(isExpanded ? null : doc.id)}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: theme.text }}>{doc.title}</span>
                    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: theme.accentGlass, color: theme.accent, letterSpacing: 0.5 }}>{doc.category}</span>
                  </div>
                  <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>
                    {sections.length} section{sections.length !== 1 ? "s" : ""} · {new Date(doc.updated_at).toLocaleDateString()}
                  </div>
                  {!isExpanded && preview && (
                    <div style={{ fontSize: 12, color: theme.textSecondary, marginTop: 6, lineHeight: 1.4 }}>{preview}</div>
                  )}
                </div>
                <div style={{ fontSize: 12, color: theme.textMuted, marginLeft: 12 }}>{isExpanded ? "▲" : "▼"}</div>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div style={{ borderTop: g('border') }}>
                  <div style={{ padding: "20px" }}>
                    {sections.map((sec, si) => (
                      <div key={si} style={{ marginBottom: si < sections.length - 1 ? 28 : 0 }}>
                        <div style={{ marginBottom: 12, borderBottom: `1px solid ${theme.border}`, paddingBottom: 8 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: theme.accent, letterSpacing: 1.5, textTransform: "uppercase" }}>{sec.heading}</div>
                        </div>
                        <RichContent text={sec.body} theme={theme} />
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: "10px 20px", borderTop: g('border'), display: "flex", gap: 6, justifyContent: "flex-end" }}>
                    <button onClick={() => openEdit(doc)} style={{ ...btnSecondary, padding: "5px 12px", fontSize: 11 }}>Edit</button>
                    <button onClick={() => del(doc.id)} style={{ ...btnSecondary, padding: "5px 12px", fontSize: 11, color: theme.danger, borderColor: theme.dangerBorder }}>Delete</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Create / Edit Modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: theme.modalOverlay, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: theme.bgSecondary, border: `1px solid ${theme.border}`, borderRadius: 12, width: "100%", maxWidth: 720, maxHeight: "95vh", overflowY: "auto", padding: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: theme.text }}>{editId ? "Edit Document" : "New Document"}</div>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", color: theme.textSecondary, cursor: "pointer", fontSize: 18 }}>×</button>
            </div>

            <Field label="Title">
              <input style={inputStyle} value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="e.g. BPC-157 Protocol" autoFocus />
            </Field>

            <Field label="Category">
              <select style={inputStyle} value={formCat} onChange={e => setFormCat(e.target.value)}>
                {CATEGORIES.map(c => <option key={c} style={{ background: theme.bgSecondary, color: theme.text }}>{c}</option>)}
              </select>
            </Field>

            <div style={{ marginTop: 20, marginBottom: 12, fontSize: 12, color: theme.textSecondary, borderBottom: g('border'), paddingBottom: 8 }}>
              SECTIONS — fill in what you need, leave blank what you don't
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {TEMPLATE_SECTIONS.map(t => (
                <div key={t.key} style={{ border: `1px solid ${theme.border}`, borderRadius: 6, overflow: "hidden" }}>
                  <div style={{
                    padding: "8px 12px", fontSize: 12, fontWeight: 600, color: theme.text,
                    background: theme.bgTertiary, display: "flex", alignItems: "center", gap: 8
                  }}>
                    <span style={{ color: formSections[t.key]?.trim() ? theme.accent : theme.textMuted }}>
                      {formSections[t.key]?.trim() ? "●" : "○"}
                    </span>
                    {t.label}
                  </div>
                  <div style={{ padding: "8px 12px" }}>
                    <textarea style={textareaStyle} rows={4} value={formSections[t.key] || ""}
                      onChange={e => setFormSections(f => ({ ...f, [t.key]: e.target.value }))}
                      placeholder={t.placeholder} />
                    <div style={{ fontSize: 10, color: theme.textMuted, marginTop: 4 }}>
                      Supports: • bullets · → notes · ┌──┐ tables · label: value | chips
                    </div>
                  </div>
                </div>
              ))}
            </div>

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
