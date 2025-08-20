// src/app/private/dashboard/layout.tsx
import { ReactNode } from "react";
import RoleDashboard from "./components/RoleDashboard";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <RoleDashboard>
      <div className="p-4 bg-slate-50 min-h-screen">
        <h1 className="text-xl font-bold mb-4">Panel de Usuario</h1>
        {children}
      </div>
    </RoleDashboard>
  );
}
