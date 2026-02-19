import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import {
  RoleWorkspaceLayout,
  type WorkspaceNavItem,
} from "@/components/layout/RoleWorkspaceLayout";
import { RestaurantWorkspaceProvider } from "@/hooks/useRestaurantWorkspaceData";

const restaurantNavItems: WorkspaceNavItem[] = [
  { href: "/restaurant/dashboard", label: "Overview", icon: "dashboard" },
  { href: "/restaurant/donations", label: "My Donations", icon: "donations" },
  { href: "/restaurant/schedules", label: "Schedules", icon: "schedules" },
  { href: "/restaurant/actions", label: "Actions", icon: "actions" },
  { href: "/restaurant/receipts", label: "Receipts", icon: "receipts" },
];

export default function RestaurantLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["restaurant"]}>
      <RestaurantWorkspaceProvider>
        <RoleWorkspaceLayout role="restaurant" navItems={restaurantNavItems}>
          {children}
        </RoleWorkspaceLayout>
      </RestaurantWorkspaceProvider>
    </ProtectedRoute>
  );
}
