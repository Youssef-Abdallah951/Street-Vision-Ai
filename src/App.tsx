import { Routes, Route } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { RequireAuth, RequireAdmin, RequireGuest } from '@/components/auth/Guards'
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { ReportPage } from '@/pages/ReportPage'
import { ReportsListPage } from '@/pages/ReportsListPage'
import { ReportDetailPage } from '@/pages/ReportDetailPage'
import { MapPage } from '@/pages/MapPage'
import { AnalyticsPage } from '@/pages/AnalyticsPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { NotificationsPage } from '@/pages/NotificationsPage'
import { AdminPage } from '@/pages/admin/AdminPage'
import { AdminReportsPage } from '@/pages/admin/AdminReportsPage'
import { AdminAnalyticsPage } from '@/pages/admin/AdminAnalyticsPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

export default function App() {
  return (
    <Routes>
      {/* Public shell routes */}
      <Route element={<AppShell />}>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/login"
          element={
            <RequireGuest>
              <LoginPage />
            </RequireGuest>
          }
        />
        <Route
          path="/register"
          element={
            <RequireGuest>
              <RegisterPage />
            </RequireGuest>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <RequireGuest>
              <ForgotPasswordPage />
            </RequireGuest>
          }
        />
        <Route path="/map" element={<MapPage />} />
        <Route path="/community/reports" element={<MapPage />} />
        <Route path="/reports" element={<ReportsListPage />} />
        <Route path="/reports/:id" element={<ReportDetailPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />

        {/* Authenticated */}
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <DashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path="/report"
          element={
            <RequireAuth>
              <ReportPage />
            </RequireAuth>
          }
        />
        <Route
          path="/create-report"
          element={
            <RequireAuth>
              <ReportPage />
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          }
        />
        <Route
          path="/notifications"
          element={
            <RequireAuth>
              <NotificationsPage />
            </RequireAuth>
          }
        />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <RequireAdmin>
              <AdminReportsPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <RequireAdmin>
              <AdminAnalyticsPage />
            </RequireAdmin>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
