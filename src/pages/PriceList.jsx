import { useState } from "react";
import { useData } from "../contexts/DataContext";
import { useTheme } from "../contexts/ThemeContext";

export default function PriceList() {
  const { data } = useData();
  const { theme } = useTheme();
  const [search, setSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState("all");

  const g = (k) => `1px solid ${theme.border}`;

  // Build group-indexed items, respecting search + group filter
  const groupsMap = {};
  for (const item of data.items) {
    if (search && !item.name.toLowerCase().includes(search.toLowerCase()) && !item.sku.toLowerCase().includes(search.toLowerCase())) continue;
    if (activeGroup !== "all" && item.groupId !== activeGroup) continue;
    if (!groupsMap[item.groupId]) groupsMap[item.groupId] = [];
    groupsMap[item.groupId].push(item);
  }

  const groupEntries = Object.entries(groupsMap).sort(([a], [b]) => {
    const ga = data.groups.find(gr => gr.id === a);
    const gb = data.groups.find(gr => gr.id === b);
    return (ga?.name || "").localeCompare(gb?.name || "");
  });

  const groupFilterOptions = data.groups.filter(gr => groupsMap[gr.id]);

  const styles = `
    .pl-container { max-width: 1200px; margin: 0 auto; }
    .pl-header { margin-bottom: 28px; display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 12px; }
    .pl-title-section {}
    .pl-label { font-size: 11px; color: ${theme.accent}; letter-spacing: 3px; margin-bottom: 8px; }
    .pl-title { font-size: 24px; font-weight: 600; margin: 0; color: ${theme.text}; }
    .pl-search { padding: 8px 14px; background: ${theme.inputBg}; border: 1px solid ${theme.inputBorder}; color: ${theme.text}; font-size: 13px; outline: none; border-radius: 8px; width: 220px; font-family: inherit; }
    .pl-search:focus { border-color: ${theme.accent}; }
    .pl-search::placeholder { color: ${theme.textMuted}; }
    .pl-filters { display: flex; gap: 8px; margin-bottom: 24px; flex-wrap: wrap; }
    .pl-filter-btn { padding: 7px 16px; background: transparent; border: 1px solid ${theme.border}; color: ${theme.textSecondary}; font-size: 12px; cursor: pointer; border-radius: 20px; font-family: inherit; transition: all 0.15s; }
    .pl-filter-btn.active { background: ${theme.accent}; color: #fff; border-color: ${theme.accent}; }
    .pl-filter-btn:hover:not(.active) { background: ${theme.glassHover}; }
    .pl-group-section { margin-bottom: 32px; }
    .pl-group-header { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; padding-bottom: 10px; border-bottom: ${g('border')}; }
    .pl-group-name { font-size: 16px; font-weight: 600; color: ${theme.text}; }
    .pl-group-count { font-size: 11px; color: ${theme.textSecondary}; background: ${theme.bgTertiary}; padding: 2px 8px; border-radius: 10px; }
    .pl-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
    .pl-card { background: ${theme.glass}; border: 1px solid ${theme.glassBorder}; border-radius: 10px; padding: 18px; transition: all 0.2s; }
    .pl-card:hover { background: ${theme.glassHover}; border-color: ${theme.border}; }
    .pl-card-sku { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: ${theme.accent}; letter-spacing: 1px; margin-bottom: 6px; text-transform: uppercase; }
    .pl-card-name { font-size: 14px; font-weight: 500; color: ${theme.text}; margin-bottom: 12px; line-height: 1.3; }
    .pl-card-price-row { display: flex; align-items: baseline; justify-content: space-between; }
    .pl-card-price { font-family: 'JetBrains Mono', monospace; font-size: 22px; font-weight: 700; color: ${theme.text}; }
    .pl-card-unit { font-size: 11px; color: ${theme.textSecondary}; }
    .pl-empty { text-align: center; padding: 60px; color: ${theme.textSecondary}; }
    @media (max-width: 900px) {
      .pl-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 600px) {
      .pl-header { flex-direction: column; align-items: flex-start; }
      .pl-search { width: 100%; box-sizing: border-box; }
      .pl-grid { grid-template-columns: 1fr; }
      .pl-title { font-size: 20px; }
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <div className="pl-container">
        {/* Header */}
        <div className="pl-header">
          <div className="pl-title-section">
            <div className="pl-label">PRICING</div>
            <h1 className="pl-title">Price List</h1>
          </div>
          <input
            className="pl-search"
            type="text"
            placeholder="Search by name or SKU..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Group Filter Pills */}
        {data.groups.length > 0 && (
          <div className="pl-filters">
            <button
              className={`pl-filter-btn ${activeGroup === "all" ? "active" : ""}`}
              onClick={() => setActiveGroup("all")}
            >
              All Groups
            </button>
            {data.groups.map(gr => (
              <button
                key={gr.id}
                className={`pl-filter-btn ${activeGroup === gr.id ? "active" : ""}`}
                onClick={() => setActiveGroup(gr.id)}
              >
                {gr.name}
              </button>
            ))}
          </div>
        )}

        {/* Grouped Listings */}
        {groupEntries.length === 0 ? (
          <div className="pl-empty">
            <div style={{ fontSize: 32, marginBottom: 12 }}>🏷️</div>
            <div style={{ fontSize: 15, color: theme.text }}>No items found</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>{search ? "Try a different search term." : "Add items to your inventory first."}</div>
          </div>
        ) : (
          groupEntries.map(([groupId, items]) => {
            const group = data.groups.find(gr => gr.id === groupId);
            return (
              <div key={groupId} className="pl-group-section">
                <div className="pl-group-header">
                  <span className="pl-group-name">{group?.name || "Ungrouped"}</span>
                  <span className="pl-group-count">{items.length} product{items.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="pl-grid">
                  {items.sort((a, b) => a.name.localeCompare(b.name)).map(item => (
                    <div key={item.id} className="pl-card">
                      <div className="pl-card-sku">{item.sku}</div>
                      <div className="pl-card-name">{item.name}</div>
                      <div className="pl-card-price-row">
                        <span className="pl-card-price">£{Number(item.salePrice).toFixed(2)}</span>
                        <span className="pl-card-unit">per {item.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}