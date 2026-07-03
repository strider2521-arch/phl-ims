import { useState, useEffect } from "react";
import { AuthContext } from "./contexts/AuthContext";
import { DataContext } from "./contexts/DataContext";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Invoices from "./pages/Invoices";
import CreateInvoice from "./pages/CreateInvoice";
import Settings from "./pages/Settings";
import KnowledgeBase from "./pages/KnowledgeBase";
import PriceList from "./pages/PriceList";
import Layout from "./components/Layout";
import ErrorBoundary from "./components/ErrorBoundary";
import { login as apiLogin, logout as apiLogout, loadData, getStoredUser } from "./utils/api";

function AppContent() {
  const { theme } = useTheme();
  const [user, setUser] = useState(null);
  const [data, setData] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [editingInvoice, setEditingInvoice] = useState(null);

  // Sync body background with theme
  useEffect(() => {
    document.body.style.background = theme.bg;
  }, [theme]);

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) setUser(stored);
    loadData().then(setData).catch(() => setData({ groups: [], items: [], invoices: [], stockHistory: [], protocols: [] }));
  }, []);

  const login = async (username, password) => {
    try {
      const u = await apiLogin(username, password);
      setUser(u);
      // Reload data now that we have a valid session token
      try {
        const fresh = await loadData();
        setData(fresh);
      } catch { /* keep fallback data */ }
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    apiLogout();
    setUser(null);
    setPage("dashboard");
  };

  const refreshData = async () => {
    try {
      const fresh = await loadData();
      setData(fresh);
    } catch { /* keep stale data */ }
  };

  if (!data) return null;
  if (!user) return <AuthContext.Provider value={{ login }}><LoginPage /></AuthContext.Provider>;

  return (
    <AuthContext.Provider value={{ user, logout }}>
      <DataContext.Provider value={{ data, refreshData }}>
        <Layout page={page} setPage={setPage}>
          {page === "dashboard" && <Dashboard setPage={setPage} />}
          {page === "knowledge" && <KnowledgeBase />}
          {page === "inventory" && <Inventory />}
          {page === "invoices" && <Invoices setPage={setPage} setEditingInvoice={setEditingInvoice} />}
          {page === "create-invoice" && <CreateInvoice setPage={setPage} editingInvoice={editingInvoice} setEditingInvoice={setEditingInvoice} />}
          {page === "pricelist" && <PriceList />}
          {page === "settings" && <Settings />}
        </Layout>
      </DataContext.Provider>
    </AuthContext.Provider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </ThemeProvider>
  );
}
