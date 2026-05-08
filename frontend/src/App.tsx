import { Routes, Route } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/components/auth/protected-route";
import DevPage from "@/pages/dev";
import SetupPage from "@/pages/setup";
import LoginPage from "@/pages/login";
import HomePage from "@/pages/home";
import NotFoundPage from "@/pages/not-found";

export default function App() {
  return (
    <TooltipProvider>
      <Routes>
        {/* Public */}
        <Route path="/setup" element={<SetupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/_/dev" element={<DevPage />} />

        {/* Protected */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<HomePage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </TooltipProvider>
  );
}
