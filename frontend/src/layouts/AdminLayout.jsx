import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // =====================================================
  // ADMIN AUTHENTICATION CHECK
  // =====================================================

  useEffect(() => {
    const token =
      localStorage.getItem("adminToken") ||
      localStorage.getItem("token");

    const role =
      localStorage.getItem("role")?.toUpperCase();

    // No admin login -> go to login
    if (!token || role !== "ADMIN") {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  // =====================================================
  // CLOSE SIDEBAR WHEN ROUTE CHANGES
  // =====================================================

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const isActive = (path) => {
    return location.pathname === path;
  };

  // =====================================================
  // PREVENT CONTENT FROM FLASHING BEFORE CHECK
  // =====================================================

  const adminToken =
    localStorage.getItem("adminToken") ||
    localStorage.getItem("token");

  const role =
    localStorage.getItem("role")?.toUpperCase();

  if (!adminToken || role !== "ADMIN") {
    return null;
  }

  return (
    <div className="admin-dashboard">

      <style>
        {`
          * {
            box-sizing: border-box;
          }

          .admin-dashboard {
            min-height: 100vh;
            background:
              radial-gradient(
                circle at top right,
                rgba(201,123,74,0.10),
                transparent 32%
              ),
              #171310;
            color: #f4eee7;
            font-family:
              Inter,
              system-ui,
              -apple-system,
              BlinkMacSystemFont,
              "Segoe UI",
              sans-serif;
          }

          .admin-shell {
            display: flex;
            min-height: 100vh;
          }

          /* =================================================
             SIDEBAR
          ================================================= */

          .admin-sidebar {
            position: relative;
            width: 250px;
            flex-shrink: 0;
            min-height: 100vh;
            padding: 28px 18px;
            background: #211b18;
            border-right: 1px solid rgba(255,255,255,0.08);
          }

          .admin-brand {
            padding: 8px 14px 28px;
            border-bottom: 1px solid rgba(255,255,255,0.08);
          }

          .admin-brand-small {
            display: block;
            margin-bottom: 5px;
            color: #d38a55;
            font-size: 0.72rem;
            font-weight: 700;
            letter-spacing: 0.18em;
            text-transform: uppercase;
          }

          .admin-brand-title {
            margin: 0;
            color: #fffaf5;
            font-family:
              Georgia,
              "Times New Roman",
              serif;
            font-size: 1.65rem;
            font-weight: 600;
          }

          .admin-nav {
            margin-top: 28px;
          }

          .admin-nav-label {
            padding: 0 14px 10px;
            color: #81756e;
            font-size: 0.68rem;
            font-weight: 700;
            letter-spacing: 0.15em;
            text-transform: uppercase;
          }

          .admin-nav-item {
            width: 100%;
            display: flex;
            align-items: center;
            gap: 13px;
            padding: 13px 14px;
            margin-bottom: 6px;
            border: 1px solid transparent;
            border-radius: 10px;
            color: #bcb0a8;
            background: transparent;
            font: inherit;
            font-size: 0.92rem;
            text-align: left;
            cursor: pointer;
            transition: 0.2s ease;
          }

          .admin-nav-item:hover,
          .admin-nav-item.active {
            color: #fffaf5;
            background: rgba(201,123,74,0.13);
            border-color: rgba(201,123,74,0.22);
          }

          .admin-nav-icon {
            width: 28px;
            text-align: center;
            font-size: 1rem;
          }

          /* =================================================
             MAIN
          ================================================= */

          .admin-main {
            flex: 1;
            min-width: 0;
            padding: 32px;
          }

          /* =================================================
             MOBILE HEADER
          ================================================= */

          .admin-mobile-header {
            display: none;
          }

          .admin-sidebar-overlay {
            display: none;
          }

          .admin-sidebar-close {
            display: none;
          }

          /* =================================================
             MOBILE SIDEBAR
          ================================================= */

          @media (max-width: 800px) {

            .admin-shell {
              display: block;
            }

            .admin-mobile-header {
              display: flex;
              align-items: center;
              gap: 12px;
              width: 100%;
              height: 64px;
              padding: 0 16px;
              background: #211b18;
              border-bottom: 1px solid rgba(255,255,255,0.08);
              position: sticky;
              top: 0;
              z-index: 900;
            }

            .admin-mobile-menu-button {
              display: flex;
              align-items: center;
              justify-content: center;
              width: 42px;
              height: 42px;
              padding: 0;
              border: 1px solid rgba(201,123,74,0.25);
              border-radius: 9px;
              background: rgba(201,123,74,0.10);
              color: #e3a16f;
              font-size: 1.35rem;
              cursor: pointer;
            }

            .admin-mobile-title {
              flex: 1;
              color: #fffaf5;
              font-family:
                Georgia,
                "Times New Roman",
                serif;
              font-size: 1.15rem;
              font-weight: 600;
            }

            /* Sidebar becomes drawer */

            .admin-sidebar {
              position: fixed;
              top: 0;
              left: 0;
              z-index: 1000;

              width: 270px;
              height: 100vh;
              min-height: 100vh;

              padding: 22px 18px;

              transform: translateX(-100%);
              transition: transform 0.25s ease;

              box-shadow:
                12px 0 35px rgba(0,0,0,0.35);

              overflow-y: auto;
            }

            .admin-sidebar.open {
              transform: translateX(0);
            }

            /* Dark background behind sidebar */

            .admin-sidebar-overlay {
              position: fixed;
              inset: 0;
              z-index: 999;

              display: block;

              background: rgba(0,0,0,0.55);

              opacity: 0;
              visibility: hidden;
              pointer-events: none;

              transition:
                opacity 0.25s ease,
                visibility 0.25s ease;
            }

            .admin-sidebar-overlay.open {
              opacity: 1;
              visibility: visible;
              pointer-events: auto;
            }

            /* Close button */

            .admin-sidebar-close {
              display: flex;
              align-items: center;
              justify-content: center;

              position: absolute;
              top: 18px;
              right: 15px;

              width: 34px;
              height: 34px;

              padding: 0;

              border: 1px solid rgba(255,255,255,0.08);
              border-radius: 8px;

              background: rgba(255,255,255,0.05);
              color: #bcb0a8;

              font-size: 1.2rem;
              cursor: pointer;
            }

            .admin-brand {
              padding-right: 45px;
            }

            .admin-main {
              width: 100%;
              min-width: 0;
              padding: 18px 16px;
            }
          }

          /* =================================================
             VERY SMALL PHONES
          ================================================= */

          @media (max-width: 400px) {

            .admin-mobile-header {
              height: 58px;
              padding: 0 12px;
            }

            .admin-mobile-menu-button {
              width: 38px;
              height: 38px;
              font-size: 1.2rem;
            }

            .admin-mobile-title {
              font-size: 1rem;
            }

            .admin-sidebar {
              width: 260px;
            }

            .admin-main {
              padding: 14px 12px;
            }
          }
        `}
      </style>

      <div className="admin-shell">

        {/* =================================================
            MOBILE HEADER
        ================================================= */}

        <header className="admin-mobile-header">

          <button
            type="button"
            className="admin-mobile-menu-button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            ☰
          </button>

          <div className="admin-mobile-title">
            Admin Panel
          </div>

        </header>

        {/* =================================================
            SIDEBAR
        ================================================= */}

        <aside
          className={`admin-sidebar ${
            sidebarOpen ? "open" : ""
          }`}
        >

          {/* CLOSE BUTTON */}

          <button
            type="button"
            className="admin-sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            ×
          </button>

          <div className="admin-brand">

            <span className="admin-brand-small">
              Restaurant
            </span>

            <h2 className="admin-brand-title">
              Admin Panel
            </h2>

          </div>

          <nav className="admin-nav">

            {/* =================================================
                MANAGEMENT
            ================================================= */}

            <div className="admin-nav-label">
              Management
            </div>

            {/* DASHBOARD */}

            <button
              type="button"
              className={
                `admin-nav-item ${
                  isActive("/admin")
                    ? "active"
                    : ""
                }`
              }
              onClick={() => {
                navigate("/admin");
                setSidebarOpen(false);
              }}
            >
              <span className="admin-nav-icon">
                ◈
              </span>

              Dashboard
            </button>

            {/* TABLES */}

            <button
              type="button"
              className={
                `admin-nav-item ${
                  isActive("/admin/tables")
                    ? "active"
                    : ""
                }`
              }
              onClick={() => {
                navigate("/admin/tables");
                setSidebarOpen(false);
              }}
            >
              <span className="admin-nav-icon">
                ◫
              </span>

              Tables
            </button>

            {/* ORDERS */}

            <button
              type="button"
              className={
                `admin-nav-item ${
                  isActive("/admin/orders")
                    ? "active"
                    : ""
                }`
              }
              onClick={() => {
                navigate("/admin/orders");
                setSidebarOpen(false);
              }}
            >
              <span className="admin-nav-icon">
                ◴
              </span>

              Orders
            </button>

            {/* BILLING */}

            <button
              type="button"
              className={
                `admin-nav-item ${
                  isActive("/admin/billing")
                    ? "active"
                    : ""
                }`
              }
              onClick={() => {
                navigate("/admin/billing");
                setSidebarOpen(false);
              }}
            >
              <span className="admin-nav-icon">
                ₹
              </span>

              Billing
            </button>

            {/* RESERVATIONS */}

            <button
              type="button"
              className={
                `admin-nav-item ${
                  isActive("/admin/reservations")
                    ? "active"
                    : ""
                }`
              }
              onClick={() => {
                navigate("/admin/reservations");
                setSidebarOpen(false);
              }}
            >
              <span className="admin-nav-icon">
                ◌
              </span>

              Reservations
            </button>

            {/* EMPLOYEES */}

            <button
              type="button"
              className={
                `admin-nav-item ${
                  isActive("/admin/employees")
                    ? "active"
                    : ""
                }`
              }
              onClick={() => {
                navigate("/admin/employees");
                setSidebarOpen(false);
              }}
            >
              <span className="admin-nav-icon">
                👥
              </span>

              Employees
            </button>

            {/* =================================================
                RESTAURANT
            ================================================= */}

            <div
              className="admin-nav-label"
              style={{
                marginTop: "25px",
              }}
            >
              Restaurant
            </div>

            {/* MENU */}

            <button
              type="button"
              className={
                `admin-nav-item ${
                  isActive("/admin/menu")
                    ? "active"
                    : ""
                }`
              }
              onClick={() => {
                navigate("/admin/menu");
                setSidebarOpen(false);
              }}
            >
              <span className="admin-nav-icon">
                🍽
              </span>

              Menu
            </button>

            {/* SETTINGS */}

            <button
              type="button"
              className={
                `admin-nav-item ${
                  isActive("/admin/settings")
                    ? "active"
                    : ""
                }`
              }
              onClick={() => {
                navigate("/admin/settings");
                setSidebarOpen(false);
              }}
            >
              <span className="admin-nav-icon">
                ⚙
              </span>

              Settings
            </button>

          </nav>

        </aside>

        {/* =================================================
            MOBILE OVERLAY
        ================================================= */}

        <div
          className={`admin-sidebar-overlay ${
            sidebarOpen ? "open" : ""
          }`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* =================================================
            PAGE CONTENT
        ================================================= */}

        <main className="admin-main">
          <Outlet />
        </main>

      </div>

    </div>
  );
}

export default AdminLayout;