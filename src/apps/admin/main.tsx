import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { AdminApp } from "./AdminApp";
import "@/index.css";

class AdminErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Admin app error:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: "sans-serif", color: "#b91c1c", maxWidth: 600 }}>
          <h1 style={{ fontSize: 18, marginBottom: 8 }}>Admin app error</h1>
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{this.state.error.message}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootEl = document.getElementById("root");
if (!rootEl) {
  document.body.innerHTML = "<p style='padding:24px;font-family:sans-serif'>No #root element.</p>";
} else {
  createRoot(rootEl).render(
    <React.StrictMode>
      <AdminErrorBoundary>
        <AdminApp />
      </AdminErrorBoundary>
    </React.StrictMode>
  );
}
