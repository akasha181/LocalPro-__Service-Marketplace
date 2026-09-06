import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { ExplorePage } from './pages/ExplorePage';
import { ProfessionalDetailsPage } from './pages/ProfessionalDetailsPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { ProtectedRoute } from './routes/ProtectedRoute';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/explore" element={<ExplorePage />} />
                <Route path="/professionals/:id" element={<ProfessionalDetailsPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Customer Dashboard Routes */}
                <Route element={<ProtectedRoute allowedRoles={['customer']} />}>
                  <Route path="/customer/bookings" element={<MyBookingsPage />} />
                </Route>

                {/* Professional Dashboard Routes */}
                <Route element={<ProtectedRoute allowedRoles={['professional']} />}>
                  <Route
                    path="/pro/dashboard"
                    element={
                      <div className="max-w-7xl mx-auto px-4 py-12">
                        <h1 className="text-2xl font-bold">Professional Dashboard</h1>
                        <p className="text-slate-500 mt-1">Manage incoming booking requests, calendar slots, and services.</p>
                      </div>
                    }
                  />
                </Route>

                {/* Admin Dashboard Routes */}
                <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                  <Route
                    path="/admin"
                    element={
                      <div className="max-w-7xl mx-auto px-4 py-12">
                        <h1 className="text-2xl font-bold">Admin Portal</h1>
                        <p className="text-slate-500 mt-1">Platform management, verification queues, and analytics.</p>
                      </div>
                    }
                  />
                </Route>

                {/* 404 Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
