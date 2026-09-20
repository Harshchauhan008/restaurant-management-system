import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080/api";

const FRONTEND_URL =
  import.meta.env.VITE_FRONTEND_URL || "http://localhost:5173";

function AdminTables() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAddTableModal, setShowAddTableModal] =
    useState(false);

  const [showQrModal, setShowQrModal] =
    useState(false);

  const [selectedTable, setSelectedTable] =
    useState(null);

  const [tableNumber, setTableNumber] =
    useState("");

  const [capacity, setCapacity] =
    useState("");

  const [location, setLocation] =
    useState("");

  const [creatingTable, setCreatingTable] =
    useState(false);

  const [qrLoading, setQrLoading] =
    useState(false);

  const [formError, setFormError] =
    useState("");

  const [qrError, setQrError] =
    useState("");

  const token =
    localStorage.getItem("token");

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    loadTables();
  }, []);

  // =====================================================
  // LOAD TABLES
  // =====================================================

  const loadTables = async () => {
    try {
      setLoading(true);
      setError("");

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
            "You do not have permission to view the tables."
          );
        }

        throw new Error(
          data?.message ||
            `Failed to load tables (${response.status})`
        );
      }

      setTables(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      setError(
        err.message ||
          "Unable to load table data."
      );

      setTables([]);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // TABLE STATUS CLASS
  // =====================================================

  const getTableStatusClass = (status) => {
    switch (status) {
      case "AVAILABLE":
        return "available";

      case "OCCUPIED":
        return "occupied";

      case "RESERVED":
        return "reserved";

      default:
        return "unknown";
    }
  };

  // =====================================================
  // ADD TABLE
  // =====================================================

  const openAddTableModal = () => {
    setTableNumber("");
    setCapacity("");
    setLocation("");
    setFormError("");

    setShowAddTableModal(true);
  };

  const closeAddTableModal = () => {
    if (creatingTable) {
      return;
    }

    setShowAddTableModal(false);
    setFormError("");
  };

  // =====================================================
  // CREATE TABLE
  // =====================================================

  const createTable = async (event) => {
    event.preventDefault();

    setFormError("");

    if (!tableNumber.trim()) {
      setFormError(
        "Table number is required."
      );

      return;
    }

    if (
      !capacity ||
      Number(capacity) <= 0
    ) {
      setFormError(
        "Capacity must be greater than zero."
      );

      return;
    }

    try {
      setCreatingTable(true);

      const response = await fetch(
        `${API_BASE_URL}/admin/tables`,
        {
          method: "POST",

          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            tableNumber:
              tableNumber.trim(),

            capacity:
              Number(capacity),

            location:
              location.trim(),
          }),
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Failed to create table (${response.status})`
        );
      }

      setShowAddTableModal(false);

      setTableNumber("");
      setCapacity("");
      setLocation("");

      await loadTables();

      // -------------------------------------------------
      // OPEN QR FOR NEW TABLE
      // -------------------------------------------------

      if (data?.qrToken) {
        setSelectedTable(data);
        setShowQrModal(true);
      }
    } catch (err) {
      setFormError(
        err.message ||
          "Unable to create table."
      );
    } finally {
      setCreatingTable(false);
    }
  };

  // =====================================================
  // QR URL
  // =====================================================

  const getOrderUrl = (table) => {
    if (!table?.qrToken) {
      return "";
    }

    return (
      `${FRONTEND_URL}/menu?table=` +
      `${table.qrToken}`
    );
  };

  // =====================================================
  // OPEN QR MODAL
  // =====================================================

  const openQrModal = (table) => {
    setQrError("");
    setSelectedTable(table);
    setShowQrModal(true);
  };

  // =====================================================
  // CLOSE QR MODAL
  // =====================================================

  const closeQrModal = () => {
    if (qrLoading) {
      return;
    }

    setShowQrModal(false);
    setSelectedTable(null);
    setQrError("");
  };

  // =====================================================
  // REGENERATE QR
  // =====================================================

  const regenerateQr = async () => {
    if (!selectedTable) {
      return;
    }

    const confirmed =
      window.confirm(
        `Regenerate QR code for ${selectedTable.tableNumber}?\n\nThe old QR code will stop working.`
      );

    if (!confirmed) {
      return;
    }

    try {
      setQrLoading(true);
      setQrError("");

      const response = await fetch(
        `${API_BASE_URL}/admin/tables/${selectedTable.id}/qr/regenerate`,
        {
          method: "POST",

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
        throw new Error(
          data?.message ||
            `Failed to regenerate QR (${response.status})`
        );
      }

      const updatedTable = {
        ...selectedTable,
        qrToken: data.qrToken,
      };

      setSelectedTable(updatedTable);

      setTables((currentTables) =>
        currentTables.map((table) =>
          table.id === selectedTable.id
            ? {
                ...table,
                qrToken: data.qrToken,
              }
            : table
        )
      );
    } catch (err) {
      setQrError(
        err.message ||
          "Unable to regenerate QR code."
      );
    } finally {
      setQrLoading(false);
    }
  };

  // =====================================================
  // DOWNLOAD QR
  // =====================================================

  const downloadQr = () => {
    if (!selectedTable) {
      return;
    }

    const canvas =
      document.getElementById(
        "restaurant-table-qr"
      );

    if (!canvas) {
      setQrError(
        "QR image is not ready."
      );

      return;
    }

    const image =
      canvas.toDataURL("image/png");

    const link =
      document.createElement("a");

    link.href = image;

    link.download =
      `${selectedTable.tableNumber}-QR.png`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
  };

  // =====================================================
  // PRINT QR
  // =====================================================

  const printQr = () => {
    if (!selectedTable) {
      return;
    }

    const canvas =
      document.getElementById(
        "restaurant-table-qr"
      );

    if (!canvas) {
      setQrError(
        "QR image is not ready."
      );

      return;
    }

    const image =
      canvas.toDataURL("image/png");

    const printWindow =
      window.open(
        "",
        "_blank",
        "width=600,height=700"
      );

    if (!printWindow) {
      setQrError(
        "Please allow pop-ups to print the QR."
      );

      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>

        <head>

          <title>
            ${selectedTable.tableNumber} QR Code
          </title>

          <style>

            body {
              margin: 0;
              min-height: 100vh;
              display: flex;
              justify-content: center;
              align-items: center;
              font-family: Arial, sans-serif;
              background: white;
            }

            .qr-sheet {
              text-align: center;
            }

            h1 {
              margin-bottom: 8px;
            }

            h2 {
              margin-bottom: 8px;
            }

            p {
              color: #555;
              margin-bottom: 20px;
            }

            img {
              width: 320px;
              height: 320px;
            }

          </style>

        </head>

        <body>

          <div class="qr-sheet">

            <h1>
              Restaurant
            </h1>

            <h2>
              Table ${selectedTable.tableNumber}
            </h2>

            <p>
              Scan to view menu & place order
            </p>

            <img
              src="${image}"
            />

          </div>

          <script>

            window.onload = function () {
              window.print();
            };

          <\/script>

        </body>

      </html>
    `);

    printWindow.document.close();
  };

  // =====================================================
  // STATS
  // =====================================================

  const totalTables =
    tables.length;

  const availableTables =
    tables.filter(
      (table) =>
        table.status === "AVAILABLE"
    ).length;

  const occupiedTables =
    tables.filter(
      (table) =>
        table.status === "OCCUPIED"
    ).length;

  const reservedTables =
    tables.filter(
      (table) =>
        table.status === "RESERVED"
    ).length;

  const activeTables =
    tables.filter(
      (table) =>
        table.active
    ).length;

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
            margin:
              7px 0 0;
            color: #958981;
            font-size: 0.92rem;
          }

          .admin-topbar-actions {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .admin-refresh-button,
          .admin-add-button {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 11px 16px;
            border:
              1px solid
              rgba(201,123,74,0.30);
            border-radius: 9px;
            font: inherit;
            font-size: 0.85rem;
            font-weight: 600;
            cursor: pointer;
            transition:
              0.2s ease;
          }

          .admin-refresh-button {
            background:
              rgba(201,123,74,0.10);
            color: #e3a16f;
          }

          .admin-add-button {
            background:
              #c97b4a;
            color:
              #fffaf5;
            border-color:
              #c97b4a;
          }

          .admin-refresh-button:hover {
            background:
              rgba(201,123,74,0.18);
          }

          .admin-add-button:hover {
            background:
              #d58b5b;
          }

          .admin-refresh-button:disabled,
          .admin-add-button:disabled,
          .qr-action-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
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
            letter-spacing:
              0.04em;
            text-transform:
              uppercase;
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
             PANEL
          ================================================= */

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

          /* =================================================
             TABLE GRID
          ================================================= */

          .admin-table-grid {
            display: grid;
            grid-template-columns:
              repeat(3, minmax(0, 1fr));
            gap: 15px;
            padding: 22px;
          }

          .admin-table-card {
            position: relative;
            padding: 19px;
            overflow: hidden;
            background: #181411;
            border:
              1px solid
              rgba(255,255,255,0.07);
            border-radius: 12px;
            transition:
              0.2s ease;
          }

          .admin-table-card:hover {
            transform:
              translateY(-2px);
            border-color:
              rgba(201,123,74,0.30);
          }

          .admin-table-card-top {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 12px;
          }

          .admin-table-number {
            color: #fffaf5;
            font-family:
              Georgia,
              "Times New Roman",
              serif;
            font-size: 1.4rem;
            font-weight: 600;
          }

          .admin-table-status {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 5px 9px;
            border-radius: 999px;
            font-size: 0.68rem;
            font-weight: 700;
            letter-spacing: 0.03em;
            white-space: nowrap;
          }

          .admin-table-status::before {
            content: "";
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background:
              currentColor;
          }

          .admin-table-status.available {
            color: #78be91;
            background:
              rgba(82,166,107,0.10);
          }

          .admin-table-status.occupied {
            color: #e4a26f;
            background:
              rgba(201,123,74,0.10);
          }

          .admin-table-status.reserved {
            color: #c4a4dc;
            background:
              rgba(155,111,191,0.10);
          }

          .admin-table-status.unknown {
            color: #b5ada7;
            background:
              rgba(255,255,255,0.06);
          }

          .admin-table-details {
            display: grid;
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
            gap: 10px;
            margin-top: 18px;
          }

          .admin-table-detail {
            padding: 10px;
            background:
              #211b18;
            border-radius:
              8px;
          }

          .admin-table-detail span {
            display: block;
            margin-bottom: 4px;
            color: #746961;
            font-size: 0.67rem;
            text-transform:
              uppercase;
            letter-spacing:
              0.05em;
          }

          .admin-table-detail strong {
            color: #d7cec7;
            font-size: 0.8rem;
            font-weight: 600;
          }

          .admin-table-active {
            margin-top: 13px;
            color: #6f655f;
            font-size: 0.72rem;
          }

          .admin-table-actions {
            display: flex;
            gap: 8px;
            margin-top: 15px;
          }

          .qr-card-button {
            flex: 1;
            padding: 10px 12px;
            border:
              1px solid
              rgba(201,123,74,0.28);
            border-radius: 8px;
            background:
              rgba(201,123,74,0.08);
            color: #d99a6d;
            font: inherit;
            font-size: 0.78rem;
            font-weight: 600;
            cursor: pointer;
          }

          .qr-card-button:hover {
            background:
              rgba(201,123,74,0.16);
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
            border-radius:
              50%;
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
             MODAL
          ================================================= */

          .admin-modal-overlay {
            position: fixed;
            inset: 0;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background:
              rgba(0,0,0,0.70);
            backdrop-filter:
              blur(5px);
          }

          .admin-modal {
            width: 100%;
            max-width: 460px;
            max-height: 90vh;
            overflow-y: auto;
            padding: 28px;
            background:
              #211b18;
            border:
              1px solid
              rgba(255,255,255,0.08);
            border-radius: 16px;
            box-shadow:
              0 25px 80px
              rgba(0,0,0,0.45);
          }

          .admin-modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
            margin-bottom: 22px;
          }

          .admin-modal-header h2 {
            margin: 0;
            color: #fffaf5;
            font-family:
              Georgia,
              "Times New Roman",
              serif;
            font-size: 1.45rem;
          }

          .admin-modal-close {
            width: 34px;
            height: 34px;
            border:
              1px solid
              rgba(255,255,255,0.08);
            border-radius: 8px;
            background:
              rgba(255,255,255,0.04);
            color: #bcaea6;
            font-size: 1.1rem;
            cursor: pointer;
          }

          .admin-modal-close:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .admin-form-group {
            margin-bottom: 17px;
          }

          .admin-form-group label {
            display: block;
            margin-bottom: 7px;
            color: #d9cec6;
            font-size: 0.82rem;
            font-weight: 600;
          }

          .admin-form-input {
            width: 100%;
            padding: 12px 13px;
            border:
              1px solid
              rgba(255,255,255,0.09);
            border-radius: 8px;
            outline: none;
            background:
              #181411;
            color: #f5ede7;
            font: inherit;
          }

          .admin-form-input:focus {
            border-color:
              rgba(201,123,74,0.50);
          }

          .admin-form-input:disabled {
            opacity: 0.55;
          }

          .admin-form-error,
          .qr-error {
            padding: 11px 12px;
            margin-bottom: 16px;
            border-radius: 8px;
            background:
              rgba(125,52,42,0.16);
            border:
              1px solid
              rgba(205,92,75,0.25);
            color: #e59a8b;
            font-size: 0.8rem;
          }

          .admin-modal-actions {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 22px;
          }

          .modal-cancel-button,
          .modal-submit-button {
            padding: 11px 16px;
            border-radius: 8px;
            font: inherit;
            font-size: 0.82rem;
            font-weight: 600;
            cursor: pointer;
          }

          .modal-cancel-button {
            border:
              1px solid
              rgba(255,255,255,0.09);
            background:
              transparent;
            color: #bcaea6;
          }

          .modal-cancel-button:disabled,
          .modal-submit-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .modal-submit-button {
            border:
              1px solid
              #c97b4a;
            background:
              #c97b4a;
            color: white;
          }

          /* =================================================
             QR MODAL
          ================================================= */

          .qr-modal {
            max-width: 500px;
            text-align: center;
          }

          .qr-table-name {
            margin-top: -8px;
            margin-bottom: 20px;
            color: #d9cec6;
            font-size: 0.9rem;
          }

          .qr-container {
            display: flex;
            justify-content: center;
            padding: 22px;
            margin-bottom: 18px;
            border-radius: 12px;
            background: white;
          }

          .qr-url {
            padding: 12px;
            margin-bottom: 18px;
            overflow-wrap: anywhere;
            border-radius: 8px;
            background:
              #181411;
            color: #a99b92;
            font-size: 0.72rem;
            line-height: 1.5;
          }

          .qr-action-buttons {
            display: grid;
            grid-template-columns:
              repeat(3, 1fr);
            gap: 9px;
          }

          .qr-action-button {
            padding: 11px 9px;
            border:
              1px solid
              rgba(201,123,74,0.28);
            border-radius: 8px;
            background:
              rgba(201,123,74,0.09);
            color: #d99a6d;
            font: inherit;
            font-size: 0.76rem;
            font-weight: 600;
            cursor: pointer;
          }

          .qr-action-button:hover {
            background:
              rgba(201,123,74,0.17);
          }

          /* =================================================
             RESPONSIVE
          ================================================= */

          @media (max-width: 1100px) {

            .admin-stats {
              grid-template-columns:
                repeat(2, minmax(0, 1fr));
            }

            .admin-table-grid {
              grid-template-columns:
                repeat(2, minmax(0, 1fr));
            }

          }

          @media (max-width: 650px) {

            .admin-topbar {
              align-items:
                flex-start;
              flex-direction:
                column;
            }

            .admin-topbar-actions {
              width: 100%;
            }

            .admin-refresh-button,
            .admin-add-button {
              flex: 1;
            }

            .admin-table-grid {
              grid-template-columns:
                1fr;
            }

            .qr-action-buttons {
              grid-template-columns:
                1fr;
            }

          }

          @media (max-width: 560px) {

            .admin-stats {
              grid-template-columns:
                1fr;
            }

          }

        `}
      </style>

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="admin-topbar">

        <div>

          <h1>
            Tables
          </h1>

          <p>
            Manage restaurant tables and their QR codes
          </p>

        </div>

        <div className="admin-topbar-actions">

          <button
            className="admin-add-button"
            onClick={
              openAddTableModal
            }
          >
            + Add Table
          </button>

          <button
            className="admin-refresh-button"
            onClick={
              loadTables
            }
            disabled={
              loading
            }
          >
            ↻

            {
              loading
                ? "Refreshing..."
                : "Refresh"
            }

          </button>

        </div>

      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (

        <div className="admin-error">

          <strong>
            Unable to load table data
          </strong>

          <div>
            {error}
          </div>

          <button
            className="admin-retry"
            onClick={
              loadTables
            }
          >
            Try Again
          </button>

        </div>

      )}

      {/* =================================================
          STATS
      ================================================= */}

      <section className="admin-stats">

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
          TABLE MANAGEMENT
      ================================================= */}

      <section className="admin-panel">

        <div className="admin-panel-header">

          <h2>
            Restaurant Tables
          </h2>

          <span>
            {totalTables} tables
          </span>

        </div>

        {loading ? (

          <div className="admin-loading">

            <div className="admin-spinner"></div>

            Loading tables...

          </div>

        ) : tables.length === 0 ? (

          <div className="admin-empty">
            No tables found.
          </div>

        ) : (

          <div className="admin-table-grid">

            {
              tables.map(
                (table) => (

                  <article
                    className="admin-table-card"
                    key={
                      table.id
                    }
                  >

                    <div className="admin-table-card-top">

                      <div className="admin-table-number">
                        {
                          table.tableNumber
                        }
                      </div>

                      <span
                        className={
                          `admin-table-status ${
                            getTableStatusClass(
                              table.status
                            )
                          }`
                        }
                      >
                        {
                          table.status
                        }
                      </span>

                    </div>

                    <div className="admin-table-details">

                      <div className="admin-table-detail">

                        <span>
                          Capacity
                        </span>

                        <strong>
                          {
                            table.capacity
                          } seats
                        </strong>

                      </div>

                      <div className="admin-table-detail">

                        <span>
                          Location
                        </span>

                        <strong>
                          {
                            table.location ||
                            "—"
                          }
                        </strong>

                      </div>

                    </div>

                    <div className="admin-table-active">

                      {
                        table.active
                          ? "● Table active"
                          : "○ Table disabled"
                      }

                    </div>

                    {
                      table.active &&
                      table.qrToken && (

                        <div className="admin-table-actions">

                          <button
                            type="button"
                            className="qr-card-button"
                            onClick={() =>
                              openQrModal(
                                table
                              )
                            }
                          >
                            ▣ View QR
                          </button>

                        </div>

                      )
                    }

                  </article>

                )
              )
            }

          </div>

        )}

      </section>

      {/* =================================================
          ADD TABLE MODAL
      ================================================= */}

      {
        showAddTableModal && (

          <div
            className="admin-modal-overlay"
            onMouseDown={(
              event
            ) => {

              if (
                event.target ===
                  event.currentTarget &&
                !creatingTable
              ) {

                closeAddTableModal();

              }

            }}
          >

            <div className="admin-modal">

              <div className="admin-modal-header">

                <h2>
                  Add New Table
                </h2>

                <button
                  type="button"
                  className="admin-modal-close"
                  onClick={
                    closeAddTableModal
                  }
                  disabled={
                    creatingTable
                  }
                >
                  ×
                </button>

              </div>

              <form
                onSubmit={
                  createTable
                }
              >

                <div className="admin-form-group">

                  <label>
                    Table Number
                  </label>

                  <input
                    className="admin-form-input"
                    type="text"
                    placeholder="e.g. T06"
                    value={
                      tableNumber
                    }
                    onChange={(
                      event
                    ) =>
                      setTableNumber(
                        event.target
                          .value
                      )
                    }
                    disabled={
                      creatingTable
                    }
                  />

                </div>

                <div className="admin-form-group">

                  <label>
                    Capacity
                  </label>

                  <input
                    className="admin-form-input"
                    type="number"
                    min="1"
                    placeholder="e.g. 4"
                    value={
                      capacity
                    }
                    onChange={(
                      event
                    ) =>
                      setCapacity(
                        event.target
                          .value
                      )
                    }
                    disabled={
                      creatingTable
                    }
                  />

                </div>

                <div className="admin-form-group">

                  <label>
                    Location
                  </label>

                  <input
                    className="admin-form-input"
                    type="text"
                    placeholder="e.g. Rooftop"
                    value={
                      location
                    }
                    onChange={(
                      event
                    ) =>
                      setLocation(
                        event.target
                          .value
                      )
                    }
                    disabled={
                      creatingTable
                    }
                  />

                </div>

                {
                  formError && (

                    <div className="admin-form-error">
                      {
                        formError
                      }
                    </div>

                  )
                }

                <div className="admin-modal-actions">

                  <button
                    type="button"
                    className="modal-cancel-button"
                    onClick={
                      closeAddTableModal
                    }
                    disabled={
                      creatingTable
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="modal-submit-button"
                    disabled={
                      creatingTable
                    }
                  >
                    {
                      creatingTable
                        ? "Creating..."
                        : "Create Table"
                    }
                  </button>

                </div>

              </form>

            </div>

          </div>

        )
      }

      {/* =================================================
          QR MODAL
      ================================================= */}

      {
        showQrModal &&
        selectedTable && (

          <div
            className="admin-modal-overlay"
            onMouseDown={(
              event
            ) => {

              if (
                event.target ===
                  event.currentTarget &&
                !qrLoading
              ) {

                closeQrModal();

              }

            }}
          >

            <div className="admin-modal qr-modal">

              <div className="admin-modal-header">

                <h2>
                  Table QR Code
                </h2>

                <button
                  type="button"
                  className="admin-modal-close"
                  onClick={
                    closeQrModal
                  }
                  disabled={
                    qrLoading
                  }
                >
                  ×
                </button>

              </div>

              <div className="qr-table-name">

                <strong>
                  {
                    selectedTable.tableNumber
                  }
                </strong>

                {" · "}

                {
                  selectedTable.location ||
                  "Restaurant"
                }

              </div>

              {
                qrError && (

                  <div className="qr-error">
                    {
                      qrError
                    }
                  </div>

                )
              }

              <div className="qr-container">

                <QRCodeCanvas
                  id="restaurant-table-qr"
                  value={
                    getOrderUrl(
                      selectedTable
                    )
                  }
                  size={280}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  level="H"
                  includeMargin
                />

              </div>

              <div className="qr-url">
                {
                  getOrderUrl(
                    selectedTable
                  )
                }
              </div>

              <div className="qr-action-buttons">

                <button
                  type="button"
                  className="qr-action-button"
                  onClick={
                    downloadQr
                  }
                >
                  ↓ Download
                </button>

                <button
                  type="button"
                  className="qr-action-button"
                  onClick={
                    printQr
                  }
                >
                  ⎙ Print
                </button>

                <button
                  type="button"
                  className="qr-action-button"
                  onClick={
                    regenerateQr
                  }
                  disabled={
                    qrLoading
                  }
                >
                  {
                    qrLoading
                      ? "Updating..."
                      : "↻ Regenerate"
                  }
                </button>

              </div>

              <div className="admin-modal-actions">

                <button
                  type="button"
                  className="modal-cancel-button"
                  onClick={
                    closeQrModal
                  }
                  disabled={
                    qrLoading
                  }
                >
                  Close
                </button>

              </div>

            </div>

          </div>

        )
      }

    </>
  );
}

export default AdminTables;