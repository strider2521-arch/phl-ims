import { useState } from "react";
import { useTheme } from "../contexts/ThemeContext";

const STORAGE_KEY = 'pims_settings';

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch { return {}; }
}

function saveSettings(s) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

const inputStyle = (theme) => ({
  padding: "8px 10px", background: theme.inputBg, border: `1px solid ${theme.inputBorder}`,
  color: theme.text, fontSize: 13, outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box", borderRadius: 6
});

export default function Settings() {
  const { theme } = useTheme();
  const settings = loadSettings();
  const [logo, setLogo] = useState(settings.logo || '');
  const [companyName, setCompanyName] = useState(settings.companyName || 'Prime Helix');
  const [companyEmail, setCompanyEmail] = useState(settings.companyEmail || '');
  const [companyAddress, setCompanyAddress] = useState(settings.companyAddress || '');
  const [defaultNotes, setDefaultNotes] = useState(settings.defaultNotes || '');
  const [saved, setSaved] = useState(false);

  function handleLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setLogo(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  function handleSave() {
    saveSettings({ logo, companyName, companyEmail, companyAddress, defaultNotes });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const g = (k) => `1px solid ${theme.border}`;
  const btn = {
    padding: "8px 16px", background: theme.accent, border: "none", color: "#fff",
    fontSize: 12, fontWeight: 600, cursor: "pointer", borderRadius: 6
  };
  const btnSecondary = {
    padding: "8px 16px", background: "none", border: g('border'), color: theme.textSecondary,
    fontSize: 12, cursor: "pointer", borderRadius: 6
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, color: theme.accent, letterSpacing: 3, marginBottom: 8 }}>CONFIGURATION</div>
        <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0, color: theme.text }}>Settings</h1>
      </div>

      {/* Company Details */}
      <Section theme={theme} title="Company Details">
        <Field theme={theme} label="Company Name"><input style={inputStyle(theme)} value={companyName} onChange={e => setCompanyName(e.target.value)} /></Field>
        <Field theme={theme} label="Email"><input style={inputStyle(theme)} type="email" value={companyEmail} onChange={e => setCompanyEmail(e.target.value)} placeholder="company@example.com" /></Field>
        <Field theme={theme} label="Address"><input style={inputStyle(theme)} value={companyAddress} onChange={e => setCompanyAddress(e.target.value)} placeholder="Full address" /></Field>
      </Section>

      {/* Logo */}
      <Section theme={theme} title="Invoice Logo">
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          {logo ? (
            <img src={logo} alt="Company logo" style={{ maxWidth: 120, maxHeight: 60, objectFit: "contain" }} />
          ) : (
            <div style={{ width: 120, height: 60, background: theme.bgTertiary, border: `1px dashed ${theme.border}`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: theme.textSecondary }}>No logo</div>
          )}
          <label style={{ ...btnSecondary, cursor: "pointer" }}>
            {logo ? 'Change' : 'Upload'} Logo
            <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: "none" }} />
          </label>
          {logo && <button style={{ ...btnSecondary, color: theme.danger, borderColor: theme.dangerBorder }} onClick={() => setLogo('')}>Remove</button>}
        </div>
      </Section>

      {/* Invoice Defaults */}
      <Section theme={theme} title="Invoice Defaults">
        <Field theme={theme} label="Default Notes (appears on every new invoice)">
          <textarea style={{ ...inputStyle(theme), resize: "vertical" }} rows={3} value={defaultNotes} onChange={e => setDefaultNotes(e.target.value)} placeholder="Payment terms, delivery notes..." />
        </Field>
      </Section>

      {saved && <div style={{ padding: "12px", background: theme.successBg, border: `1px solid ${theme.successBorder}`, color: theme.success, fontSize: 13, marginBottom: 16, borderRadius: 8 }}>✓ Settings saved</div>}
      <button style={btn} onClick={handleSave}>Save Settings</button>
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