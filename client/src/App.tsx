// App.tsx
import { Switch, Route, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { ResponsiveHome } from "./components/ResponsiveHome";
import { ResponsiveProducts } from "./components/ResponsiveProduits";
import { ResponsivePropos } from "./components/ResponsivePropos";
import { ResponsiveContact } from "./components/ResponsiveContact";

import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { DataProvider } from "./contexts/DataContext";
import { CartProvider } from "./contexts/CartProvider";
import { LoginForm } from "./components/auth/LoginForm";
import { RegisterForm } from "./components/auth/RegisterForm";
import { ForgotPasswordForm } from "./components/auth/ForgotPasswordForm";
import { Sidebar } from "./components/layout/Sidebar";
import { Header } from "./components/layout/Header";
import { Dashboard } from "./components/admin/Dashboard";
import { ProductManagement } from "./components/admin/ProductManagement";
import { OrderManagement } from "./components/admin/OrderManagement";
import { CustomerManagement } from "./components/admin/CustomerManagement";
import { PromotionManagement } from "./components/admin/PromotionManagement";
import { ReportsAnalytics } from "./components/admin/ReportsAnalytics";
import { ContentManagement } from "./components/admin/ContentManagement";
import { SEOPageManagement } from "./components/admin/SEOPageManagement";
import { SystemSettings } from "./components/admin/SystemSettings";
import { ClientProfile } from "./components/client/ClientProfile";
import { ClientOrders } from "./components/client/ClientOrders";
import { LoyaltyPoints } from "./components/client/LoyaltyPoints";
import { Notifications } from "./components/client/Notifications";
import { Wishlist } from "./components/client/Wishlist";
import React, { useState, useEffect } from "react";
import ReactGA from "react-ga4";
import { useLocation } from "wouter";
import PaymentConfirmation from "./pages/PaymentConfirmation";
import CategoryManagement from "./components/admin/CategoryManagement";
import { Loader2, ArrowLeft } from "lucide-react";
import ConseilManagement from "./components/admin/ConseilManagement";
import { ResponsiveDetailsProducts } from "./components/ResponsiveDetailsProduits";
import { ContactsTable } from "./components/admin/Contacts";
import { ResponsiveCheckout } from "./components/ResponsiveCheckout";
import MarquesManagment from "./components/admin/MarquesManagement";
import { DeletedOrdersManagement } from "./components/admin/DeletedOrdersManagement";
import ScrollToTop from "./components/ScrollToTop";

// ----------------------------
// Auth
// ----------------------------
type AuthView = "login" | "register" | "forgot-password";

const AuthScreen: React.FC = () => {
  const [currentView, setCurrentView] = useState<AuthView>("login");

  const renderAuthForm = () => {
    switch (currentView) {
      case "login":
        return (
          <LoginForm
            onToggleForm={() => setCurrentView("register")}
            onForgotPassword={() => setCurrentView("forgot-password")}
          />
        );
      case "register":
        return <RegisterForm onToggleForm={() => setCurrentView("login")} />;
      case "forgot-password":
        return <ForgotPasswordForm onBack={() => setCurrentView("login")} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100/40 flex items-center justify-center p-4 relative">
      <Link
        to="/"
        className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-2 text-slate-600 hover:text-[#1D8EE6] font-semibold text-xs sm:text-sm transition-all bg-white/95 backdrop-blur-md px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-xl shadow-md border border-slate-100 hover:shadow-lg active:scale-95 duration-200"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Retour à l'accueil</span>
      </Link>
      {renderAuthForm()}
    </div>
  );
};

// ----------------------------
// Dashboard
// ----------------------------
const DashboardScreen: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(() => {
    switch (user?.role) {
      case "admin":
      case "admin_commercial":
        return "dashboard";
      case "client":
        return "profile";
      case "livreur":
        return "deliveries";
      default:
        return "dashboard";
    }
  });

  const [dashboardSelectedOrderId, setDashboardSelectedOrderId] = useState<string | null>(null);

  const handleOrderClickFromDashboard = (orderId: string) => {
    setDashboardSelectedOrderId(orderId);
    setActiveTab("orders");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard onOrderClick={handleOrderClickFromDashboard} />;
      case "categories":
        return <CategoryManagement />;
      case "contacts":
        return <ContactsTable />;
      case "products":
        return <ProductManagement />;
      case 'orders':
        return user?.role === 'admin' || user?.role === 'admin_commercial'
          ? <OrderManagement initialOrderId={dashboardSelectedOrderId} />
          : <ClientOrders />;
      case 'deleted-orders':
        return <DeletedOrdersManagement />;
      case "customers":
        return <CustomerManagement />;
      case "promotions":
        return <PromotionManagement />;
      case "conseils":
        return <ConseilManagement />;
      case "marques":
        return <MarquesManagment />;
      case "reports":
        return <ReportsAnalytics />;
      case "content":
        return <ContentManagement />;
      case "seo":
        return <SEOPageManagement />;
      case "settings":
        return <SystemSettings />;
      case "profile":
        return <ClientProfile />;
      case "loyalty":
        return <LoyaltyPoints />;
      case "wishlist":
        return <Wishlist />;
      case "notifications":
        return <Notifications />;
      case "deliveries":
        return (
          <div className="p-8 text-center text-gray-500">
            Gestion des livraisons — bientôt disponible
          </div>
        );
      default:
        return (
          <div className="p-8 text-center text-gray-500">Page introuvable</div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-6 overflow-auto">{renderContent()}</main>
      </div>
    </div>
  );
};

// ----------------------------
// AppContent
// ----------------------------
const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <span className="text-gray-600 text-lg font-medium">Chargement en cours...</span>
        </div>
      </div>
    );
  }

  return user ? <DashboardScreen /> : <AuthScreen />;
};

// ----------------------------
// GA Page Tracker
// ----------------------------
function GAPageTracker() {
  const [location] = useLocation();
  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: location });
  }, [location]);
  return null;
}

// ----------------------------
// Router
// ----------------------------
function Router() {
  return (
    <CartProvider>
      <ScrollToTop />
      <GAPageTracker />
      <Switch>
        <AuthProvider>
          <Toaster position="top-right" reverseOrder={false} />

          <Route path="/" component={ResponsiveHome} />
          <Route path="/products" component={ResponsiveProducts} />
          <Route path="/contact" component={ResponsiveContact} />
          <Route path="/propos" component={ResponsivePropos} />
          <Route path="/detailsprod/:id" component={ResponsiveDetailsProducts} />
          <Route path="/checkout" component={ResponsiveCheckout} />
          <Route path="/payment-confirmation" component={PaymentConfirmation} />

          <Route path="/dashboard">
            <DataProvider>
              <AppContent />
            </DataProvider>
          </Route>
        </AuthProvider>

        <Route component={NotFound} />
      </Switch>
    </CartProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;