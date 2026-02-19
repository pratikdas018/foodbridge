import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import {
  RoleWorkspaceLayout,
  type WorkspaceNavItem,
} from "@/components/layout/RoleWorkspaceLayout";
import { NgoWorkspaceProvider } from "@/hooks/useNgoWorkspaceData";

const ngoNavItems: WorkspaceNavItem[] = [
  { href: "/ngo/dashboard", label: "Overview", icon: "dashboard" },
  { href: "/ngo/profile", label: "Profile", icon: "profile" },
  { href: "/ngo/availability", label: "Availability", icon: "availability" },
  { href: "/ngo/claims", label: "Claim History", icon: "claims" },
  { href: "/ngo/receipts", label: "Receipts", icon: "receipts" },
];

export default function NgoLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["ngo"]}>
      <NgoWorkspaceProvider>
        <RoleWorkspaceLayout role="ngo" navItems={ngoNavItems}>
          {children}
        </RoleWorkspaceLayout>
      </NgoWorkspaceProvider>
    </ProtectedRoute>
  );
}
