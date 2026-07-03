import { useState, useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext";
import * as api from "../utils/api";

const STORAGE_KEY = 'pims_settings';

function loadLocal() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
}

function saveLocal(s) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

const inputStyle = (theme) => ({
  padding: "8px 10px", background: theme.inputBg, border: `1px solid ${theme.inputBorder}`,
  color: theme.text, fontSize: 13, outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box", borderRadius: 6
});

export default function Settings() {
  const { theme } = useTheme();
  const local = loadLocal();
  const [logo, setLogo] = useState(local.logo || '');
  const [logoWidth, setLogoWidth] = useState(local.logoWidth || 120);
  const [invoicePrefix, setInvoicePrefix] = useState(local.invoicePrefix || 'INV-');
  const [companyName, setCompanyName] = useState(local.companyName || 'Prime Helix');
  const [companyEmail, setCompanyEmail] = useState(local.companyEmail || '');
  const [companyAddress, setCompanyAddress] = useState(local.companyAddress || '');
  const [defaultNotes, setDefaultNotes] = useState(local.defaultNotes || '');
  const [saved, setSaved] = useState(false);

  // Load settings from server on mount — merges with local cache
  useEffect(() => {
    api.getSettings().then(remote => {
      if (remote && typeof remote === 'object') {
        if (remote.logo) setLogo(remote.logo);
        if (remote.logoWidth) setLogoWidth(remote.logoWidth);
        if (remote.invoicePrefix) setInvoicePrefix(remote.invoicePrefix);
        if (remote.companyName) setCompanyName(remote.companyName);
        if (remote.companyEmail) setCompanyEmail(remote.companyEmail);
        if (remote.companyAddress) setCompanyAddress(remote.companyAddress);
        if (remote.defaultNotes !== undefined) setDefaultNotes(remote.defaultNotes);
        saveLocal(remote);
      }
    }).catch(() => {/* use local fallback */});
  }, []);

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
    const data = { logo, logoWidth, invoicePrefix, companyName, companyEmail, companyAddress, defaultNotes };
    saveLocal(data);
    api.putSettings(data).catch(() => {});
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
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 12 }}>
          {logo ? (
            <img src={logo} alt="Company logo" style={{ width: logoWidth, maxHeight: 80, objectFit: "contain" }} />
          ) : (
            <div style={{ width: 120, height: 60, background: theme.bgTertiary, border: `1px dashed ${theme.border}`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: theme.textSecondary }}>No logo</div>
          )}
          <label style={{ ...btnSecondary, cursor: "pointer" }}>
            {logo ? 'Change' : 'Upload'} Logo
            <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: "none" }} />
          </label>
          {logo && <button style={{ ...btnSecondary, color: theme.danger, borderColor: theme.dangerBorder }} onClick={() => setLogo('')}>Remove</button>}
        </div>
        {logo && (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 11, color: theme.textSecondary, whiteSpace: "nowrap" }}>Width: {logoWidth}px</span>
            <input type="range" min="40" max="300" value={logoWidth}
              onChange={e => setLogoWidth(Number(e.target.value))}
              style={{ flex: 1, accentColor: theme.accent }} />
          </div>
        )}
      </Section>

      {/* Invoice Defaults */}
      <Section theme={theme} title="Invoice Defaults">
        <Field theme={theme} label="Invoice Number Prefix">
          <input style={inputStyle(theme)} value={invoicePrefix} onChange={e => setInvoicePrefix(e.target.value)} placeholder="e.g. INV-" />
        </Field>
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