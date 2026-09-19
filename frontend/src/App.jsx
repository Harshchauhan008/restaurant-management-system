import "./App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";

import Home from "./pages/Home";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";

import CustomerMenu from "./pages/customer/CustomerMenu";
import ReviewPage from "./pages/ReviewPage";
import GuestReviews from "./pages/GuestReviews";

import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminBilling from "./pages/admin/AdminBilling";
import AdminReservations from "./pages/admin/AdminReservations";
import AdminMenu from "./pages/admin/AdminMenu";
import AdminSettings from "./pages/admin/AdminSettings";
import EmployeeManagement from "./pages/admin/EmployeeManagement";
import AdminTables from "./pages/admin/AdminTables";

import KitchenDashboard from "./pages/kitchen/KitchenDashboard";
import WaiterDashboard from "./pages/waiter/WaiterDashboard";
import CashierDashboard from "./pages/cashier/CashierDashboard";

import ResetPassword from "./pages/ResetPassword";


// =====================================================
// CLEAR ADMIN SESSION
// =====================================================

function clearAdminSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("adminToken");
  localStorage.removeItem("employeeId");
  localStorage.removeItem("fullName");
  localStorage.removeItem("role");
}


// =====================================================
// ADMIN ROUTE PROTECTION
// =====================================================

function ProtectedAdminRoute() {

  const adminToken = localStorage.getItem("adminToken");
  const role = localStorage.getItem("role");

  if (!adminToken || role !== "ADMIN") {
    return <Navigate to="/login" replace />;
  }

  return <AdminLayout />;
}


// =====================================================
// ADMIN SESSION NAVIGATION GUARD
// =====================================================

function AdminSessionGuard() {

  const location = useLocation();

  useEffect(() => {

    const currentPath = location.pathname;

    // =================================================
    // USER IS INSIDE ADMIN
    // =================================================

    if (currentPath.startsWith("/admin")) {
      return;
    }

    // =================================================
    // USER IS OUTSIDE ADMIN
    //
    // Remove admin session.
    // =================================================

    const adminToken = localStorage.getItem("adminToken");
    const role = localStorage.getItem("role");

    if (adminToken && role === "ADMIN") {
      clearAdminSession();
    }

  }, [location.pathname]);

  return null;
}


// =====================================================
// APP
// =====================================================

function App() {

  return (
    <BrowserRouter>

      <AdminSessionGuard />

      <Routes>

        {/* =================================================
            PUBLIC
        ================================================= */}

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />

        <Route
          path="/menu"
          element={<CustomerMenu />}
        />

        <Route
          path="/review"
          element={<ReviewPage />}
        />

        <Route
          path="/guest-reviews"
          element={<GuestReviews />}
        />


        {/* =================================================
            ADMIN
        ================================================= */}

        <Route
          path="/admin"
          element={<ProtectedAdminRoute />}
        >

          <Route
            index
            element={<AdminDashboard />}
          />

          <Route
            path="tables"
            element={<AdminTables />}
          />

          <Route
            path="orders"
            element={<AdminOrders />}
          />

          <Route
            path="billing"
            element={<AdminBilling />}
          />

          <Route
            path="reservations"
            element={<AdminReservations />}
          />

          <Route
            path="employees"
            element={<EmployeeManagement />}
          />

          <Route
            path="menu"
            element={<AdminMenu />}
          />

          <Route
            path="settings"
            element={<AdminSettings />}
          />

        </Route>


        {/* =================================================
            OTHER EMPLOYEE DASHBOARDS
        ================================================= */}

        <Route
          path="/kitchen"
          element={<KitchenDashboard />}
        />

        <Route
          path="/waiter"
          element={<WaiterDashboard />}
        />

        <Route
          path="/cashier"
          element={<CashierDashboard />}
        />


        {/* =================================================
            UNKNOWN ROUTE
        ================================================= */}

        <Route
          path="*"
          element={<Home />}
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;