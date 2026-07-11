import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/layouts/AppLayout";
import { AuthLayout } from "@/layouts/AuthLayout";
import { RequireAuth, RequireGuest } from "./guards";
import { LoginPage } from "@/features/auth/LoginPage";
import { RegisterPage } from "@/features/auth/RegisterPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { LinksPage } from "@/features/links/LinksPage";
import { LinkDetailPage } from "@/features/links/LinkDetailPage";
import { AnalyticsPage } from "@/features/analytics/AnalyticsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { PremiumFeaturesPage } from "@/pages/PremiumFeaturesPage";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Guest only */}
        <Route element={<RequireGuest />}>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>
        </Route>

        {/* Authenticated only */}
        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="/links" element={<LinksPage />} />
            <Route path="/links/:code" element={<LinkDetailPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/premium" element={<PremiumFeaturesPage />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<RequireAuth />} />
      </Routes>
    </BrowserRouter>
  );
}
