import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/features/shared/providers/ThemeProvider";
import { AuthProvider } from "@/features/auth";
import { AppLayout } from "@/features/shared/components/AppLayout";
import { ProtectedRoute } from "@/features/shared/components/ProtectedRoute";
import { RequireStudentNumber } from "@/features/shared/components/RequireStudentNumber";

// Auth
import { AuthPage, ForgotPasswordPage, ResetPasswordPage, TermsOfService, PrivacyPolicy } from "@/features/auth";

// Student Features
import { StudentDashboard } from "@/features/dashboard";
import { ChatInterface } from "@/features/chat";
import { FAQCenter } from "@/features/faq";
import { AnnouncementsList } from "@/features/announcements";
import { ProfileSettings } from "@/features/profile";
import { SettingsPage } from "@/features/settings";
import { UpcomingEvents } from "@/features/events";

// Admin Features
import { AdminDashboard } from "@/features/admin";

// Public Features
import { AcknowledgementsPage } from "@/features/acknowledgements";

import NotFound from "./pages/NotFound";
import { LandingPage } from "@/features/landing";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light">
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/acknowledgements" element={<AcknowledgementsPage />} />
              <Route path="/terms" element={<TermsOfService showAcceptButton={false} />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              
              {/* Public Auth Routes */}
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
              <Route path="/auth/terms" element={<TermsOfService showAcceptButton={false} />} />
              <Route path="/auth/privacy" element={<PrivacyPolicy />} />
              
              {/* Protected Routes */}
              <Route element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }>
                {/* Student Routes */}
                <Route path="/dashboard" element={<StudentDashboard />} />
                <Route path="/chat" element={<ChatInterface />} />
                <Route path="/faq" element={<FAQCenter />} />
                <Route path="/events" element={
                  <RequireStudentNumber>
                    <UpcomingEvents />
                  </RequireStudentNumber>
                } />
                <Route path="/announcements" element={<AnnouncementsList />} />
                <Route path="/profile" element={<ProfileSettings />} />
                <Route path="/settings" element={<SettingsPage />} />
                
                {/* Admin Routes */}
                <Route path="/admin" element={
                  <ProtectedRoute requireAdmin>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/admin/users" element={
                  <ProtectedRoute requireAdmin>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/admin/faq" element={
                  <ProtectedRoute requireAdmin>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/admin/conversations" element={
                  <ProtectedRoute requireAdmin>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/admin/announcements" element={
                  <ProtectedRoute requireAdmin>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/admin/categories" element={
                  <ProtectedRoute requireAdmin>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/admin/events" element={
                  <ProtectedRoute requireAdmin>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/admin/content" element={
                  <ProtectedRoute requireAdmin>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/admin/reports" element={
                  <ProtectedRoute requireAdmin>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/admin/settings" element={
                  <ProtectedRoute requireAdmin>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
              </Route>
              
              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;



