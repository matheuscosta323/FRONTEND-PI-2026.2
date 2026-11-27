import type { ReactNode } from "react";
import { RequireAuth } from "@/components/auth/require-auth";
import { AlertasProvider } from "@/components/layout/alertas-provider";
import { Sidebar } from "@/components/layout/sidebar";

export default function PainelLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <AlertasProvider>
        <Sidebar />
        <div className="content">{children}</div>
      </AlertasProvider>
    </RequireAuth>
  );
}
