import { useEffect, useMemo, useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080/api";

const STATUS_OPTIONS = [
  "ALL",
  "GENERATED",
  "PRINTED",
  "PAID",
  "CANCELLED",
];

function AdminBilling() {
  const [bills, setBills] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedBill, setSelectedBill] = useState(null);
  const [processingBillId, setProcessingBillId] = useState(null);
  const [printingBillId, setPrintingBillId] = useState(null);
  const [payingBillId, setPayingBillId] = useState(null);

  const token = localStorage.getItem("token");

  // =========================================================
  // LOAD ALL BILLS
  // =========================================================

  const loadBills = async () => {
    try {
      setLoading(true);
      setError("");

      if (!token) {
        throw new Error(
          "Admin login session not found. Please login again."
        );
      }

      const response = await fetch(
        `${API_BASE_URL}/bills`,
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
            "You do not have permission to view bills."
          );
        }

        throw new Error(
          data?.message ||
            `Failed to load bills (${response.status})`
        );
      }

      setBills(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      setError(
        err.message ||
          "Unable to load billing data."
      );

      setBills([]);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    if (!token) {
      setError(
        "Admin login session not found. Please login again."
      );

      setLoading(false);
      return;
    }

    loadBills();
  }, []);

  // =========================================================
  // SUMMARY
  // =========================================================

  const summary = useMemo(() => {
    const paidBills = bills.filter(
      (bill) => bill.status === "PAID"
    );

    const generatedBills = bills.filter(
      (bill) => bill.status === "GENERATED"
    );

    const printedBills = bills.filter(
      (bill) => bill.status === "PRINTED"
    );

    const cancelledBills = bills.filter(
      (bill) => bill.status === "CANCELLED"
    );

    const paidRevenue = paidBills.reduce(
      (sum, bill) =>
        sum + Number(bill.totalAmount || 0),
      0
    );

    const outstandingRevenue = [
      ...generatedBills,
      ...printedBills,
    ].reduce(
      (sum, bill) =>
        sum + Number(bill.totalAmount || 0),
      0
    );

    return {
      total: bills.length,
      generated: generatedBills.length,
      printed: printedBills.length,
      paid: paidBills.length,
      cancelled: cancelledBills.length,
      paidRevenue,
      outstandingRevenue,
    };
  }, [bills]);

  // =========================================================
  // FILTER BILLS
  // =========================================================

  const visibleBills = useMemo(() => {
    if (selectedStatus === "ALL") {
      return bills;
    }

    return bills.filter(
      (bill) => bill.status === selectedStatus
    );
  }, [bills, selectedStatus]);

  // =========================================================
  // HELPERS
  // =========================================================

  const formatCurrency = (amount) => {
    const number = Number(amount || 0);
    return `₹${number.toFixed(2)}`;
  };

  const formatOrders = (bill) => {
    if (
      !Array.isArray(bill.orderNumbers) ||
      bill.orderNumbers.length === 0
    ) {
      return "—";
    }

    return bill.orderNumbers.join(", ");
  };

  const formatItemSummary = (bill) => {
    if (
      !Array.isArray(bill.items) ||
      bill.items.length === 0
    ) {
      return "No items";
    }

    return bill.items
      .map(
        (item) =>
          `${item.menuItemName} × ${item.quantity}`
      )
      .join(", ");
  };

  const getBillStatusClass = (status) => {
    switch (status) {
      case "GENERATED":
        return "admin-bill-status generated";

      case "PRINTED":
        return "admin-bill-status printed";

      case "PAID":
        return "admin-bill-status paid";

      case "CANCELLED":
        return "admin-bill-status cancelled";

      default:
        return "admin-bill-status unknown";
    }
  };

  // =========================================================
  // OPEN BILL
  // =========================================================

  const openBill = (bill) => {
    setSelectedBill(bill);
  };

  // =========================================================
  // PRINT BILL
  // =========================================================

  const printBill = async (billId) => {
    try {
      setPrintingBillId(billId);
      setProcessingBillId(billId);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/bills/${billId}/print`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const receiptText = await response.text();

      if (!response.ok) {
        throw new Error(
          receiptText ||
            `Failed to generate receipt (${response.status})`
        );
      }

      // -----------------------------------------------------
      // MARK PRINTED
      // -----------------------------------------------------

      const printedResponse = await fetch(
        `${API_BASE_URL}/bills/${billId}/printed`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const printedData = await printedResponse
        .json()
        .catch(() => null);

      if (!printedResponse.ok) {
        throw new Error(
          printedData?.message ||
            `Failed to mark bill as printed (${printedResponse.status})`
        );
      }

      // -----------------------------------------------------
      // UPDATE BILL STATE
      // -----------------------------------------------------

      setBills((currentBills) =>
        currentBills.map((bill) =>
          bill.id === billId
            ? {
                ...bill,
                status:
                  printedData?.status ||
                  "PRINTED",
              }
            : bill
        )
      );

      // -----------------------------------------------------
      // PRINT WINDOW
      // -----------------------------------------------------

      const printWindow = window.open(
        "",
        "_blank",
        "width=450,height=700"
      );

      if (!printWindow) {
        throw new Error(
          "Popup blocked. Please allow popups to print the receipt."
        );
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Receipt</title>

            <style>
              body {
                margin: 0;
                padding: 20px;
                background: #ffffff;
                color: #000000;
                font-family:
                  "Courier New",
                  monospace;
              }

              pre {
                margin: 0;
                white-space: pre-wrap;
                word-wrap: break-word;
                font-size: 13px;
                line-height: 1.45;
              }

              @media print {
                body {
                  padding: 0;
                }
              }
            </style>
          </head>

          <body>
            <pre>${escapeHtml(receiptText)}</pre>

            <script>
              window.onload = function() {
                window.print();
              };
            <\/script>
          </body>
        </html>
      `);

      printWindow.document.close();

      // -----------------------------------------------------
      // UPDATE OPEN MODAL
      // -----------------------------------------------------

      setSelectedBill((currentBill) => {
        if (
          !currentBill ||
          currentBill.id !== billId
        ) {
          return currentBill;
        }

        return {
          ...currentBill,
          status:
            printedData?.status ||
            "PRINTED",
        };
      });
    } catch (err) {
      setError(
        err.message ||
          "Unable to print bill."
      );
    } finally {
      setPrintingBillId(null);
      setProcessingBillId(null);
    }
  };

  // =========================================================
  // MARK BILL PAID
  // =========================================================

  const markPaid = async (billId) => {
    const confirmed = window.confirm(
      "Are you sure the payment for this bill has been collected?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setPayingBillId(billId);
      setProcessingBillId(billId);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/bills/${billId}/paid`,
        {
          method: "PATCH",
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
            `Failed to mark bill as paid (${response.status})`
        );
      }

      // -----------------------------------------------------
      // UPDATE MAIN BILL LIST
      // -----------------------------------------------------

      setBills((currentBills) =>
        currentBills.map((bill) =>
          bill.id === billId
            ? {
                ...bill,
                status:
                  data?.status ||
                  "PAID",
              }
            : bill
        )
      );

      // -----------------------------------------------------
      // UPDATE OPEN MODAL
      // -----------------------------------------------------

      setSelectedBill((currentBill) => {
        if (
          !currentBill ||
          currentBill.id !== billId
        ) {
          return currentBill;
        }

        return {
          ...currentBill,
          status:
            data?.status ||
            "PAID",
        };
      });
    } catch (err) {
      setError(
        err.message ||
          "Unable to mark bill as paid."
      );
    } finally {
      setPayingBillId(null);
      setProcessingBillId(null);
    }
  };

  // =========================================================
  // ESCAPE HTML
  // =========================================================

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  return (
    <>
      <style>
        {`

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

          .admin-refresh-button {
            display: flex;
            align-items: center;
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
            transition: 0.2s ease;
          }

          .admin-refresh-button:hover {
            background:
              rgba(201,123,74,0.18);
          }

          .admin-refresh-button:disabled {
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
             FILTERS
          ================================================= */

          .admin-bill-filter-area {
            padding: 18px 22px;
            border-bottom:
              1px solid
              rgba(255,255,255,0.07);
          }

          .admin-bill-filters {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }

          .admin-bill-filter {
            padding: 8px 13px;
            border:
              1px solid
              rgba(255,255,255,0.08);
            border-radius: 999px;
            background: #181411;
            color: #8e837b;
            font: inherit;
            font-size: 0.73rem;
            font-weight: 600;
            cursor: pointer;
            transition: 0.2s ease;
          }

          .admin-bill-filter:hover {
            border-color:
              rgba(201,123,74,0.25);
            color: #d7cec7;
          }

          .admin-bill-filter.active {
            border-color:
              rgba(201,123,74,0.30);
            background:
              rgba(201,123,74,0.13);
            color: #e3a16f;
          }

          /* =================================================
             TABLE
          ================================================= */

          .admin-bill-table-wrap {
            width: 100%;
            overflow-x: auto;
          }

          .admin-bill-table {
            width: 100%;
            min-width: 1180px;
            border-collapse: collapse;
          }

          .admin-bill-table th {
            padding: 14px 16px;
            color: #81756e;
            background: #1d1815;
            border-bottom:
              1px solid
              rgba(255,255,255,0.07);
            font-size: 0.68rem;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-align: left;
            text-transform: uppercase;
          }

          .admin-bill-table td {
            padding: 16px;
            color: #d7cec7;
            border-bottom:
              1px solid
              rgba(255,255,255,0.055);
            font-size: 0.82rem;
            vertical-align: middle;
          }

          .admin-bill-table tbody tr {
            transition: 0.18s ease;
          }

          .admin-bill-table tbody tr:hover {
            background:
              rgba(255,255,255,0.018);
          }

          .admin-bill-table tbody tr:last-child td {
            border-bottom: 0;
          }

          /* =================================================
             BILL DETAILS
          ================================================= */

          .admin-bill-number {
            color: #fffaf5;
            font-weight: 700;
            font-size: 0.88rem;
          }

          .admin-bill-id {
            margin-top: 5px;
            color: #756b64;
            font-size: 0.67rem;
          }

          .admin-bill-orders {
            max-width: 290px;
            color: #d7cec7;
            line-height: 1.5;
          }

          .admin-bill-session {
            display: inline-flex;
            margin-top: 6px;
            padding: 4px 8px;
            border:
              1px solid
              rgba(201,123,74,0.20);
            border-radius: 6px;
            background:
              rgba(201,123,74,0.08);
            color: #d99a68;
            font-size: 0.66rem;
            font-weight: 700;
            letter-spacing: 0.05em;
          }

          .admin-bill-legacy {
            display: inline-flex;
            margin-top: 6px;
            color: #756b64;
            font-size: 0.67rem;
          }

          .admin-bill-table-number {
            color: #e0d7d0;
            font-weight: 700;
          }

          .admin-bill-item-preview {
            max-width: 330px;
            color: #948981;
            line-height: 1.5;
          }

          .admin-bill-total {
            color: #f1e7df;
            font-weight: 700;
            white-space: nowrap;
          }

          /* =================================================
             STATUS
          ================================================= */

          .admin-bill-status {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 5px 9px;
            border-radius: 999px;
            font-size: 0.66rem;
            font-weight: 700;
            letter-spacing: 0.03em;
            white-space: nowrap;
          }

          .admin-bill-status::before {
            content: "";
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: currentColor;
          }

          .admin-bill-status.generated {
            color: #e4b36f;
            background:
              rgba(218,161,84,0.10);
          }

          .admin-bill-status.printed {
            color: #83c2cc;
            background:
              rgba(72,145,159,0.10);
          }

          .admin-bill-status.paid {
            color: #78be91;
            background:
              rgba(82,166,107,0.10);
          }

          .admin-bill-status.cancelled {
            color: #db8274;
            background:
              rgba(184,74,60,0.10);
          }

          .admin-bill-status.unknown {
            color: #b5ada7;
            background:
              rgba(255,255,255,0.06);
          }

          /* =================================================
             ACTIONS
          ================================================= */

          .admin-bill-actions {
            display: flex;
            align-items: center;
            gap: 7px;
            flex-wrap: wrap;
          }

          .admin-bill-action-button {
            padding: 8px 12px;
            border:
              1px solid
              rgba(201,123,74,0.20);
            border-radius: 8px;
            background:
              rgba(201,123,74,0.07);
            color: #d99a68;
            font: inherit;
            font-size: 0.71rem;
            font-weight: 600;
            cursor: pointer;
            transition: 0.2s ease;
            white-space: nowrap;
          }

          .admin-bill-action-button:hover {
            background:
              rgba(201,123,74,0.14);
            border-color:
              rgba(201,123,74,0.32);
          }

          .admin-bill-action-button:disabled {
            opacity: 0.45;
            cursor: not-allowed;
          }

          .admin-bill-paid-button {
            border-color:
              rgba(82,166,107,0.22);
            background:
              rgba(82,166,107,0.07);
            color: #78be91;
          }

          .admin-bill-paid-button:hover {
            border-color:
              rgba(82,166,107,0.34);
            background:
              rgba(82,166,107,0.13);
          }

          .admin-bill-view-button {
            border-color:
              rgba(255,255,255,0.10);
            background:
              rgba(255,255,255,0.04);
            color: #bcb0a8;
          }

          .admin-bill-view-button:hover {
            border-color:
              rgba(255,255,255,0.16);
            background:
              rgba(255,255,255,0.08);
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
             LOADING / EMPTY
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

          .admin-empty {
            padding: 60px 20px;
            text-align: center;
            color: #756b64;
          }

          @keyframes adminSpin {
            to {
              transform:
                rotate(360deg);
            }
          }

          /* =================================================
             BILL MODAL
          ================================================= */

          .admin-bill-modal-overlay {
            position: fixed;
            inset: 0;
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background:
              rgba(0,0,0,0.68);
          }

          .admin-bill-modal {
            width: min(900px, 100%);
            max-height: 90vh;
            overflow-y: auto;
            background: #211b18;
            border:
              1px solid
              rgba(255,255,255,0.09);
            border-radius: 14px;
            box-shadow:
              0 25px 80px
              rgba(0,0,0,0.40);
          }

          .admin-bill-modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
            padding: 20px 22px;
            border-bottom:
              1px solid
              rgba(255,255,255,0.07);
          }

          .admin-modal-title-group h2 {
            margin: 0;
            color: #fffaf5;
            font-family:
              Georgia,
              "Times New Roman",
              serif;
            font-size: 1.4rem;
            font-weight: 600;
          }

          .admin-modal-title-group p {
            margin:
              6px 0 0;
            color: #80756d;
            font-size: 0.75rem;
          }

          .admin-bill-modal-close {
            width: 34px;
            height: 34px;
            border:
              1px solid
              rgba(255,255,255,0.08);
            border-radius: 8px;
            background: #181411;
            color: #bcb0a8;
            cursor: pointer;
            font-size: 1.1rem;
          }

          .admin-bill-modal-close:hover {
            color: #fffaf5;
            border-color:
              rgba(201,123,74,0.28);
          }

          .admin-bill-modal-body {
            padding: 22px;
          }

          /* =================================================
             MODAL SUMMARY
          ================================================= */

          .admin-bill-summary-grid {
            display: grid;
            grid-template-columns:
              repeat(4, minmax(0, 1fr));
            gap: 12px;
            margin-bottom: 22px;
          }

          .admin-bill-summary-card {
            padding: 14px;
            background: #181411;
            border:
              1px solid
              rgba(255,255,255,0.055);
            border-radius: 9px;
          }

          .admin-bill-summary-card span {
            display: block;
            margin-bottom: 5px;
            color: #746961;
            font-size: 0.64rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          .admin-bill-summary-card strong {
            color: #d7cec7;
            font-size: 0.82rem;
          }

          /* =================================================
             BILL INFO
          ================================================= */

          .admin-bill-info-section {
            margin-bottom: 22px;
          }

          .admin-bill-section-title {
            margin:
              0 0 12px;
            color: #f4ece5;
            font-family:
              Georgia,
              "Times New Roman",
              serif;
            font-size: 1.1rem;
          }

          .admin-bill-info-grid {
            display: grid;
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
            gap: 10px;
          }

          .admin-bill-info-card {
            padding: 13px 14px;
            background: #181411;
            border:
              1px solid
              rgba(255,255,255,0.055);
            border-radius: 9px;
          }

          .admin-bill-info-card span {
            display: block;
            margin-bottom: 5px;
            color: #746961;
            font-size: 0.64rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          .admin-bill-info-card strong {
            color: #d7cec7;
            font-size: 0.79rem;
            word-break: break-word;
          }

          /* =================================================
             ITEMS
          ================================================= */

          .admin-bill-items {
            margin-top: 10px;
          }

          .admin-bill-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
            padding: 12px 0;
            border-top:
              1px solid
              rgba(255,255,255,0.055);
          }

          .admin-bill-item-name {
            color: #d7cec7;
            font-size: 0.79rem;
          }

          .admin-bill-item-meta {
            margin-top: 4px;
            color: #756b64;
            font-size: 0.66rem;
          }

          .admin-bill-item-total {
            color: #ddd3cb;
            font-size: 0.77rem;
            font-weight: 700;
            white-space: nowrap;
          }

          /* =================================================
             TOTALS
          ================================================= */

          .admin-bill-totals {
            padding-top: 15px;
            margin-top: 12px;
            border-top:
              1px solid
              rgba(255,255,255,0.07);
          }

          .admin-bill-total-row {
            display: flex;
            justify-content: space-between;
            gap: 15px;
            padding: 6px 0;
            color: #8f837a;
            font-size: 0.78rem;
          }

          .admin-bill-total-row.final {
            padding-top: 12px;
            margin-top: 6px;
            border-top:
              1px solid
              rgba(255,255,255,0.08);
            color: #fffaf5;
            font-size: 0.92rem;
            font-weight: 700;
          }

          .admin-bill-modal-actions {
            display: flex;
            justify-content: flex-end;
            gap: 9px;
            flex-wrap: wrap;
            padding-top: 20px;
            margin-top: 20px;
            border-top:
              1px solid
              rgba(255,255,255,0.07);
          }

          /* =================================================
             RESPONSIVE
          ================================================= */

          @media (max-width: 1100px) {

            .admin-stats {
              grid-template-columns:
                repeat(2, minmax(0, 1fr));
            }

            .admin-bill-summary-grid {
              grid-template-columns:
                repeat(2, minmax(0, 1fr));
            }
          }

          @media (max-width: 560px) {

            .admin-stats {
              grid-template-columns:
                1fr;
            }

            .admin-topbar {
              align-items: flex-start;
              flex-direction: column;
            }

            .admin-bill-summary-grid {
              grid-template-columns:
                1fr;
            }

            .admin-bill-info-grid {
              grid-template-columns:
                1fr;
            }

            .admin-bill-modal-actions {
              justify-content: stretch;
            }

            .admin-bill-modal-actions
            .admin-bill-action-button {
              flex: 1;
            }

          }

        `}
      </style>

      {/* =================================================
          BILLING HEADER
      ================================================= */}

      <div className="admin-topbar">
        <div>
          <h1>Billing</h1>

          <p>
            Manage bills, receipts, payments and billing history
          </p>
        </div>

        <button
          className="admin-refresh-button"
          onClick={loadBills}
          disabled={loading}
        >
          ↻
          {loading
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="admin-error">
          <strong>
            Unable to load billing data
          </strong>

          <div>{error}</div>

          <button
            className="admin-retry"
            onClick={loadBills}
          >
            Try Again
          </button>
        </div>
      )}

      {/* =================================================
          STATS
      ================================================= */}

      <section className="admin-stats">

        {/* TOTAL */}

        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-label">
              Total Bills
            </span>

            <span className="admin-stat-icon">
              ₹
            </span>
          </div>

          <div className="admin-stat-value">
            {summary.total}
          </div>

          <div className="admin-stat-description">
            All generated bills
          </div>
        </div>

        {/* GENERATED */}

        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-label">
              Generated
            </span>

            <span className="admin-stat-icon">
              ◷
            </span>
          </div>

          <div className="admin-stat-value">
            {summary.generated}
          </div>

          <div className="admin-stat-description">
            Awaiting payment
          </div>
        </div>

        {/* PAID */}

        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-label">
              Paid
            </span>

            <span className="admin-stat-icon">
              ✓
            </span>
          </div>

          <div className="admin-stat-value">
            {summary.paid}
          </div>

          <div className="admin-stat-description">
            Completed payments
          </div>
        </div>

        {/* REVENUE */}

        <div className="admin-stat-card">
          <div className="admin-stat-top">
            <span className="admin-stat-label">
              Revenue
            </span>

            <span className="admin-stat-icon">
              ₹
            </span>
          </div>

          <div className="admin-stat-value">
            {formatCurrency(
              summary.paidRevenue
            )}
          </div>

          <div className="admin-stat-description">
            Revenue from paid bills
          </div>
        </div>

      </section>

      {/* =================================================
          BILLING HISTORY
      ================================================= */}

      <section className="admin-panel">

        <div className="admin-panel-header">
          <h2>
            Billing History
          </h2>

          <span>
            {visibleBills.length} bills
          </span>
        </div>

        {/* =================================================
            FILTERS
        ================================================= */}

        <div className="admin-bill-filter-area">

          <div className="admin-bill-filters">

            {STATUS_OPTIONS.map(
              (status) => (
                <button
                  key={status}
                  type="button"
                  className={`admin-bill-filter ${
                    selectedStatus === status
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    setSelectedStatus(
                      status
                    )
                  }
                >
                  {status}
                </button>
              )
            )}

          </div>

        </div>

        {/* =================================================
            CONTENT
        ================================================= */}

        {loading ? (
          <div className="admin-loading">
            <div className="admin-spinner"></div>
            Loading bills...
          </div>
        ) : visibleBills.length === 0 ? (
          <div className="admin-empty">
            No bills found.
          </div>
        ) : (
          <div className="admin-bill-table-wrap">

            <table className="admin-bill-table">

              <thead>
                <tr>
                  <th>Bill</th>
                  <th>Orders</th>
                  <th>Table</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {visibleBills.map(
                  (bill) => (
                    <tr key={bill.id}>

                      {/* BILL */}

                      <td>
                        <div className="admin-bill-number">
                          {bill.billNumber}
                        </div>

                        <div className="admin-bill-id">
                          Bill ID:{" "}
                          {bill.id}
                        </div>
                      </td>

                      {/* ORDERS */}

                      <td>
                        <div className="admin-bill-orders">
                          {formatOrders(
                            bill
                          )}
                        </div>

                        {bill.sessionCode ? (
                          <div className="admin-bill-session">
                            Session{" "}
                            {bill.sessionCode}
                          </div>
                        ) : (
                          <div className="admin-bill-legacy">
                            Individual order
                          </div>
                        )}
                      </td>

                      {/* TABLE */}

                      <td>
                        <div className="admin-bill-table-number">
                          {bill.tableNumber ||
                            "—"}
                        </div>
                      </td>

                      {/* ITEMS */}

                      <td>
                        <div className="admin-bill-item-preview">
                          {formatItemSummary(
                            bill
                          )}
                        </div>
                      </td>

                      {/* TOTAL */}

                      <td>
                        <div className="admin-bill-total">
                          {formatCurrency(
                            bill.totalAmount
                          )}
                        </div>
                      </td>

                      {/* STATUS */}

                      <td>
                        <span
                          className={getBillStatusClass(
                            bill.status
                          )}
                        >
                          {bill.status}
                        </span>
                      </td>

                      {/* ACTIONS */}

                      <td>

                        <div className="admin-bill-actions">

                          <button
                            type="button"
                            className="admin-bill-action-button admin-bill-view-button"
                            onClick={() =>
                              openBill(
                                bill
                              )
                            }
                          >
                            View
                          </button>

                          {bill.status !==
                            "PAID" &&
                            bill.status !==
                              "CANCELLED" && (
                              <button
                                type="button"
                                className="admin-bill-action-button"
                                disabled={
                                  processingBillId ===
                                  bill.id
                                }
                                onClick={() =>
                                  printBill(
                                    bill.id
                                  )
                                }
                              >
                                {printingBillId ===
                                bill.id
                                  ? "Printing..."
                                  : "Print"}
                              </button>
                            )}

                          {bill.status !==
                            "PAID" &&
                            bill.status !==
                              "CANCELLED" && (
                              <button
                                type="button"
                                className="admin-bill-action-button admin-bill-paid-button"
                                disabled={
                                  processingBillId ===
                                  bill.id
                                }
                                onClick={() =>
                                  markPaid(
                                    bill.id
                                  )
                                }
                              >
                                {payingBillId ===
                                bill.id
                                  ? "Saving..."
                                  : "Mark Paid"}
                              </button>
                            )}

                        </div>

                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </section>

      {/* =====================================================
          BILL DETAILS MODAL
      ===================================================== */}

      {selectedBill && (
        <div
          className="admin-bill-modal-overlay"
          onClick={() =>
            setSelectedBill(null)
          }
        >

          <div
            className="admin-bill-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="admin-bill-modal-header">

              <div className="admin-modal-title-group">

                <h2>
                  {selectedBill.billNumber}
                </h2>

                <p>
                  Bill ID:{" "}
                  {selectedBill.id}
                </p>

              </div>

              <button
                type="button"
                className="admin-bill-modal-close"
                onClick={() =>
                  setSelectedBill(null)
                }
              >
                ×
              </button>

            </div>

            <div className="admin-bill-modal-body">

              {/* =================================================
                  SUMMARY
              ================================================= */}

              <div className="admin-bill-summary-grid">

                <div className="admin-bill-summary-card">
                  <span>Table</span>

                  <strong>
                    {selectedBill.tableNumber ||
                      "—"}
                  </strong>
                </div>

                <div className="admin-bill-summary-card">
                  <span>Orders</span>

                  <strong>
                    {selectedBill
                      .orderNumbers
                      ?.length || 0}
                  </strong>
                </div>

                <div className="admin-bill-summary-card">
                  <span>Total</span>

                  <strong>
                    {formatCurrency(
                      selectedBill.totalAmount
                    )}
                  </strong>
                </div>

                <div className="admin-bill-summary-card">
                  <span>Status</span>

                  <strong>
                    {selectedBill.status}
                  </strong>
                </div>

              </div>

              {/* =================================================
                  BILL INFORMATION
              ================================================= */}

              <div className="admin-bill-info-section">

                <h3 className="admin-bill-section-title">
                  Bill Information
                </h3>

                <div className="admin-bill-info-grid">

                  <div className="admin-bill-info-card">
                    <span>Bill Number</span>

                    <strong>
                      {selectedBill.billNumber}
                    </strong>
                  </div>

                  <div className="admin-bill-info-card">
                    <span>Table</span>

                    <strong>
                      {selectedBill.tableNumber ||
                        "—"}
                    </strong>
                  </div>

                  <div className="admin-bill-info-card">
                    <span>Order Numbers</span>

                    <strong>
                      {formatOrders(
                        selectedBill
                      )}
                    </strong>
                  </div>

                  <div className="admin-bill-info-card">
                    <span>Session Code</span>

                    <strong>
                      {selectedBill.sessionCode ||
                        "Individual Order"}
                    </strong>
                  </div>

                </div>

              </div>

              {/* =================================================
                  ITEMS
              ================================================= */}

              <div>

                <h3 className="admin-bill-section-title">
                  Bill Items
                </h3>

                <div className="admin-bill-items">

                  {Array.isArray(
                    selectedBill.items
                  ) &&
                  selectedBill.items.length >
                    0 ? (
                    selectedBill.items.map(
                      (
                        item,
                        index
                      ) => (
                        <div
                          key={`${selectedBill.id}-${index}`}
                          className="admin-bill-item"
                        >

                          <div>

                            <div className="admin-bill-item-name">
                              {item.menuItemName}
                            </div>

                            <div className="admin-bill-item-meta">
                              ₹
                              {Number(
                                item.unitPrice ||
                                  0
                              ).toFixed(2)}

                              {" × "}

                              {item.quantity}
                            </div>

                          </div>

                          <div className="admin-bill-item-total">
                            {formatCurrency(
                              item.totalPrice
                            )}
                          </div>

                        </div>
                      )
                    )
                  ) : (
                    <div className="admin-empty">
                      No bill items available.
                    </div>
                  )}

                </div>

              </div>

              {/* =================================================
                  TOTALS
              ================================================= */}

              <div className="admin-bill-totals">

                <div className="admin-bill-total-row">
                  <span>Subtotal</span>

                  <span>
                    {formatCurrency(
                      selectedBill.subtotal
                    )}
                  </span>
                </div>

                <div className="admin-bill-total-row">
                  <span>Tax</span>

                  <span>
                    {formatCurrency(
                      selectedBill.tax
                    )}
                  </span>
                </div>

                <div className="admin-bill-total-row">
                  <span>Discount</span>

                  <span>
                    {formatCurrency(
                      selectedBill.discount
                    )}
                  </span>
                </div>

                <div className="admin-bill-total-row final">
                  <span>Total</span>

                  <span>
                    {formatCurrency(
                      selectedBill.totalAmount
                    )}
                  </span>
                </div>

              </div>

              {/* =================================================
                  ACTIONS
              ================================================= */}

              <div className="admin-bill-modal-actions">

                {selectedBill.status !==
                  "PAID" &&
                  selectedBill.status !==
                    "CANCELLED" && (
                    <>
                      <button
                        type="button"
                        className="admin-bill-action-button"
                        disabled={
                          processingBillId ===
                          selectedBill.id
                        }
                        onClick={() =>
                          printBill(
                            selectedBill.id
                          )
                        }
                      >
                        {printingBillId ===
                        selectedBill.id
                          ? "Printing..."
                          : "Print Receipt"}
                      </button>

                      <button
                        type="button"
                        className="admin-bill-action-button admin-bill-paid-button"
                        disabled={
                          processingBillId ===
                          selectedBill.id
                        }
                        onClick={() =>
                          markPaid(
                            selectedBill.id
                          )
                        }
                      >
                        {payingBillId ===
                        selectedBill.id
                          ? "Saving..."
                          : "Mark Paid"}
                      </button>
                    </>
                  )}

              </div>

            </div>

          </div>

        </div>
      )}
    </>
  );
}

export default AdminBilling;