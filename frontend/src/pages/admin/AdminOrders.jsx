import { useEffect, useMemo, useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080/api";

const STATUS_OPTIONS = [
  "ALL",
  "PLACED",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "SERVED",
  "COMPLETED",
];

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [waiters, setWaiters] = useState([]);

  const [selectedStatus, setSelectedStatus] =
    useState("ALL");

  const [loading, setLoading] =
    useState(true);

  const [waitersLoading, setWaitersLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [assigningOrderId, setAssigningOrderId] =
    useState(null);

  const [selectedSession, setSelectedSession] =
    useState(null);

  const token =
    localStorage.getItem("token");

  // =========================================================
  // LOAD ALL ORDERS
  // =========================================================

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");

      if (!token) {
        throw new Error(
          "Admin login session not found. Please login again."
        );
      }

      const response = await fetch(
        `${API_BASE_URL}/reception/orders`,
        {
          method: "GET",
          headers: {
            Authorization:
              `Bearer ${token}`,
            "Content-Type":
              "application/json",
          },
        }
      );

      const data =
        await response
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
            "You do not have permission to view orders."
          );
        }

        throw new Error(
          data?.message ||
            `Failed to load orders (${response.status})`
        );
      }

      setOrders(
        Array.isArray(data)
          ? data
          : []
      );

    } catch (err) {

      setError(
        err.message ||
          "Unable to load order data."
      );

      setOrders([]);

    } finally {

      setLoading(false);

    }
  };

  // =========================================================
  // LOAD ACTIVE WAITERS
  // =========================================================

  const loadWaiters = async () => {
    try {

      setWaitersLoading(true);

      if (!token) {
        throw new Error(
          "Admin login session not found."
        );
      }

      const response = await fetch(
        `${API_BASE_URL}/reception/waiters`,
        {
          method: "GET",
          headers: {
            Authorization:
              `Bearer ${token}`,
            "Content-Type":
              "application/json",
          },
        }
      );

      const data =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Failed to load waiters (${response.status})`
        );
      }

      setWaiters(
        Array.isArray(data)
          ? data
          : []
      );

    } catch (err) {

      console.error(
        "Waiter loading error:",
        err
      );

      setWaiters([]);

    } finally {

      setWaitersLoading(false);

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
      setWaitersLoading(false);

      return;
    }

    loadOrders();
    loadWaiters();

  }, []);

  // =========================================================
  // ASSIGN / REASSIGN WAITER
  // =========================================================

  const assignWaiter = async (
    orderId,
    waiterId
  ) => {

    if (!waiterId) {
      return;
    }

    try {

      setAssigningOrderId(orderId);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/reception/orders/${orderId}/assign-waiter/${waiterId}`,
        {
          method: "PATCH",
          headers: {
            Authorization:
              `Bearer ${token}`,
            "Content-Type":
              "application/json",
          },
        }
      );

      const data =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Failed to assign waiter (${response.status})`
        );
      }

      // -----------------------------------------------------
      // UPDATE MAIN ORDERS
      // -----------------------------------------------------

      setOrders(
        (currentOrders) =>
          currentOrders.map(
            (order) =>
              order.orderId === orderId
                ? {
                    ...order,
                    waiterId:
                      data.waiterId,
                    waiterName:
                      data.waiterName,
                  }
                : order
          )
      );

      // -----------------------------------------------------
      // UPDATE OPEN SESSION MODAL
      // -----------------------------------------------------

      setSelectedSession(
        (currentSession) => {

          if (!currentSession) {
            return currentSession;
          }

          return {
            ...currentSession,

            orders:
              currentSession.orders.map(
                (order) =>
                  order.orderId === orderId
                    ? {
                        ...order,
                        waiterId:
                          data.waiterId,
                        waiterName:
                          data.waiterName,
                      }
                    : order
              ),
          };
        }
      );

    } catch (err) {

      setError(
        err.message ||
          "Unable to assign waiter."
      );

    } finally {

      setAssigningOrderId(null);

    }
  };

  // =========================================================
  // SUMMARY
  // =========================================================

  const summary = useMemo(() => {

    return {

      total:
        orders.length,

      placed:
        orders.filter(
          (order) =>
            order.status ===
            "PLACED"
        ).length,

      preparing:
        orders.filter(
          (order) =>
            order.status ===
            "PREPARING"
        ).length,

      ready:
        orders.filter(
          (order) =>
            order.status ===
            "READY"
        ).length,

      served:
        orders.filter(
          (order) =>
            order.status ===
            "SERVED"
        ).length,

    };

  }, [orders]);

  // =========================================================
  // HELPERS
  // =========================================================

  const formatCurrency = (
    amount
  ) => {

    const number =
      Number(
        amount || 0
      );

    return `₹${number.toFixed(2)}`;
  };

  const getOrderStatusClass = (
    status
  ) => {

    switch (status) {

      case "PLACED":
        return "admin-order-status placed";

      case "CONFIRMED":
        return "admin-order-status confirmed";

      case "PREPARING":
        return "admin-order-status preparing";

      case "READY":
        return "admin-order-status ready";

      case "SERVED":
        return "admin-order-status served";

      case "COMPLETED":
        return "admin-order-status completed";

      default:
        return "admin-order-status unknown";
    }
  };

  // =========================================================
  // SESSION GROUPING
  // =========================================================

  const getGroupKey = (
    order
  ) => {

    /*
     * Session code is only unique within a table.
     *
     * Therefore:
     *
     * table + sessionCode
     *
     * is safer than sessionCode alone.
     */

    if (
      order.sessionCode &&
      order.tableNumber
    ) {

      return (
        `SESSION-${order.tableNumber}-` +
        `${order.sessionCode}`
      );

    }

    /*
     * Legacy orders don't have a session.
     * Keep every legacy order separate.
     */

    return `ORDER-${order.orderId}`;
  };

  // =========================================================
  // CREATE SESSION GROUPS
  // =========================================================

  const allSessionGroups =
    useMemo(() => {

      const groups =
        new Map();

      for (
        const order of orders
      ) {

        const key =
          getGroupKey(order);

        if (
          !groups.has(key)
        ) {

          groups.set(
            key,
            {
              key,

              tableNumber:
                order.tableNumber ||
                "—",

              sessionCode:
                order.sessionCode ||
                null,

              orders: [],
            }
          );

        }

        groups
          .get(key)
          .orders
          .push(order);
      }

      return Array.from(
        groups.values()
      ).map((group) => {

        const totalAmount =
          group.orders.reduce(
            (
              sum,
              order
            ) =>
              sum +
              Number(
                order.totalAmount ||
                  0
              ),
            0
          );

        const statuses = [
          ...new Set(
            group.orders.map(
              (order) =>
                order.status
            )
          ),
        ];

        const latestOrder =
          group.orders[0];

        const waiterNames = [
          ...new Set(
            group.orders
              .map(
                (order) =>
                  order.waiterName
              )
              .filter(Boolean)
          ),
        ];

        let waiterDisplay =
          "Not assigned";

        if (
          waiterNames.length ===
          1
        ) {

          waiterDisplay =
            waiterNames[0];

        } else if (
          waiterNames.length > 1
        ) {

          waiterDisplay =
            "Multiple waiters";
        }

        let displayStatus =
          latestOrder?.status ||
          "UNKNOWN";

        if (
          statuses.length > 1
        ) {

          displayStatus =
            "MIXED";
        }

        return {

          ...group,

          totalAmount,

          orderCount:
            group.orders.length,

          statuses,

          latestOrder,

          waiterDisplay,

          displayStatus,

        };

      });

    }, [orders]);

  // =========================================================
  // FILTER SESSION GROUPS
  // =========================================================

  const visibleSessionGroups =
    useMemo(() => {

      if (
        selectedStatus ===
        "ALL"
      ) {

        return allSessionGroups;
      }

      return allSessionGroups.filter(
        (group) =>
          group.orders.some(
            (order) =>
              order.status ===
              selectedStatus
          )
      );

    }, [
      allSessionGroups,
      selectedStatus,
    ]);

  // =========================================================
  // OPEN SESSION
  // =========================================================

  const openSession = (
    group
  ) => {

    setSelectedSession({
      ...group,
      orders: [
        ...group.orders,
      ],
    });
  };

  // =========================================================
  // REFRESH
  // =========================================================

  const handleRefresh = () => {

    loadOrders();
    loadWaiters();

  };

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

          .admin-order-filter-area {
            padding: 18px 22px;
            border-bottom:
              1px solid
              rgba(255,255,255,0.07);
          }

          .admin-order-filters {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }

          .admin-order-filter {
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

          .admin-order-filter:hover {
            border-color:
              rgba(201,123,74,0.25);
            color: #d7cec7;
          }

          .admin-order-filter.active {
            border-color:
              rgba(201,123,74,0.30);
            background:
              rgba(201,123,74,0.13);
            color: #e3a16f;
          }

          /* =================================================
             ORDER TABLE
          ================================================= */

          .admin-order-table-wrap {
            width: 100%;
            overflow-x: auto;
          }

          .admin-order-table {
            width: 100%;
            min-width: 1100px;
            border-collapse: collapse;
          }

          .admin-order-table th {
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

          .admin-order-table td {
            padding: 16px;
            color: #d7cec7;
            border-bottom:
              1px solid
              rgba(255,255,255,0.055);
            font-size: 0.82rem;
            vertical-align: middle;
          }

          .admin-order-table tbody tr {
            transition: 0.18s ease;
          }

          .admin-order-table tbody tr:hover {
            background:
              rgba(255,255,255,0.018);
          }

          .admin-order-table tbody tr:last-child td {
            border-bottom: 0;
          }

          /* =================================================
             SESSION
          ================================================= */

          .admin-session-title {
            color: #fffaf5;
            font-weight: 700;
            font-size: 0.88rem;
          }

          .admin-session-code {
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
            font-size: 0.68rem;
            font-weight: 700;
            letter-spacing: 0.06em;
          }

          .admin-session-single {
            display: inline-flex;
            margin-top: 6px;
            color: #756b64;
            font-size: 0.68rem;
          }

          .admin-session-latest {
            margin-top: 7px;
            color: #6f655f;
            font-size: 0.67rem;
          }

          .admin-session-orders {
            color: #e0d7d0;
            font-weight: 700;
          }

          .admin-session-orders-sub {
            margin-top: 5px;
            color: #756b64;
            font-size: 0.68rem;
          }

          .admin-order-table-number {
            color: #e0d7d0;
            font-size: 0.88rem;
            font-weight: 700;
          }

          .admin-order-total {
            color: #f1e7df;
            font-weight: 700;
            white-space: nowrap;
          }

          .admin-session-status-note {
            margin-top: 6px;
            color: #756b64;
            font-size: 0.65rem;
          }

          /* =================================================
             STATUS
          ================================================= */

          .admin-order-status {
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

          .admin-order-status::before {
            content: "";
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: currentColor;
          }

          .admin-order-status.placed {
            color: #e4b36f;
            background:
              rgba(218,161,84,0.10);
          }

          .admin-order-status.confirmed {
            color: #8db8dc;
            background:
              rgba(92,145,190,0.10);
          }

          .admin-order-status.preparing {
            color: #bd9ddd;
            background:
              rgba(155,111,191,0.10);
          }

          .admin-order-status.ready {
            color: #78be91;
            background:
              rgba(82,166,107,0.10);
          }

          .admin-order-status.served {
            color: #83c2cc;
            background:
              rgba(72,145,159,0.10);
          }

          .admin-order-status.completed {
            color: #a7a09b;
            background:
              rgba(255,255,255,0.06);
          }

          .admin-order-status.unknown {
            color: #b5ada7;
            background:
              rgba(255,255,255,0.06);
          }

          .admin-order-status.mixed {
            color: #d9a36e;
            background:
              rgba(201,123,74,0.10);
          }

          /* =================================================
             WAITER
          ================================================= */

          .admin-waiter-display {
            color: #c7bdb5;
            font-size: 0.78rem;
          }

          .admin-waiter-multiple {
            color: #d99a68;
          }

          /* =================================================
             VIEW BUTTON
          ================================================= */

          .admin-order-view-button {
            padding: 8px 13px;
            border:
              1px solid
              rgba(201,123,74,0.20);
            border-radius: 8px;
            background:
              rgba(201,123,74,0.07);
            color: #d99a68;
            font: inherit;
            font-size: 0.72rem;
            font-weight: 600;
            cursor: pointer;
            transition: 0.2s ease;
            white-space: nowrap;
          }

          .admin-order-view-button:hover {
            background:
              rgba(201,123,74,0.14);
            border-color:
              rgba(201,123,74,0.32);
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
             SESSION MODAL
          ================================================= */

          .admin-order-modal-overlay {
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

          .admin-order-modal {
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

          .admin-order-modal-header {
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

          .admin-modal-session-code {
            color: #d99a68;
          }

          .admin-order-modal-close {
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

          .admin-order-modal-close:hover {
            color: #fffaf5;
            border-color:
              rgba(201,123,74,0.28);
          }

          .admin-order-modal-body {
            padding: 22px;
          }

          /* =================================================
             SESSION SUMMARY
          ================================================= */

          .admin-session-summary-grid {
            display: grid;
            grid-template-columns:
              repeat(4, minmax(0, 1fr));
            gap: 12px;
            margin-bottom: 22px;
          }

          .admin-session-summary-card {
            padding: 14px;
            background: #181411;
            border:
              1px solid
              rgba(255,255,255,0.055);
            border-radius: 9px;
          }

          .admin-session-summary-card span {
            display: block;
            margin-bottom: 5px;
            color: #746961;
            font-size: 0.64rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          .admin-session-summary-card strong {
            color: #d7cec7;
            font-size: 0.82rem;
          }

          /* =================================================
             SESSION ORDERS
          ================================================= */

          .admin-session-orders-title {
            margin:
              0 0 12px;
            color: #f4ece5;
            font-family:
              Georgia,
              "Times New Roman",
              serif;
            font-size: 1.1rem;
          }

          .admin-session-order-card {
            margin-bottom: 14px;
            padding: 16px;
            background: #181411;
            border:
              1px solid
              rgba(255,255,255,0.055);
            border-radius: 11px;
          }

          .admin-session-order-card:last-child {
            margin-bottom: 0;
          }

          .admin-session-order-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
            margin-bottom: 13px;
          }

          .admin-session-order-number {
            color: #fffaf5;
            font-size: 0.85rem;
            font-weight: 700;
          }

          .admin-session-order-meta {
            margin-top: 5px;
            color: #756b64;
            font-size: 0.67rem;
          }

          .admin-session-order-right {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .admin-session-order-amount {
            color: #f1e7df;
            font-size: 0.84rem;
            font-weight: 700;
          }

          .admin-session-order-item {
            display: flex;
            justify-content: space-between;
            gap: 15px;
            padding: 10px 0;
            border-top:
              1px solid
              rgba(255,255,255,0.05);
          }

          .admin-session-order-item-name {
            color: #d7cec7;
            font-size: 0.78rem;
          }

          .admin-session-order-item-meta {
            margin-top: 4px;
            color: #756b64;
            font-size: 0.66rem;
          }

          .admin-session-order-item-price {
            color: #ddd3cb;
            font-size: 0.76rem;
            font-weight: 700;
            white-space: nowrap;
          }

          .admin-session-order-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            margin-top: 14px;
            padding-top: 13px;
            border-top:
              1px solid
              rgba(255,255,255,0.06);
          }

          .admin-session-waiter {
            display: flex;
            align-items: center;
            gap: 9px;
            flex-wrap: wrap;
          }

          .admin-session-waiter-label {
            color: #756b64;
            font-size: 0.67rem;
          }

          .admin-session-waiter-select {
            min-width: 160px;
            padding: 7px 9px;
            border:
              1px solid
              rgba(255,255,255,0.09);
            border-radius: 7px;
            background: #211b18;
            color: #d7cec7;
            font: inherit;
            font-size: 0.72rem;
            outline: none;
          }

          .admin-session-waiter-select:focus {
            border-color:
              rgba(201,123,74,0.40);
          }

          .admin-session-waiter-select:disabled {
            opacity: 0.55;
            cursor: not-allowed;
          }

          .admin-session-assignment-saving {
            color: #d99a68;
            font-size: 0.65rem;
          }

          .admin-session-note {
            margin-top: 8px;
            color: #8f837a;
            font-size: 0.67rem;
          }

          /* =================================================
             RESPONSIVE
          ================================================= */

          @media (max-width: 1100px) {

            .admin-stats {
              grid-template-columns:
                repeat(2, minmax(0, 1fr));
            }

            .admin-session-summary-grid {
              grid-template-columns:
                repeat(2, minmax(0, 1fr));
            }
          }

          @media (max-width: 800px) {

            .admin-session-order-top,
            .admin-session-order-footer {
              align-items: flex-start;
              flex-direction: column;
            }

            .admin-session-order-right {
              width: 100%;
              justify-content:
                space-between;
            }
          }

          @media (max-width: 560px) {

            .admin-stats {
              grid-template-columns: 1fr;
            }

            .admin-topbar {
              align-items: flex-start;
              flex-direction: column;
            }

            .admin-session-summary-grid {
              grid-template-columns: 1fr;
            }
          }

        `}
      </style>

      {/* =================================================
          ORDERS HEADER
      ================================================= */}

      <div className="admin-topbar">

        <div>

          <h1>
            Orders
          </h1>

          <p>
            Monitor customer sessions and manage waiter assignments
          </p>

        </div>

        <button
          className="admin-refresh-button"
          onClick={
            handleRefresh
          }
          disabled={
            loading ||
            waitersLoading
          }
        >
          ↻

          {loading ||
          waitersLoading
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
            Unable to load order data
          </strong>

          <div>
            {error}
          </div>

          <button
            className="admin-retry"
            onClick={
              handleRefresh
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

        {/* TOTAL */}

        <div className="admin-stat-card">

          <div className="admin-stat-top">

            <span className="admin-stat-label">
              Total Orders
            </span>

            <span className="admin-stat-icon">
              ◴
            </span>

          </div>

          <div className="admin-stat-value">
            {summary.total}
          </div>

          <div className="admin-stat-description">
            Individual orders
          </div>

        </div>

        {/* PLACED */}

        <div className="admin-stat-card">

          <div className="admin-stat-top">

            <span className="admin-stat-label">
              Placed
            </span>

            <span className="admin-stat-icon">
              ●
            </span>

          </div>

          <div className="admin-stat-value">
            {summary.placed}
          </div>

          <div className="admin-stat-description">
            Waiting for kitchen
          </div>

        </div>

        {/* PREPARING */}

        <div className="admin-stat-card">

          <div className="admin-stat-top">

            <span className="admin-stat-label">
              Preparing
            </span>

            <span className="admin-stat-icon">
              ◌
            </span>

          </div>

          <div className="admin-stat-value">
            {summary.preparing}
          </div>

          <div className="admin-stat-description">
            Currently in kitchen
          </div>

        </div>

        {/* READY */}

        <div className="admin-stat-card">

          <div className="admin-stat-top">

            <span className="admin-stat-label">
              Ready
            </span>

            <span className="admin-stat-icon">
              ✓
            </span>

          </div>

          <div className="admin-stat-value">
            {summary.ready}
          </div>

          <div className="admin-stat-description">
            Ready for waiter
          </div>

        </div>

      </section>

      {/* =================================================
          ORDERS PANEL
      ================================================= */}

      <section className="admin-panel">

        <div className="admin-panel-header">

          <h2>
            Customer Sessions
          </h2>

          <span>
            {
              visibleSessionGroups.length
            } sessions
          </span>

        </div>

        {/* =================================================
            FILTERS
        ================================================= */}

        <div className="admin-order-filter-area">

          <div className="admin-order-filters">

            {STATUS_OPTIONS.map(
              (status) => (

                <button
                  key={status}
                  type="button"
                  className={
                    `admin-order-filter ${
                      selectedStatus ===
                      status
                        ? "active"
                        : ""
                    }`
                  }
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

            Loading orders...

          </div>

        ) : visibleSessionGroups.length === 0 ? (

          <div className="admin-empty">
            No orders found.
          </div>

        ) : (

          <div className="admin-order-table-wrap">

            <table className="admin-order-table">

              <thead>

                <tr>

                  <th>
                    Session
                  </th>

                  <th>
                    Table
                  </th>

                  <th>
                    Orders
                  </th>

                  <th>
                    Total
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Waiter
                  </th>

                  <th>
                    Action
                  </th>

                </tr>

              </thead>

              <tbody>

                {visibleSessionGroups.map(
                  (group) => (

                    <tr
                      key={
                        group.key
                      }
                    >

                      {/* SESSION */}

                      <td>

                        {group.sessionCode ? (

                          <>

                            <div className="admin-session-title">
                              Customer
                              Session
                            </div>

                            <div className="admin-session-code">
                              {
                                group.sessionCode
                              }
                            </div>

                            <div className="admin-session-latest">
                              Latest:{" "}
                              {
                                group.latestOrder
                                  ?.orderNumber ||
                                "—"
                              }
                            </div>

                          </>

                        ) : (

                          <>

                            <div className="admin-session-title">
                              Individual
                              Order
                            </div>

                            <div className="admin-session-single">
                              Legacy order
                            </div>

                            <div className="admin-session-latest">
                              {
                                group.latestOrder
                                  ?.orderNumber
                              }
                            </div>

                          </>

                        )}

                      </td>

                      {/* TABLE */}

                      <td>

                        <div className="admin-order-table-number">
                          {
                            group.tableNumber
                          }
                        </div>

                      </td>

                      {/* ORDERS */}

                      <td>

                        <div className="admin-session-orders">

                          {
                            group.orderCount
                          }{" "}

                          {
                            group.orderCount ===
                            1
                              ? "Order"
                              : "Orders"
                          }

                        </div>

                        <div className="admin-session-orders-sub">
                          Customer session
                        </div>

                      </td>

                      {/* TOTAL */}

                      <td>

                        <div className="admin-order-total">

                          {formatCurrency(
                            group.totalAmount
                          )}

                        </div>

                      </td>

                      {/* STATUS */}

                      <td>

                        {group.displayStatus ===
                        "MIXED" ? (

                          <>

                            <span className="admin-order-status mixed">
                              MIXED
                            </span>

                            <div className="admin-session-status-note">

                              {
                                group.statuses.join(
                                  " • "
                                )
                              }

                            </div>

                          </>

                        ) : (

                          <span
                            className={
                              getOrderStatusClass(
                                group.displayStatus
                              )
                            }
                          >
                            {
                              group.displayStatus
                            }
                          </span>

                        )}

                      </td>

                      {/* WAITER */}

                      <td>

                        <div
                          className={
                            group.waiterDisplay ===
                            "Multiple waiters"
                              ? "admin-waiter-display admin-waiter-multiple"
                              : "admin-waiter-display"
                          }
                        >
                          {
                            group.waiterDisplay
                          }
                        </div>

                      </td>

                      {/* ACTION */}

                      <td>

                        <button
                          type="button"
                          className="admin-order-view-button"
                          onClick={() =>
                            openSession(
                              group
                            )
                          }
                        >
                          {
                            group.sessionCode
                              ? "View Session"
                              : "View Order"
                          }
                        </button>

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
          SESSION DETAILS MODAL
      ===================================================== */}

      {selectedSession && (

        <div
          className="admin-order-modal-overlay"
          onClick={() =>
            setSelectedSession(
              null
            )
          }
        >

          <div
            className="admin-order-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* =================================================
                MODAL HEADER
            ================================================= */}

            <div className="admin-order-modal-header">

              <div className="admin-modal-title-group">

                <h2>

                  Table{" "}

                  {
                    selectedSession.tableNumber
                  }

                  {
                    selectedSession.sessionCode
                      ? ` • Session ${selectedSession.sessionCode}`
                      : ""
                  }

                </h2>

                <p>

                  {
                    selectedSession.sessionCode
                      ? (
                        <>
                          Customer session code:{" "}

                          <span className="admin-modal-session-code">
                            {
                              selectedSession.sessionCode
                            }
                          </span>
                        </>
                      )
                      : "Legacy order without session code"
                  }

                </p>

              </div>

              <button
                type="button"
                className="admin-order-modal-close"
                onClick={() =>
                  setSelectedSession(
                    null
                  )
                }
              >
                ×
              </button>

            </div>

            <div className="admin-order-modal-body">

              {/* =================================================
                  SESSION SUMMARY
              ================================================= */}

              <div className="admin-session-summary-grid">

                <div className="admin-session-summary-card">

                  <span>
                    Table
                  </span>

                  <strong>
                    {
                      selectedSession.tableNumber
                    }
                  </strong>

                </div>

                <div className="admin-session-summary-card">

                  <span>
                    Orders
                  </span>

                  <strong>
                    {
                      selectedSession.orderCount
                    }
                  </strong>

                </div>

                <div className="admin-session-summary-card">

                  <span>
                    Session Total
                  </span>

                  <strong>
                    {
                      formatCurrency(
                        selectedSession.totalAmount
                      )
                    }
                  </strong>

                </div>

                <div className="admin-session-summary-card">

                  <span>
                    Status
                  </span>

                  <strong>
                    {
                      selectedSession.displayStatus
                    }
                  </strong>

                </div>

              </div>

              {/* =================================================
                  ORDERS
              ================================================= */}

              <h3 className="admin-session-orders-title">
                Orders in this session
              </h3>

              {selectedSession.orders.map(
                (order) => (

                  <div
                    key={
                      order.orderId
                    }
                    className="admin-session-order-card"
                  >

                    {/* ORDER HEADER */}

                    <div className="admin-session-order-top">

                      <div>

                        <div className="admin-session-order-number">
                          {
                            order.orderNumber
                          }
                        </div>

                        <div className="admin-session-order-meta">
                          Order ID:{" "}
                          {
                            order.orderId
                          }
                        </div>

                      </div>

                      <div className="admin-session-order-right">

                        <span
                          className={
                            getOrderStatusClass(
                              order.status
                            )
                          }
                        >
                          {
                            order.status
                          }
                        </span>

                        <span className="admin-session-order-amount">
                          {
                            formatCurrency(
                              order.totalAmount
                            )
                          }
                        </span>

                      </div>

                    </div>

                    {/* =================================================
                        ITEMS
                    ================================================= */}

                    {
                      Array.isArray(
                        order.items
                      ) &&
                      order.items.length > 0 ? (

                        order.items.map(
                          (
                            item,
                            index
                          ) => (

                            <div
                              key={
                                `${order.orderId}-${item.menuItemId || "item"}-${index}`
                              }
                              className="admin-session-order-item"
                            >

                              <div>

                                <div className="admin-session-order-item-name">

                                  {
                                    item.menuItemName
                                  }{" "}

                                  ×{" "}

                                  {
                                    item.quantity
                                  }

                                </div>

                                <div className="admin-session-order-item-meta">

                                  ₹
                                  {Number(
                                    item.unitPrice ||
                                      0
                                  ).toFixed(2)}

                                  {" × "}

                                  {
                                    item.quantity
                                  }

                                </div>

                                {
                                  item.specialInstruction &&
                                  (
                                    <div className="admin-session-note">

                                      Note:{" "}

                                      {
                                        item.specialInstruction
                                      }

                                    </div>
                                  )
                                }

                              </div>

                              <div className="admin-session-order-item-price">

                                {
                                  formatCurrency(
                                    item.totalPrice
                                  )
                                }

                              </div>

                            </div>

                          )
                        )

                      ) : (

                        <div className="admin-empty">
                          No items available.
                        </div>

                      )
                    }

                    {/* =================================================
                        ORDER FOOTER
                    ================================================= */}

                    <div className="admin-session-order-footer">

                      <div className="admin-session-waiter">

                        <span className="admin-session-waiter-label">
                          Waiter:
                        </span>

                        <select
                          className="admin-session-waiter-select"
                          value={
                            order.waiterId ||
                            ""
                          }
                          disabled={
                            waitersLoading ||
                            assigningOrderId ===
                              order.orderId
                          }
                          onChange={(
                            event
                          ) =>
                            assignWaiter(
                              order.orderId,
                              event.target
                                .value
                            )
                          }
                        >

                          <option value="">
                            {
                              order.waiterName
                                ? order.waiterName
                                : "Assign waiter"
                            }
                          </option>

                          {
                            waiters.map(
                              (waiter) => (

                                <option
                                  key={
                                    waiter.id
                                  }
                                  value={
                                    waiter.id
                                  }
                                >
                                  {
                                    waiter.fullName
                                  }
                                </option>

                              )
                            )
                          }

                        </select>

                        {
                          assigningOrderId ===
                            order.orderId && (

                            <span className="admin-session-assignment-saving">
                              Saving...
                            </span>

                          )
                        }

                      </div>

                    </div>

                  </div>

                )
              )}

            </div>

          </div>

        </div>

      )}

    </>
  );
}

export default AdminOrders;