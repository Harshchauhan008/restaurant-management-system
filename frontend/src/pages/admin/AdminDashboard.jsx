import { useEffect, useMemo, useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080/api";

function AdminDashboard() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================================================
  // GET ADMIN TOKEN
  // =====================================================
  //
  // Admin dashboard uses the adminToken.
  // This keeps the admin session independent from
  // kitchen / waiter / cashier sessions.
  // =====================================================

  const getToken = () => {
    return localStorage.getItem("adminToken") || "";
  };

  // =====================================================
  // LOAD DASHBOARD DATA
  // =====================================================

  const loadTables = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        throw new Error(
          "Admin login session not found. Please login again."
        );
      }

      const response = await fetch(
        `${API_BASE_URL}/admin/tables`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            "Your admin session has expired. Please login again."
          );
        }

        if (response.status === 403) {
          throw new Error(
            "You do not have permission to view dashboard data."
          );
        }

        throw new Error(
          data?.message ||
            data?.error ||
            `Failed to load dashboard data (${response.status})`
        );
      }

      setTables(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      console.error(
        "Admin dashboard error:",
        err
      );

      setError(
        err.message ||
          "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOGOUT
  // =====================================================
  //
  // IMPORTANT:
  // Remove ONLY admin session.
  //
  // Do NOT remove:
  // kitchenToken
  // waiterToken
  // cashierToken
  // receptionToken
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem("adminToken");

    // Optional admin-only values
    localStorage.removeItem("adminEmployeeId");
    localStorage.removeItem("adminFullName");

    window.location.href = "/login";
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    loadTables();
  }, []);

  // =====================================================
  // TABLE STATISTICS
  // =====================================================

  const totalTables = tables.length;

  const availableTables = tables.filter(
    (table) =>
      table.status === "AVAILABLE"
  ).length;

  const occupiedTables = tables.filter(
    (table) =>
      table.status === "OCCUPIED"
  ).length;

  const activeTables = tables.filter(
    (table) =>
      table.active
  ).length;

  const reservedTables = tables.filter(
    (table) =>
      table.status === "RESERVED"
  ).length;

  // =====================================================
  // OCCUPANCY RATE
  // =====================================================

  const occupancyRate = useMemo(() => {
    if (totalTables === 0) {
      return 0;
    }

    return Math.round(
      (occupiedTables / totalTables) * 100
    );
  }, [
    occupiedTables,
    totalTables,
  ]);

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <>
      <style>
        {`

          * {
            box-sizing: border-box;
          }

          /* =================================================
             TOPBAR
          ================================================= */

          .admin-topbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            margin-bottom: 32px;
          }

          .admin-topbar h1 {
            margin: 0;
            color: #fffaf5;
            font-family:
              Georgia,
              "Times New Roman",
              serif;
            font-size:
              clamp(2rem, 4vw, 3rem);
            font-weight: 600;
          }

          .admin-topbar p {
            margin: 7px 0 0;
            color: #958981;
            font-size: 0.92rem;
          }

          .admin-topbar-actions {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
          }

          /* =================================================
             REFRESH BUTTON
          ================================================= */

          .admin-refresh-button {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 11px 16px;
            border:
              1px solid
              rgba(201,123,74,0.30);
            border-radius: 9px;
            background:
              rgba(201,123,74,0.10);
            color: #e3a16f;
            font: inherit;
            font-size: 0.85rem;
            font-weight: 600;
            cursor: pointer;
            transition:
              background 0.2s ease,
              transform 0.2s ease;
          }

          .admin-refresh-button:hover {
            background:
              rgba(201,123,74,0.18);

            transform:
              translateY(-1px);
          }

          .admin-refresh-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
          }

          /* =================================================
             LOGOUT BUTTON
          ================================================= */

          .admin-logout-button {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 11px 17px;
            border:
              1px solid
              rgba(205,105,72,0.35);
            border-radius: 9px;
            background:
              rgba(125,52,42,0.22);
            color: #f0ad9f;
            font: inherit;
            font-size: 0.85rem;
            font-weight: 700;
            cursor: pointer;
            transition:
              background 0.2s ease,
              border-color 0.2s ease,
              transform 0.2s ease;
          }

          .admin-logout-button:hover {
            background:
              rgba(145,60,46,0.34);

            border-color:
              rgba(225,111,88,0.5);

            transform:
              translateY(-1px);
          }

          .admin-logout-button:active {
            transform:
              translateY(0);
          }

          /* =================================================
             STATS
          ================================================= */

          .admin-stats {
            display: grid;
            grid-template-columns:
              repeat(4, minmax(0, 1fr));
            gap: 18px;
            margin-bottom: 28px;
          }

          .admin-stat-card {
            position: relative;
            overflow: hidden;
            padding: 22px;
            background: #211b18;
            border:
              1px solid
              rgba(255,255,255,0.07);
            border-radius: 14px;
            box-shadow:
              0 12px 30px
              rgba(0,0,0,0.16);
          }

          .admin-stat-card::after {
            content: "";
            position: absolute;
            right: -35px;
            bottom: -35px;
            width: 110px;
            height: 110px;
            border-radius: 50%;
            background:
              rgba(201,123,74,0.07);
          }

          .admin-stat-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
          }

          .admin-stat-label {
            color: #91857d;
            font-size: 0.78rem;
            font-weight: 600;
            letter-spacing: 0.04em;
            text-transform: uppercase;
          }

          .admin-stat-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 38px;
            height: 38px;
            border:
              1px solid
              rgba(201,123,74,0.18);
            border-radius: 10px;
            background:
              rgba(201,123,74,0.08);
            color: #e3a16f;
            font-size: 1rem;
          }

          .admin-stat-value {
            margin-top: 14px;
            color: #fffaf5;
            font-family:
              Georgia,
              "Times New Roman",
              serif;
            font-size: 2.1rem;
            font-weight: 600;
          }

          .admin-stat-description {
            margin-top: 6px;
            color: #756b64;
            font-size: 0.8rem;
          }

          /* =================================================
             OVERVIEW
          ================================================= */

          .admin-overview {
            display: grid;
            grid-template-columns:
              1.35fr 0.65fr;
            gap: 18px;
            margin-bottom: 28px;
          }

          .admin-panel {
            background: #211b18;
            border:
              1px solid
              rgba(255,255,255,0.07);
            border-radius: 14px;
            box-shadow:
              0 12px 30px
              rgba(0,0,0,0.14);
          }

          .admin-panel-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
            padding: 20px 22px;
            border-bottom:
              1px solid
              rgba(255,255,255,0.07);
          }

          .admin-panel-header h2 {
            margin: 0;
            color: #f8f0e9;
            font-family:
              Georgia,
              "Times New Roman",
              serif;
            font-size: 1.2rem;
            font-weight: 600;
          }

          .admin-panel-header span {
            color: #756b64;
            font-size: 0.78rem;
          }

          .admin-panel-body {
            padding: 22px;
          }

          /* =================================================
             OCCUPANCY
          ================================================= */

          .admin-occupancy-number {
            margin-bottom: 13px;
            color: #fffaf5;
            font-family:
              Georgia,
              "Times New Roman",
              serif;
            font-size: 2.4rem;
          }

          .admin-progress {
            width: 100%;
            height: 10px;
            overflow: hidden;
            border-radius: 999px;
            background: #302824;
          }

          .admin-progress-bar {
            height: 100%;
            border-radius: inherit;
            background:
              linear-gradient(
                90deg,
                #a65f32,
                #d8935f
              );
            transition:
              width 0.4s ease;
          }

          .admin-occupancy-text {
            margin-top: 11px;
            color: #8c8179;
            font-size: 0.83rem;
          }

          /* =================================================
             QUICK SUMMARY
          ================================================= */

          .admin-info-list {
            display: grid;
            gap: 14px;
          }

          .admin-info-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
            padding-bottom: 14px;
            border-bottom:
              1px solid
              rgba(255,255,255,0.06);
          }

          .admin-info-row:last-child {
            padding-bottom: 0;
            border-bottom: 0;
          }

          .admin-info-label {
            color: #867b74;
            font-size: 0.83rem;
          }

          .admin-info-value {
            color: #f5ede7;
            font-size: 0.85rem;
            font-weight: 600;
          }

          /* =================================================
             ERROR
          ================================================= */

          .admin-error {
            padding: 18px 20px;
            margin-bottom: 20px;
            background:
              rgba(125,52,42,0.16);
            border:
              1px solid
              rgba(205,92,75,0.26);
            border-radius: 11px;
            color: #e59a8b;
          }

          .admin-error strong {
            display: block;
            margin-bottom: 5px;
            color: #f0ad9f;
          }

          .admin-retry {
            margin-top: 12px;
            padding: 8px 13px;
            border:
              1px solid
              rgba(205,92,75,0.3);
            border-radius: 7px;
            background: transparent;
            color: #eca493;
            cursor: pointer;
          }

          .admin-retry:hover {
            background:
              rgba(205,92,75,0.08);
          }

          /* =================================================
             LOADING
          ================================================= */

          .admin-loading {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 300px;
            color: #91857d;
          }

          .admin-spinner {
            width: 25px;
            height: 25px;
            margin-right: 12px;
            border:
              3px solid
              #3a302b;
            border-top-color:
              #d38a55;
            border-radius: 50%;
            animation:
              adminSpin
              0.8s linear infinite;
          }

          @keyframes adminSpin {
            to {
              transform:
                rotate(360deg);
            }
          }

          /* =================================================
             RESPONSIVE
          ================================================= */

          @media (max-width: 1100px) {

            .admin-stats {
              grid-template-columns:
                repeat(2, minmax(0, 1fr));
            }

            .admin-overview {
              grid-template-columns:
                1fr;
            }

          }

          @media (max-width: 650px) {

            .admin-topbar {
              align-items: flex-start;
              flex-direction: column;
            }

            .admin-topbar-actions {
              width: 100%;
              display: grid;
              grid-template-columns:
                repeat(
                  2,
                  minmax(0, 1fr)
                );
            }

            .admin-refresh-button,
            .admin-logout-button {
              width: 100%;
            }

          }

          @media (max-width: 560px) {

            .admin-stats {
              grid-template-columns:
                1fr;
            }

            .admin-topbar-actions {
              grid-template-columns:
                1fr;
            }

          }

        `}
      </style>

      {/* =================================================
          DASHBOARD HEADER
      ================================================= */}

      <div className="admin-topbar">

        <div>

          <h1>
            Dashboard
          </h1>

          <p>
            Overview of your restaurant operations
          </p>

        </div>

        <div className="admin-topbar-actions">

          {/* REFRESH */}

          <button
            type="button"
            className="admin-refresh-button"
            onClick={loadTables}
            disabled={loading}
          >
            ↻{" "}
            {loading
              ? "Refreshing..."
              : "Refresh"}
          </button>

          {/* LOGOUT */}

          <button
            type="button"
            className="admin-logout-button"
            onClick={handleLogout}
          >
            ↪{" "}
            Logout
          </button>

        </div>

      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (

        <div className="admin-error">

          <strong>
            Unable to load dashboard data
          </strong>

          <div>
            {error}
          </div>

          <button
            type="button"
            className="admin-retry"
            onClick={loadTables}
          >
            Try Again
          </button>

        </div>

      )}

      {/* =================================================
          STATS
      ================================================= */}

      <section className="admin-stats">

        {/* TOTAL TABLES */}

        <div className="admin-stat-card">

          <div className="admin-stat-top">

            <span className="admin-stat-label">
              Total Tables
            </span>

            <span className="admin-stat-icon">
              ◫
            </span>

          </div>

          <div className="admin-stat-value">
            {totalTables}
          </div>

          <div className="admin-stat-description">
            All restaurant tables
          </div>

        </div>

        {/* AVAILABLE */}

        <div className="admin-stat-card">

          <div className="admin-stat-top">

            <span className="admin-stat-label">
              Available
            </span>

            <span className="admin-stat-icon">
              ✓
            </span>

          </div>

          <div className="admin-stat-value">
            {availableTables}
          </div>

          <div className="admin-stat-description">
            Ready for customers
          </div>

        </div>

        {/* OCCUPIED */}

        <div className="admin-stat-card">

          <div className="admin-stat-top">

            <span className="admin-stat-label">
              Occupied
            </span>

            <span className="admin-stat-icon">
              ●
            </span>

          </div>

          <div className="admin-stat-value">
            {occupiedTables}
          </div>

          <div className="admin-stat-description">
            Currently in use
          </div>

        </div>

        {/* ACTIVE */}

        <div className="admin-stat-card">

          <div className="admin-stat-top">

            <span className="admin-stat-label">
              Active Tables
            </span>

            <span className="admin-stat-icon">
              ◉
            </span>

          </div>

          <div className="admin-stat-value">
            {activeTables}
          </div>

          <div className="admin-stat-description">
            Enabled for service
          </div>

        </div>

      </section>

      {/* =================================================
          OVERVIEW
      ================================================= */}

      <section className="admin-overview">

        {/* OCCUPANCY */}

        <div className="admin-panel">

          <div className="admin-panel-header">

            <h2>
              Table Occupancy
            </h2>

            <span>
              Live overview
            </span>

          </div>

          <div className="admin-panel-body">

            <div className="admin-occupancy-number">
              {occupancyRate}%
            </div>

            <div className="admin-progress">

              <div
                className="admin-progress-bar"
                style={{
                  width:
                    `${occupancyRate}%`,
                }}
              />

            </div>

            <div className="admin-occupancy-text">

              {occupiedTables} of{" "}
              {totalTables} tables are currently
              occupied.

            </div>

          </div>

        </div>

        {/* QUICK SUMMARY */}

        <div className="admin-panel">

          <div className="admin-panel-header">

            <h2>
              Quick Summary
            </h2>

          </div>

          <div className="admin-panel-body">

            <div className="admin-info-list">

              <div className="admin-info-row">

                <span className="admin-info-label">
                  Available
                </span>

                <strong className="admin-info-value">
                  {availableTables}
                </strong>

              </div>

              <div className="admin-info-row">

                <span className="admin-info-label">
                  Occupied
                </span>

                <strong className="admin-info-value">
                  {occupiedTables}
                </strong>

              </div>

              <div className="admin-info-row">

                <span className="admin-info-label">
                  Reserved
                </span>

                <strong className="admin-info-value">
                  {reservedTables}
                </strong>

              </div>

              <div className="admin-info-row">

                <span className="admin-info-label">
                  Active
                </span>

                <strong className="admin-info-value">
                  {activeTables}
                </strong>

              </div>

            </div>

          </div>

        </div>

      </section>

    </>
  );
}

export default AdminDashboard;