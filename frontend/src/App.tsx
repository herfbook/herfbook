import { Routes, Route } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { AppShell } from "@/components/layout/app-shell";
import DevPage from "@/pages/dev";
import SetupPage from "@/pages/setup";
import LoginPage from "@/pages/login";
import NotFoundPage from "@/pages/not-found";
import DashboardPage from "@/pages/dashboard";
import HumidorsListPage from "@/pages/humidors-list";
import HumidorDetailPage from "@/pages/humidor-detail";
import CigarsListPage from "@/pages/cigars-list";
import CigarDetailPage from "@/pages/cigar-detail";
import InventoryListPage from "@/pages/inventory-list";
import InventoryDetailPage from "@/pages/inventory-detail";
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
            <Route path="/humidors" element={<HumidorsListPage />} />
            <Route path="/humidors/:id" element={<HumidorDetailPage />} />
            <Route path="/cigars" element={<CigarsListPage />} />
            <Route path="/cigars/:id" element={<CigarDetailPage />} />
            <Route path="/inventory" element={<InventoryListPage />} />
            <Route path="/inventory/:id" element={<InventoryDetailPage />} />
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
