import { Routes, Route } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { AppShell } from "@/components/layout/app-shell";
import DevPage from "@/pages/dev";
import SetupPage from "@/pages/setup";
import LoginPage from "@/pages/login";
import NotFoundPage from "@/pages/not-found";
import DashboardPage from "@/pages/dashboard";
import HumidorsPlaceholderPage from "@/pages/humidors-placeholder";
import CigarsPlaceholderPage from "@/pages/cigars-placeholder";
import InventoryPlaceholderPage from "@/pages/inventory-placeholder";
import SessionsPlaceholderPage from "@/pages/sessions-placeholder";
import WishlistPlaceholderPage from "@/pages/wishlist-placeholder";
import SwapsPlaceholderPage from "@/pages/swaps-placeholder";
import GuestsPlaceholderPage from "@/pages/guests-placeholder";
import AdminCommunityPlaceholderPage from "@/pages/admin-community-placeholder";
import AdminSettingsPlaceholderPage from "@/pages/admin-settings-placeholder";

export default function App() {
  return (
    <TooltipProvider>
      <Routes>
        {/* Public */}
        <Route path="/setup" element={<SetupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/_/dev" element={<DevPage />} />

        {/* Protected — inside app shell */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/humidors" element={<HumidorsPlaceholderPage />} />
            <Route path="/cigars" element={<CigarsPlaceholderPage />} />
            <Route path="/inventory" element={<InventoryPlaceholderPage />} />
            <Route path="/sessions" element={<SessionsPlaceholderPage />} />
            <Route path="/wishlist" element={<WishlistPlaceholderPage />} />
            <Route path="/swaps" element={<SwapsPlaceholderPage />} />
            <Route path="/guests" element={<GuestsPlaceholderPage />} />
            <Route path="/admin/community" element={<AdminCommunityPlaceholderPage />} />
            <Route path="/admin/settings" element={<AdminSettingsPlaceholderPage />} />
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </TooltipProvider>
  );
}
