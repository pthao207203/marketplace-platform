import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/Header.tsx";
import Sidebar from "../components/Sidebar.tsx";

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div
      className={
        sidebarOpen ? "layout layout--sidebar" : "layout layout--no-sidebar"
      }
    >
      <Header
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        sidebarOpen={sidebarOpen}
      />
      <Sidebar open={sidebarOpen} />
      <main className="layout__content">
        <Outlet />
      </main>
    </div>
  );
}
