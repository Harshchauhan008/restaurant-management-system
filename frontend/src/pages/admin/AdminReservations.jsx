import { useEffect, useMemo, useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080/api";

function AdminReservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] =
    useState("ALL");

  const [selectedReservation, setSelectedReservation] =
    useState(null);

  const token = localStorage.getItem("token");

  // =====================================================
  // LOAD RESERVATIONS
  // =====================================================

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = async () => {
    try {
      setLoading(true);
      setError("");

      if (!token) {
        throw new Error(
          "Admin login session not found. Please login again."
        );
      }

      const response = await fetch(
        `${API_BASE_URL}/reservations`,
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
            "You do not have permission to view reservations."
          );
        }

        throw new Error(
          data?.message ||
            `Failed to load reservations (${response.status})`
        );
      }

      setReservations(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      setError(
        err.message ||
          "Unable to load reservations."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // FILTER
  // =====================================================

  const filteredReservations =
    useMemo(() => {
      if (statusFilter === "ALL") {
        return reservations;
      }

      return reservations.filter(
        (reservation) =>
          reservation.status === statusFilter
      );
    }, [
      reservations,
      statusFilter,
    ]);

  // =====================================================
  // COUNTS
  // =====================================================

  const totalReservations =
    reservations.length;

  const pendingReservations =
    reservations.filter(
      (reservation) =>
        reservation.status === "PENDING"
    ).length;

  const confirmedReservations =
    reservations.filter(
      (reservation) =>
        reservation.status === "CONFIRMED"
    ).length;

  const seatedReservations =
    reservations.filter(
      (reservation) =>
        reservation.status === "SEATED"
    ).length;

  const cancelledReservations =
    reservations.filter(
      (reservation) =>
        reservation.status === "CANCELLED"
    ).length;

  // =====================================================
  // STATUS CLASS
  // =====================================================

  const getStatusClass = (status) => {
    switch (status) {
      case "PENDING":
        return "pending";

      case "CONFIRMED":
        return "confirmed";

      case "SEATED":
        return "seated";

      case "COMPLETED":
        return "completed";

      case "CANCELLED":
        return "cancelled";

      default:
        return "unknown";
    }
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (date) => {
    if (!date) {
      return "—";
    }

    try {
      return new Date(
        `${date}T00:00:00`
      ).toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      );
    } catch {
      return date;
    }
  };

  // =====================================================
  // FORMAT TIME
  // =====================================================

  const formatTime = (time) => {
    if (!time) {
      return "—";
    }

    const parts =
      time.split(":");

    if (parts.length < 2) {
      return time;
    }

    let hours =
      Number(parts[0]);

    const minutes =
      parts[1];

    const period =
      hours >= 12
        ? "PM"
        : "AM";

    hours =
      hours % 12 || 12;

    return `${hours}:${minutes} ${period}`;
  };

  // =====================================================
  // OPEN DETAILS
  // =====================================================

  const openDetails = (
    reservation
  ) => {
    setSelectedReservation(
      reservation
    );
  };

  // =====================================================
  // CLOSE DETAILS
  // =====================================================

  const closeDetails = () => {
    setSelectedReservation(
      null
    );
  };

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

          .reservation-topbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            margin-bottom: 28px;
          }

          .reservation-topbar h1 {
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

          .reservation-topbar p {
            margin: 7px 0 0;
            color: #958981;
            font-size: 0.92rem;
          }

          .reservation-topbar-actions {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .reservation-refresh-button {
            padding: 11px 16px;
            border:
              1px solid
              rgba(201,123,74,0.30);
            border-radius: 9px;
            background:
              rgba(201,123,74,0.10);
            color: #e3a16f;
            font: inherit;
            font-size: 0.82rem;
            font-weight: 600;
            cursor: pointer;
          }

          .reservation-refresh-button:hover {
            background:
              rgba(201,123,74,0.18);
          }

          .reservation-refresh-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          /* =================================================
             STATS
          ================================================= */

          .reservation-stats {
            display: grid;
            grid-template-columns:
              repeat(4, minmax(0, 1fr));
            gap: 16px;
            margin-bottom: 24px;
          }

          .reservation-stat-card {
            padding: 20px;
            background: #211b18;
            border:
              1px solid
              rgba(255,255,255,0.07);
            border-radius: 13px;
            box-shadow:
              0 12px 30px
              rgba(0,0,0,0.14);
          }

          .reservation-stat-label {
            color: #91857d;
            font-size: 0.75rem;
            font-weight: 600;
            letter-spacing: 0.04em;
            text-transform: uppercase;
          }

          .reservation-stat-value {
            margin-top: 12px;
            color: #fffaf5;
            font-family:
              Georgia,
              "Times New Roman",
              serif;
            font-size: 2rem;
            font-weight: 600;
          }

          .reservation-stat-description {
            margin-top: 5px;
            color: #756b64;
            font-size: 0.78rem;
          }

          /* =================================================
             TOOLBAR
          ================================================= */

          .reservation-toolbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
            margin-bottom: 18px;
          }

          .reservation-filter-group {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }

          .reservation-filter-button {
            padding: 9px 13px;
            border:
              1px solid
              rgba(255,255,255,0.08);
            border-radius: 8px;
            background:
              rgba(255,255,255,0.03);
            color: #9e9289;
            font: inherit;
            font-size: 0.76rem;
            font-weight: 600;
            cursor: pointer;
          }

          .reservation-filter-button:hover {
            border-color:
              rgba(201,123,74,0.25);
            color: #d3a07a;
          }

          .reservation-filter-button.active {
            border-color:
              rgba(201,123,74,0.45);
            background:
              rgba(201,123,74,0.12);
            color: #e3a16f;
          }

          .reservation-result-count {
            color: #756b64;
            font-size: 0.78rem;
          }

          /* =================================================
             PANEL
          ================================================= */

          .reservation-panel {
            overflow: hidden;
            background: #211b18;
            border:
              1px solid
              rgba(255,255,255,0.07);
            border-radius: 14px;
            box-shadow:
              0 12px 30px
              rgba(0,0,0,0.14);
          }

          .reservation-panel-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
            padding: 20px 22px;
            border-bottom:
              1px solid
              rgba(255,255,255,0.07);
          }

          .reservation-panel-header h2 {
            margin: 0;
            color: #f8f0e9;
            font-family:
              Georgia,
              "Times New Roman",
              serif;
            font-size: 1.15rem;
          }

          .reservation-panel-header span {
            color: #756b64;
            font-size: 0.76rem;
          }

          /* =================================================
             TABLE
          ================================================= */

          .reservation-table-wrapper {
            overflow-x: auto;
          }

          .reservation-table {
            width: 100%;
            min-width: 900px;
            border-collapse: collapse;
          }

          .reservation-table th {
            padding: 13px 18px;
            border-bottom:
              1px solid
              rgba(255,255,255,0.06);
            color: #746a63;
            font-size: 0.69rem;
            font-weight: 700;
            letter-spacing: 0.04em;
            text-align: left;
            text-transform: uppercase;
          }

          .reservation-table td {
            padding: 15px 18px;
            border-bottom:
              1px solid
              rgba(255,255,255,0.05);
            color: #c8beb7;
            font-size: 0.8rem;
            vertical-align: middle;
          }

          .reservation-table tbody tr:hover {
            background:
              rgba(255,255,255,0.018);
          }

          .reservation-table tbody tr:last-child td {
            border-bottom: 0;
          }

          .reservation-number {
            color: #e5a06d;
            font-weight: 700;
          }

          .reservation-customer {
            color: #f2ebe5;
            font-weight: 600;
          }

          .reservation-phone {
            margin-top: 3px;
            color: #726860;
            font-size: 0.72rem;
          }

          .reservation-table-number {
            display: inline-flex;
            padding: 5px 9px;
            border-radius: 7px;
            background:
              rgba(255,255,255,0.04);
            color: #d9cec5;
            font-weight: 600;
          }

          .reservation-date-block {
            white-space: nowrap;
          }

          .reservation-time {
            margin-top: 3px;
            color: #756b64;
            font-size: 0.72rem;
          }

          .reservation-party {
            color: #ddd2cb;
            font-weight: 600;
          }

          .reservation-status {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 9px;
            border-radius: 999px;
            font-size: 0.66rem;
            font-weight: 700;
          }

          .reservation-status::before {
            content: "";
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: currentColor;
          }

          .reservation-status.pending {
            color: #dfad73;
            background:
              rgba(223,173,115,0.10);
          }

          .reservation-status.confirmed {
            color: #83b8df;
            background:
              rgba(83,145,195,0.10);
          }

          .reservation-status.seated {
            color: #7fc99a;
            background:
              rgba(83,166,107,0.10);
          }

          .reservation-status.completed {
            color: #a8a09a;
            background:
              rgba(255,255,255,0.06);
          }

          .reservation-status.cancelled {
            color: #d8877b;
            background:
              rgba(205,92,75,0.10);
          }

          .reservation-status.unknown {
            color: #aaa19b;
            background:
              rgba(255,255,255,0.05);
          }

          .reservation-view-button {
            padding: 8px 11px;
            border:
              1px solid
              rgba(201,123,74,0.25);
            border-radius: 7px;
            background:
              rgba(201,123,74,0.07);
            color: #d79a6d;
            font: inherit;
            font-size: 0.72rem;
            font-weight: 600;
            cursor: pointer;
          }

          .reservation-view-button:hover {
            background:
              rgba(201,123,74,0.14);
          }

          /* =================================================
             EMPTY / LOADING / ERROR
          ================================================= */

          .reservation-loading,
          .reservation-empty {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 280px;
            color: #82766e;
            font-size: 0.85rem;
          }

          .reservation-loading {
            gap: 10px;
          }

          .reservation-spinner {
            width: 23px;
            height: 23px;
            border:
              3px solid
              #3a302b;
            border-top-color:
              #d38a55;
            border-radius: 50%;
            animation:
              reservationSpin
              0.8s linear infinite;
          }

          @keyframes reservationSpin {
            to {
              transform:
                rotate(360deg);
            }
          }

          .reservation-error {
            padding: 16px 18px;
            margin-bottom: 20px;
            border:
              1px solid
              rgba(205,92,75,0.25);
            border-radius: 10px;
            background:
              rgba(125,52,42,0.15);
            color: #e59a8b;
          }

          .reservation-error strong {
            display: block;
            margin-bottom: 5px;
            color: #f0ad9f;
          }

          .reservation-retry {
            margin-top: 10px;
            padding: 8px 12px;
            border:
              1px solid
              rgba(205,92,75,0.3);
            border-radius: 7px;
            background: transparent;
            color: #eca493;
            cursor: pointer;
          }

          /* =================================================
             DETAILS MODAL
          ================================================= */

          .reservation-modal-overlay {
            position: fixed;
            inset: 0;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background:
              rgba(0,0,0,0.72);
            backdrop-filter:
              blur(5px);
          }

          .reservation-modal {
            width: 100%;
            max-width: 520px;
            max-height: 90vh;
            overflow-y: auto;
            padding: 28px;
            background: #211b18;
            border:
              1px solid
              rgba(255,255,255,0.08);
            border-radius: 16px;
            box-shadow:
              0 25px 80px
              rgba(0,0,0,0.45);
          }

          .reservation-modal-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 15px;
            margin-bottom: 22px;
          }

          .reservation-modal-header h2 {
            margin: 0;
            color: #fffaf5;
            font-family:
              Georgia,
              "Times New Roman",
              serif;
            font-size: 1.45rem;
          }

          .reservation-modal-header p {
            margin: 6px 0 0;
            color: #766c64;
            font-size: 0.76rem;
          }

          .reservation-modal-close {
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

          .reservation-detail-grid {
            display: grid;
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
            gap: 12px;
          }

          .reservation-detail-card {
            padding: 13px;
            border-radius: 9px;
            background:
              #181411;
          }

          .reservation-detail-card.full {
            grid-column: 1 / -1;
          }

          .reservation-detail-label {
            margin-bottom: 6px;
            color: #70665f;
            font-size: 0.67rem;
            font-weight: 700;
            letter-spacing: 0.04em;
            text-transform: uppercase;
          }

          .reservation-detail-value {
            color: #e5dcd5;
            font-size: 0.82rem;
            font-weight: 600;
            overflow-wrap: anywhere;
          }

          .reservation-notes {
            white-space: pre-wrap;
            line-height: 1.55;
          }

          .reservation-modal-footer {
            display: flex;
            justify-content: flex-end;
            margin-top: 22px;
          }

          /* =================================================
             RESPONSIVE
          ================================================= */

          @media (max-width: 1000px) {

            .reservation-stats {
              grid-template-columns:
                repeat(2, minmax(0, 1fr));
            }

          }

          @media (max-width: 650px) {

            .reservation-topbar {
              align-items: flex-start;
              flex-direction: column;
            }

            .reservation-topbar-actions {
              width: 100%;
            }

            .reservation-refresh-button {
              width: 100%;
            }

            .reservation-toolbar {
              align-items: flex-start;
              flex-direction: column;
            }

            .reservation-stats {
              grid-template-columns:
                1fr;
            }

            .reservation-detail-grid {
              grid-template-columns:
                1fr;
            }

            .reservation-detail-card.full {
              grid-column: auto;
            }

          }

        `}
      </style>

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="reservation-topbar">

        <div>

          <h1>
            Reservations
          </h1>

          <p>
            Manage customer reservations and table bookings
          </p>

        </div>

        <div className="reservation-topbar-actions">

          <button
            className="reservation-refresh-button"
            onClick={loadReservations}
            disabled={loading}
          >
            ↻{" "}
            {loading
              ? "Refreshing..."
              : "Refresh"}
          </button>

        </div>

      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="reservation-error">

          <strong>
            Unable to load reservations
          </strong>

          <div>
            {error}
          </div>

          <button
            className="reservation-retry"
            onClick={loadReservations}
          >
            Try Again
          </button>

        </div>
      )}

      {/* =================================================
          STATS
      ================================================= */}

      <section className="reservation-stats">

        <div className="reservation-stat-card">

          <div className="reservation-stat-label">
            Total
          </div>

          <div className="reservation-stat-value">
            {totalReservations}
          </div>

          <div className="reservation-stat-description">
            All reservations
          </div>

        </div>

        <div className="reservation-stat-card">

          <div className="reservation-stat-label">
            Pending
          </div>

          <div className="reservation-stat-value">
            {pendingReservations}
          </div>

          <div className="reservation-stat-description">
            Awaiting confirmation
          </div>

        </div>

        <div className="reservation-stat-card">

          <div className="reservation-stat-label">
            Confirmed
          </div>

          <div className="reservation-stat-value">
            {confirmedReservations}
          </div>

          <div className="reservation-stat-description">
            Confirmed bookings
          </div>

        </div>

        <div className="reservation-stat-card">

          <div className="reservation-stat-label">
            Seated
          </div>

          <div className="reservation-stat-value">
            {seatedReservations}
          </div>

          <div className="reservation-stat-description">
            Customers currently seated
          </div>

        </div>

      </section>

      {/* =================================================
          FILTER
      ================================================= */}

      <div className="reservation-toolbar">

        <div className="reservation-filter-group">

          {[
            "ALL",
            "PENDING",
            "CONFIRMED",
            "SEATED",
            "COMPLETED",
            "CANCELLED",
          ].map(
            (status) => (

              <button
                key={status}
                className={
                  `reservation-filter-button ${
                    statusFilter === status
                      ? "active"
                      : ""
                  }`
                }
                onClick={() =>
                  setStatusFilter(
                    status
                  )
                }
              >
                {status === "ALL"
                  ? "All"
                  : status}
              </button>

            )
          )}

        </div>

        <span className="reservation-result-count">

          Showing{" "}
          {filteredReservations.length}{" "}
          reservation
          {filteredReservations.length !== 1
            ? "s"
            : ""}

        </span>

      </div>

      {/* =================================================
          RESERVATION TABLE
      ================================================= */}

      <section className="reservation-panel">

        <div className="reservation-panel-header">

          <h2>
            Reservation List
          </h2>

          <span>
            {totalReservations} total
          </span>

        </div>

        {loading ? (

          <div className="reservation-loading">

            <div className="reservation-spinner"></div>

            Loading reservations...

          </div>

        ) : filteredReservations.length === 0 ? (

          <div className="reservation-empty">
            No reservations found for this filter.
          </div>

        ) : (

          <div className="reservation-table-wrapper">

            <table className="reservation-table">

              <thead>

                <tr>

                  <th>
                    Reservation
                  </th>

                  <th>
                    Customer
                  </th>

                  <th>
                    Table
                  </th>

                  <th>
                    Date & Time
                  </th>

                  <th>
                    Guests
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Action
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredReservations.map(
                  (reservation) => (

                    <tr
                      key={
                        reservation.id
                      }
                    >

                      <td>

                        <div className="reservation-number">
                          {
                            reservation.reservationNumber ||
                            `RES-${reservation.id}`
                          }
                        </div>

                      </td>

                      <td>

                        <div className="reservation-customer">
                          {
                            reservation.customerName ||
                            "—"
                          }
                        </div>

                        <div className="reservation-phone">
                          {
                            reservation.customerPhone ||
                            "—"
                          }
                        </div>

                      </td>

                      <td>

                        <span className="reservation-table-number">
                          {
                            reservation.tableNumber ||
                            "—"
                          }
                        </span>

                      </td>

                      <td>

                        <div className="reservation-date-block">

                          {
                            formatDate(
                              reservation.reservationDate
                            )
                          }

                        </div>

                        <div className="reservation-time">

                          {
                            formatTime(
                              reservation.reservationTime
                            )
                          }

                        </div>

                      </td>

                      <td>

                        <span className="reservation-party">

                          {
                            reservation.partySize
                          }{" "}
                          {reservation.partySize ===
                          1
                            ? "guest"
                            : "guests"}

                        </span>

                      </td>

                      <td>

                        <span
                          className={
                            `reservation-status ${
                              getStatusClass(
                                reservation.status
                              )
                            }`
                          }
                        >
                          {
                            reservation.status ||
                            "UNKNOWN"
                          }
                        </span>

                      </td>

                      <td>

                        <button
                          className="reservation-view-button"
                          onClick={() =>
                            openDetails(
                              reservation
                            )
                          }
                        >
                          View
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

      {/* =================================================
          DETAILS MODAL
      ================================================= */}

      {selectedReservation && (

        <div
          className="reservation-modal-overlay"
          onMouseDown={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {
              closeDetails();
            }

          }}
        >

          <div className="reservation-modal">

            <div className="reservation-modal-header">

              <div>

                <h2>
                  Reservation Details
                </h2>

                <p>
                  {
                    selectedReservation.reservationNumber ||
                    `RES-${selectedReservation.id}`
                  }
                </p>

              </div>

              <button
                className="reservation-modal-close"
                onClick={
                  closeDetails
                }
              >
                ×
              </button>

            </div>

            <div className="reservation-detail-grid">

              {/* CUSTOMER */}

              <div className="reservation-detail-card">

                <div className="reservation-detail-label">
                  Customer
                </div>

                <div className="reservation-detail-value">

                  {
                    selectedReservation.customerName ||
                    "—"
                  }

                </div>

              </div>

              {/* PHONE */}

              <div className="reservation-detail-card">

                <div className="reservation-detail-label">
                  Phone
                </div>

                <div className="reservation-detail-value">

                  {
                    selectedReservation.customerPhone ||
                    "—"
                  }

                </div>

              </div>

              {/* TABLE */}

              <div className="reservation-detail-card">

                <div className="reservation-detail-label">
                  Table
                </div>

                <div className="reservation-detail-value">

                  {
                    selectedReservation.tableNumber ||
                    "—"
                  }

                </div>

              </div>

              {/* PARTY SIZE */}

              <div className="reservation-detail-card">

                <div className="reservation-detail-label">
                  Party Size
                </div>

                <div className="reservation-detail-value">

                  {
                    selectedReservation.partySize ||
                    "—"
                  }

                </div>

              </div>

              {/* DATE */}

              <div className="reservation-detail-card">

                <div className="reservation-detail-label">
                  Reservation Date
                </div>

                <div className="reservation-detail-value">

                  {
                    formatDate(
                      selectedReservation.reservationDate
                    )
                  }

                </div>

              </div>

              {/* TIME */}

              <div className="reservation-detail-card">

                <div className="reservation-detail-label">
                  Reservation Time
                </div>

                <div className="reservation-detail-value">

                  {
                    formatTime(
                      selectedReservation.reservationTime
                    )
                  }

                </div>

              </div>

              {/* STATUS */}

              <div className="reservation-detail-card">

                <div className="reservation-detail-label">
                  Status
                </div>

                <div className="reservation-detail-value">

                  <span
                    className={
                      `reservation-status ${
                        getStatusClass(
                          selectedReservation.status
                        )
                      }`
                    }
                  >
                    {
                      selectedReservation.status ||
                      "UNKNOWN"
                    }
                  </span>

                </div>

              </div>

              {/* TABLE ID */}

              <div className="reservation-detail-card">

                <div className="reservation-detail-label">
                  Table ID
                </div>

                <div className="reservation-detail-value">

                  {
                    selectedReservation.tableId ||
                    "—"
                  }

                </div>

              </div>

              {/* NOTES */}

              <div className="reservation-detail-card full">

                <div className="reservation-detail-label">
                  Notes
                </div>

                <div className="reservation-detail-value reservation-notes">

                  {
                    selectedReservation.notes ||
                    "No additional notes."
                  }

                </div>

              </div>

            </div>

            <div className="reservation-modal-footer">

              <button
                className="reservation-view-button"
                onClick={
                  closeDetails
                }
              >
                Close
              </button>

            </div>

          </div>

        </div>

      )}

    </>
  );
}

export default AdminReservations;