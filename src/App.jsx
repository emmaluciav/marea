import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
// Add page imports here
import Catalog from "@/pages/Catalog";
import ProductDetail from "@/pages/ProductDetail";
import Saved from "@/pages/Saved";
import AdminProductForm from "@/pages/AdminProductForm";
import Packagings from "@/pages/Packagings";
import PackagingDetail from "@/pages/PackagingDetail";
import AdminPackagingForm from "@/pages/AdminPackagingForm";
import AdminInventory from "@/pages/AdminInventory";
import MareaLayout from "@/components/marea/MareaLayout";
import { MareaProvider } from "@/components/marea/MareaProvider";
import AdminBorder from "@/components/marea/AdminBorder";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Redirect to login (valid URL via appBaseUrl) when auth is required, but
  // NEVER render null — always show the public catalog so the screen is never
  // blank during the redirect.
  useEffect(() => {
    if (authError?.type === 'auth_required') {
      navigateToLogin();
    }
  }, [authError, navigateToLogin]);

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError && authError.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  // Render the main app (also for auth_required — redirect handled above)
  return (
    <Routes>
      <Route element={<MareaLayout />}>
        <Route path="/" element={<Catalog />} />
        <Route path="/saved" element={<Saved />} />
      </Route>
      <Route path="/product/:id" element={<ProductDetail />} />
      <Route path="/admin/add" element={<AdminProductForm />} />
      <Route path="/admin/edit/:id" element={<AdminProductForm />} />
      <Route path="/empaque" element={<Packagings />} />
      <Route path="/empaque/:id" element={<PackagingDetail />} />
      <Route path="/admin/empaque/add" element={<AdminPackagingForm />} />
      <Route path="/admin/empaque/edit/:id" element={<AdminPackagingForm />} />
      <Route path="/admin/inventario" element={<AdminInventory />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <MareaProvider>
            <AdminBorder />
            <AuthenticatedApp />
          </MareaProvider>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App