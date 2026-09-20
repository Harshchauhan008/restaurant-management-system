import { useEffect, useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080/api";

function Reservation() {
  const [isOpen, setIsOpen] = useState(false);

  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    partySize: 2,
    reservationDate: "",
    reservationTime: "",
    tableId: "",
  });

  const [tables, setTables] = useState([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  // --------------------------------------------------
  // TODAY'S DATE
  // --------------------------------------------------

  const getToday = () => {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  // --------------------------------------------------
  // SAFELY READ BACKEND RESPONSE
  // --------------------------------------------------

  const readResponse = async (response) => {
    const text = await response.text();

    if (!text || !text.trim()) {
      return {};
    }

    try {
      return JSON.parse(text);
    } catch {
      return {
        rawResponse: text,
      };
    }
  };

  // --------------------------------------------------
  // OPEN RESERVATION MODAL
  // --------------------------------------------------

  useEffect(() => {
    const openReservation = () => {
      setIsOpen(true);

      setMessage({
        type: "",
        text: "",
      });
    };

    window.addEventListener(
      "openReservation",
      openReservation
    );

    return () => {
      window.removeEventListener(
        "openReservation",
        openReservation
      );
    };
  }, []);

  // --------------------------------------------------
  // CLOSE WITH ESC
  // --------------------------------------------------

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        closeModal();
      }
    };

    if (isOpen) {
      document.addEventListener(
        "keydown",
        handleEscape
      );
    }

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [isOpen, submitting]);

  // --------------------------------------------------
  // PREVENT BACKGROUND SCROLL
  // --------------------------------------------------

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // --------------------------------------------------
  // RESET FORM
  // --------------------------------------------------

  const resetForm = () => {
    setFormData({
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      partySize: 2,
      reservationDate: getToday(),
      reservationTime: "",
      tableId: "",
    });

    setTables([]);

    setMessage({
      type: "",
      text: "",
    });
  };

  // --------------------------------------------------
  // CLOSE MODAL
  // --------------------------------------------------

  const closeModal = () => {
    if (submitting) {
      return;
    }

    setIsOpen(false);
    resetForm();
  };

  // --------------------------------------------------
  // FORM CHANGE
  // --------------------------------------------------

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (
      name === "reservationDate" ||
      name === "reservationTime" ||
      name === "partySize"
    ) {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        tableId: "",
      }));

      setTables([]);
    }

    setMessage({
      type: "",
      text: "",
    });
  };

  // --------------------------------------------------
  // CHECK AVAILABLE TABLES
  // --------------------------------------------------

  const findAvailableTables = async () => {
    setMessage({
      type: "",
      text: "",
    });

    if (!formData.reservationDate) {
      setMessage({
        type: "error",
        text: "Please select a reservation date.",
      });

      return;
    }

    if (!formData.reservationTime) {
      setMessage({
        type: "error",
        text: "Please select a reservation time.",
      });

      return;
    }

    if (
      !formData.partySize ||
      Number(formData.partySize) < 1
    ) {
      setMessage({
        type: "error",
        text: "Please enter the number of guests.",
      });

      return;
    }

    try {
      setLoadingTables(true);
      setTables([]);

      const params = new URLSearchParams({
        date: formData.reservationDate,
        time: formData.reservationTime,
        partySize: String(formData.partySize),
      });

      const url =
        `${API_BASE_URL}/reservations/available-tables?` +
        params.toString();

      const response = await fetch(url);

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            data?.rawResponse ||
            `Server error (${response.status})`
        );
      }

      if (!Array.isArray(data)) {
        throw new Error(
          "The server returned an invalid table availability response."
        );
      }

      setTables(data);

      if (data.length === 0) {
        setMessage({
          type: "error",
          text:
            "No tables are available for this date, time and number of guests.",
        });

        return;
      }

      setMessage({
        type: "success",
        text:
          `${data.length} table${
            data.length === 1 ? "" : "s"
          } available. Please select a table.`,
      });
    } catch (error) {
      setTables([]);

      setMessage({
        type: "error",
        text:
          error.message ||
          "Unable to check table availability.",
      });
    } finally {
      setLoadingTables(false);
    }
  };

  // --------------------------------------------------
  // VALIDATE FORM
  // --------------------------------------------------

  const validateForm = () => {
    if (!formData.customerName.trim()) {
      return "Please enter your name.";
    }

    if (!formData.customerPhone.trim()) {
      return "Please enter your phone number.";
    }

    if (
      !/^[0-9+\-\s()]{7,20}$/.test(
        formData.customerPhone.trim()
      )
    ) {
      return "Please enter a valid phone number.";
    }

    if (!formData.customerEmail.trim()) {
      return "Please enter your email address.";
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        formData.customerEmail.trim()
      )
    ) {
      return "Please enter a valid email address.";
    }

    if (
      !formData.partySize ||
      Number(formData.partySize) < 1
    ) {
      return "Please enter the number of guests.";
    }

    if (!formData.reservationDate) {
      return "Please select a reservation date.";
    }

    if (!formData.reservationTime) {
      return "Please select a reservation time.";
    }

    if (!formData.tableId) {
      return "Please check availability and select a table.";
    }

    return null;
  };

  // --------------------------------------------------
  // CREATE RESERVATION
  // --------------------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage({
      type: "",
      text: "",
    });

    const validationError =
      validateForm();

    if (validationError) {
      setMessage({
        type: "error",
        text: validationError,
      });

      return;
    }

    try {
      setSubmitting(true);

      const requestBody = {
        customerName:
          formData.customerName.trim(),

        customerPhone:
          formData.customerPhone.trim(),

        customerEmail:
          formData.customerEmail.trim(),

        tableId:
          Number(formData.tableId),

        reservationDate:
          formData.reservationDate,

        reservationTime:
          formData.reservationTime,

        partySize:
          Number(formData.partySize),
      };

      const response = await fetch(
        `${API_BASE_URL}/reservations`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            requestBody
          ),
        }
      );

      const data =
        await readResponse(response);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            data?.rawResponse ||
            `Server error (${response.status})`
        );
      }

      const reservationNumber =
        data?.reservationNumber ||
        data?.reservation?.reservationNumber;

      setMessage({
        type: "success",

        text: reservationNumber
          ? `Reservation request submitted successfully. Your reservation number is ${reservationNumber}. Please wait for confirmation. A confirmation email will be sent once the restaurant confirms your reservation.`
          : "Reservation request submitted successfully. Please wait for confirmation. A confirmation email will be sent once the restaurant confirms your reservation.",
      });

      setFormData({
        customerName: "",
        customerPhone: "",
        customerEmail: "",
        partySize: 2,
        reservationDate: getToday(),
        reservationTime: "",
        tableId: "",
      });

      setTables([]);
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error.message ||
          "Something went wrong while creating your reservation.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // --------------------------------------------------
  // MODAL CLOSED
  // --------------------------------------------------

  if (!isOpen) {
    return null;
  }

  // --------------------------------------------------
  // MODAL
  // --------------------------------------------------

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background:
          "rgba(0, 0, 0, 0.72)",

        display: "flex",
        alignItems: "center",
        justifyContent: "center",

        padding: "20px",
      }}

      onMouseDown={(e) => {
        if (
          e.target === e.currentTarget
        ) {
          closeModal();
        }
      }}
    >
      {/* MODAL BOX */}

      <div
        style={{
          width: "100%",
          maxWidth: "720px",

          maxHeight: "92vh",

          overflowY: "auto",

          background: "#ffffff",

          borderRadius: "18px",

          boxShadow:
            "0 25px 70px rgba(0,0,0,0.35)",

          position: "relative",
        }}

        onMouseDown={(e) => {
          e.stopPropagation();
        }}
      >
        {/* --------------------------------------- */}
        {/* HEADER */}
        {/* --------------------------------------- */}

        <div
          style={{
            padding:
              "26px 30px 22px",

            borderBottom:
              "1px solid #e8e8e8",

            display: "flex",

            alignItems:
              "flex-start",

            justifyContent:
              "space-between",

            gap: "20px",
          }}
        >
          <div>
            <p
              style={{
                margin:
                  "0 0 7px",

                fontSize: "12px",

                fontWeight: "700",

                letterSpacing:
                  "2px",

                color: "#c97945",
              }}
            >
              PLAN YOUR VISIT
            </p>

            <h2
              style={{
                margin: 0,

                fontSize: "28px",

                color: "#1c1715",

                fontWeight: "700",
              }}
            >
              Reserve a Table
            </h2>

            <p
              style={{
                margin:
                  "8px 0 0",

                color: "#777",

                fontSize: "14px",
              }}
            >
              Reserve your table at
              Restaurant.
            </p>
          </div>

          {/* CLOSE BUTTON */}

          <button
            type="button"
            onClick={closeModal}
            disabled={submitting}
            aria-label="Close reservation"
            style={{
              width: "38px",
              height: "38px",

              borderRadius: "50%",

              border:
                "1px solid #ddd",

              background: "#fff",

              color: "#333",

              fontSize: "22px",

              cursor:
                submitting
                  ? "not-allowed"
                  : "pointer",

              display: "flex",

              alignItems:
                "center",

              justifyContent:
                "center",

              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        {/* --------------------------------------- */}
        {/* FORM */}
        {/* --------------------------------------- */}

        <form
          onSubmit={handleSubmit}
          style={{
            padding:
              "28px 30px 30px",
          }}
        >
          {/* CUSTOMER DETAILS */}

          <div
            style={{
              display: "grid",

              gridTemplateColumns:
                "repeat(2, minmax(0, 1fr))",

              gap: "18px",
            }}
          >
            {/* NAME */}

            <div>
              <label
                htmlFor="customerName"
                style={labelStyle}
              >
                Guest Name
              </label>

              <input
                id="customerName"
                type="text"
                name="customerName"
                value={
                  formData.customerName
                }
                onChange={handleChange}
                placeholder="Enter your name"
                autoComplete="name"
                style={inputStyle}
              />
            </div>

            {/* PHONE */}

            <div>
              <label
                htmlFor="customerPhone"
                style={labelStyle}
              >
                Phone
              </label>

              <input
                id="customerPhone"
                type="tel"
                name="customerPhone"
                value={
                  formData.customerPhone
                }
                onChange={handleChange}
                placeholder="Enter phone number"
                autoComplete="tel"
                style={inputStyle}
              />
            </div>

            {/* EMAIL */}

            <div>
              <label
                htmlFor="customerEmail"
                style={labelStyle}
              >
                Email
              </label>

              <input
                id="customerEmail"
                type="email"
                name="customerEmail"
                value={
                  formData.customerEmail
                }
                onChange={handleChange}
                placeholder="Enter email address"
                autoComplete="email"
                style={inputStyle}
              />
            </div>

            {/* GUESTS */}

            <div>
              <label
                htmlFor="partySize"
                style={labelStyle}
              >
                Number of Guests
              </label>

              <input
                id="partySize"
                type="number"
                name="partySize"
                min="1"
                max="20"
                value={
                  formData.partySize
                }
                onChange={handleChange}
                style={inputStyle}
              />
            </div>

            {/* DATE */}

            <div>
              <label
                htmlFor="reservationDate"
                style={labelStyle}
              >
                Reservation Date
              </label>

              <input
                id="reservationDate"
                type="date"
                name="reservationDate"
                min={getToday()}
                value={
                  formData.reservationDate
                }
                onChange={handleChange}
                style={inputStyle}
              />
            </div>

            {/* TIME */}

            <div>
              <label
                htmlFor="reservationTime"
                style={labelStyle}
              >
                Reservation Time
              </label>

              <input
                id="reservationTime"
                type="time"
                name="reservationTime"
                value={
                  formData.reservationTime
                }
                onChange={handleChange}
                style={inputStyle}
              />
            </div>
          </div>

          {/* --------------------------------------- */}
          {/* CHECK AVAILABILITY */}
          {/* --------------------------------------- */}

          <div
            style={{
              marginTop: "22px",

              paddingTop: "22px",

              borderTop:
                "1px solid #eeeeee",
            }}
          >
            <button
              type="button"
              onClick={
                findAvailableTables
              }
              disabled={
                loadingTables
              }
              className="btn btn-primary"
              style={{
                minWidth: "190px",
              }}
            >
              {loadingTables
                ? "Checking..."
                : "Check Availability"}
            </button>
          </div>

          {/* --------------------------------------- */}
          {/* AVAILABLE TABLES */}
          {/* --------------------------------------- */}

          {tables.length > 0 && (
            <div
              style={{
                marginTop: "20px",
              }}
            >
              <label
                htmlFor="tableId"
                style={labelStyle}
              >
                Available Table
              </label>

              <select
                id="tableId"
                name="tableId"
                value={
                  formData.tableId
                }
                onChange={handleChange}
                style={inputStyle}
              >
                <option value="">
                  Select a table
                </option>

                {tables.map((table) => (
                  <option
                    key={table.tableId}
                    value={table.tableId}
                  >
                    {table.tableNumber}

                    {table.location
                      ? ` — ${table.location}`
                      : ""}

                    {table.capacity
                      ? ` — ${table.capacity} guests`
                      : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* --------------------------------------- */}
          {/* MESSAGE */}
          {/* --------------------------------------- */}

          {message.text && (
            <div
              role="alert"
              style={{
                marginTop: "20px",

                padding:
                  "13px 15px",

                borderRadius: "9px",

                fontSize: "14px",

                lineHeight: "1.5",

                background:
                  message.type ===
                  "success"
                    ? "#edf8f0"
                    : "#fff1f0",

                color:
                  message.type ===
                  "success"
                    ? "#24723b"
                    : "#b42318",

                border:
                  message.type ===
                  "success"
                    ? "1px solid #ccebd4"
                    : "1px solid #f4c7c3",
              }}
            >
              {message.text}
            </div>
          )}

          {/* --------------------------------------- */}
          {/* FOOTER BUTTONS */}
          {/* --------------------------------------- */}

          <div
            style={{
              marginTop: "26px",

              paddingTop: "20px",

              borderTop:
                "1px solid #eeeeee",

              display: "flex",

              justifyContent:
                "flex-end",

              gap: "12px",
            }}
          >
            <button
              type="button"
              onClick={closeModal}
              disabled={submitting}
              style={{
                padding:
                  "12px 22px",

                borderRadius: "8px",

                border:
                  "1px solid #d7d7d7",

                background: "#fff",

                color: "#333",

                fontWeight: "600",

                cursor:
                  submitting
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                submitting
              }
              className="btn btn-primary"
              style={{
                minWidth: "170px",
              }}
            >
              {submitting
                ? "Submitting..."
                : "Reserve Table"}
            </button>
          </div>

          <p
            style={{
              margin:
                "16px 0 0",

              textAlign:
                "center",

              fontSize: "12px",

              color: "#888",
            }}
          >
            Your reservation will be
            confirmed by the restaurant.
          </p>
        </form>
      </div>
    </div>
  );
}

// --------------------------------------------------
// LABEL STYLE
// --------------------------------------------------

const labelStyle = {
  display: "block",

  marginBottom: "7px",

  fontSize: "13px",

  fontWeight: "600",

  color: "#333",
};

// --------------------------------------------------
// INPUT STYLE
// --------------------------------------------------

const inputStyle = {
  width: "100%",

  boxSizing: "border-box",

  padding: "12px 13px",

  border:
    "1px solid #d8d8d8",

  borderRadius: "8px",

  background: "#fff",

  color: "#222",

  fontSize: "14px",

  outline: "none",
};

export default Reservation;