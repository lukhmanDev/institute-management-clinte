import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      collapsed ? "80px" : "260px"
    );
  }, [collapsed]);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      
      <div 
        className="transition-all duration-300"
        style={{ marginLeft: collapsed ? "80px" : "260px" }}
      >
        <Navbar />
        
        <main className="p-6 pt-24 min-h-[calc(100vh-64px)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
