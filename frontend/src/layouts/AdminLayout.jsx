import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  // =====================================================
  // ADMIN AUTHENTICATION CHECK
  // =====================================================

  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");
    const role = localStorage.getItem("role");

    // No admin login -> go to login
    if (!adminToken || role !== "ADMIN") {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  const isActive = (path) => {
    return location.pathname === path;
  };

  // =====================================================
  // ALSO PREVENT CONTENT FROM FLASHING BEFORE CHECK
  // =====================================================

  const adminToken = localStorage.getItem("adminToken");
  const role = localStorage.getItem("role");

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
             RESPONSIVE
          ================================================= */

          @media (max-width: 800px) {

            .admin-sidebar {
              display: none;
            }

            .admin-main {
              padding: 22px;
            }
          }
        `}
      </style>

      <div className="admin-shell">

        {/* =================================================
            SIDEBAR
        ================================================= */}

        <aside className="admin-sidebar">

          <div className="admin-brand">

            <span className="admin-brand-small">
              THE LOOKOUT
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
              onClick={() =>
                navigate("/admin")
              }
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
              onClick={() =>
                navigate("/admin/tables")
              }
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
              onClick={() =>
                navigate("/admin/orders")
              }
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
              onClick={() =>
                navigate("/admin/billing")
              }
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
              onClick={() =>
                navigate("/admin/reservations")
              }
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
              onClick={() =>
                navigate("/admin/employees")
              }
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
              onClick={() =>
                navigate("/admin/menu")
              }
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
              onClick={() =>
                navigate("/admin/settings")
              }
            >
              <span className="admin-nav-icon">
                ⚙
              </span>

              Settings
            </button>

          </nav>

        </aside>

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