export function createPageUrl(pageName: string) {
    return '/' + pageName.replace(/ /g, '-');
}
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import DriverLayout from '@/components/DriverLayout';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
// Add page imports here
import Home from '@/pages/Home';
import Trips from '@/pages/Trips';
import Saved from '@/pages/Saved';
import Messages from '@/pages/Messages';
import Profile from '@/pages/Profile';
import Booking from '@/pages/Booking';
import Confirmation from '@/pages/Confirmation';
import ActiveParking from '@/pages/ActiveParking';
import Report from '@/pages/Report';
import HostOnboarding from '@/pages/HostOnboarding';
import HostDashboard from '@/pages/HostDashboard';
import HostListings from '@/pages/HostListings';
import Admin from '@/pages/Admin';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<DriverLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/trips" element={<Trips />} />
          <Route path="/saved" element={<Saved />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
        <Route path="/booking/:id" element={<Booking />} />
        <Route path="/confirmation/:id" element={<Confirmation />} />
        <Route path="/active/:id" element={<ActiveParking />} />
        <Route path="/report/:id" element={<Report />} />
        <Route path="/host" element={<HostOnboarding />} />
        <Route path="/host/list" element={<HostOnboarding />} />
        <Route path="/host/dashboard" element={<HostDashboard />} />
        <Route path="/host/listings" element={<HostListings />} />
        <Route path="/admin" element={<Admin />} />
      </Route>
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
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 222 47% 7%;
    --foreground: 210 20% 98%;
    --card: 222 30% 12%;
    --card-foreground: 210 20% 98%;
    --popover: 222 30% 10%;
    --popover-foreground: 210 20% 98%;
    --primary: 38 92% 50%;
    --primary-foreground: 222 47% 7%;
    --secondary: 152 76% 40%;
    --secondary-foreground: 210 20% 98%;
    --muted: 222 20% 18%;
    --muted-foreground: 217 11% 65%;
    --accent: 38 92% 50%;
    --accent-foreground: 222 47% 7%;
    --destructive: 0 72% 51%;
    --destructive-foreground: 210 20% 98%;
    --border: 222 22% 20%;
    --input: 222 22% 20%;
    --ring: 38 92% 50%;
    --radius: 1rem;
    --font-heading: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif;
    --font-body: 'Inter', ui-sans-serif, system-ui, sans-serif;
    --font-display: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif;
    --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  }
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }

  body {
    @apply bg-background text-foreground font-body antialiased;
  }

  h1, h2, h3, h4, h5, h6 {
    @apply font-display;
  }
}

@layer utilities {
  .glass {
    background: rgba(22, 27, 38, 0.72);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
  }
  .glass-strong {
    background: rgba(11, 15, 23, 0.88);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .map-pin-glow {
    box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.25), 0 4px 14px rgba(0, 0, 0, 0.5);
  }
  .ev-glow {
    box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.25), 0 4px 14px rgba(0, 0, 0, 0.5);
  }
}
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
