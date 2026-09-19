import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import "./CashierDashboard.css";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080/api";

/* =========================================================
   TABS
========================================================= */

const MAIN_TABS = [
    { key: "RECEPTION", label: "Reception" },
    { key: "BILLING", label: "Billing" },
    { key: "HISTORY", label: "Payment History" },
];

const RECEPTION_TABS = [
    { key: "RESERVATIONS", label: "Reservations" },
    { key: "TABLES", label: "Tables" },
    { key: "ORDERS", label: "Orders" },
];

const BILLING_TABS = [
    { key: "QUEUE", label: "Billing Queue" },
];

/* =========================================================
   SMALL UI HELPERS
========================================================= */

const statusLabel = (status) => {
    if (!status) return "UNKNOWN";
    return String(status)
        .replaceAll("_", " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getReservationStatusIcon = (status) => {
    switch (status) {
        case "PENDING": return "◷";
        case "CONFIRMED": return "✓";
        case "SEATED": return "●";
        case "COMPLETED": return "✓";
        case "CANCELLED": return "×";
        default: return "•";
    }
};

/* =========================================================
   COMPONENT
========================================================= */

function CashierDashboard() {
    const [activeMainTab, setActiveMainTab] = useState("RECEPTION");
    const [activeReceptionTab, setActiveReceptionTab] = useState("RESERVATIONS");
    const [activeBillingTab, setActiveBillingTab] = useState("QUEUE");

    const [orders, setOrders] = useState([]);
    const [allOrders, setAllOrders] = useState([]);
    const [bills, setBills] = useState([]);
    const [reservations, setReservations] = useState([]);
    const [tables, setTables] = useState([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [actionLoadingId, setActionLoadingId] = useState(null);
    const [selectedBill, setSelectedBill] = useState(null);
    const [billLoading, setBillLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [reservationFilter, setReservationFilter] = useState("ALL");
    const [tableFilter, setTableFilter] = useState("ALL");
    const [orderFilter, setOrderFilter] = useState("ALL");

    const [reservationView, setReservationView] = useState("DAY");

    const getTodayLocalString = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const [reservationDate, setReservationDate] = useState(() => getTodayLocalString());

    const [billingView, setBillingView] = useState("DAY");
    const [billingDate, setBillingDate] = useState(() => getTodayLocalString());

    const getBillingDateRange = useCallback(() => {
        const selectedDate = new Date(`${billingDate}T00:00:00`);
        let startDate;
        let endDate;

        if (billingView === "DAY") {
            startDate = new Date(selectedDate);
            endDate = new Date(selectedDate);
            endDate.setDate(endDate.getDate() + 1);
        } else if (billingView === "WEEK") {
            startDate = new Date(selectedDate);
            const day = startDate.getDay();
            const difference = day === 0 ? -6 : 1 - day;
            startDate.setDate(startDate.getDate() + difference);
            endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 7);
        } else {
            startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
            endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1);
        }

        const formatDateTime = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            const hours = String(date.getHours()).padStart(2, "0");
            const minutes = String(date.getMinutes()).padStart(2, "0");
            const seconds = String(date.getSeconds()).padStart(2, "0");
            return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
        };

        return { start: formatDateTime(startDate), end: formatDateTime(endDate) };
    }, [billingDate, billingView]);

    const [showReservationForm, setShowReservationForm] = useState(false);

    const [reservationForm, setReservationForm] = useState({
        customerName: "",
        customerPhone: "",
        customerEmail: "",
        tableId: "",
        date: getTodayLocalString(),
        time: "",
        partySize: 1,
    });

    const getToken = () => {
        return (
            localStorage.getItem("cashierToken") ||
            localStorage.getItem("receptionToken") ||
            localStorage.getItem("token") ||
            localStorage.getItem("accessToken") ||
            localStorage.getItem("jwtToken") ||
            ""
        );
    };

    const getHeaders = () => {
        const token = getToken();
        return {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
    };

    const requestJson = async (url, options = {}) => {
        const response = await fetch(url, {
            ...options,
            headers: { ...getHeaders(), ...(options.headers || {}) },
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
            let message = data?.message || data?.error || `Request failed (${response.status})`;

            if (response.status === 401) {
                message = "Cashier login session has expired. Please login again.";
            }

            if (response.status === 403) {
                message = data?.message || data?.error || "You do not have permission to perform this operation.";
            }

            const errorObject = new Error(message);
            errorObject.status = response.status;
            throw errorObject;
        }

        return data;
    };

    const requestWithFallback = async (requests) => {
        let lastError = null;

        for (const request of requests) {
            try {
                return await requestJson(request.url, request.options || {});
            } catch (err) {
                lastError = err;
                if (err.status === 401 || err.status === 403) throw err;
                if (err.status !== 404) throw err;
            }
        }

        throw (lastError || new Error("No available endpoint found."));
    };

    const getOrderId = (order) => order?.orderId ?? order?.id ?? null;
    const getReservationId = (reservation) => reservation?.reservationId ?? reservation?.id ?? null;
    const getTableId = (table) => table?.tableId ?? table?.id ?? null;

    const formatMoney = (value) => {
        return Number(value || 0).toLocaleString("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2,
        });
    };

    const formatDate = (value) => {
        if (!value) return "—";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;
        return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    };

    const formatReservationDate = (value) => {
        if (!value) return "—";
        const parts = String(value).substring(0, 10).split("-");
        if (parts.length !== 3) return formatDate(value);
        const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    };

    const formatTime = (value) => {
        if (!value) return "—";
        const stringValue = String(value);

        if (/^\d{2}:\d{2}/.test(stringValue)) {
            const parts = stringValue.split(":");
            const hour = Number(parts[0]);
            const minute = Number(parts[1]);
            const date = new Date();
            date.setHours(hour, minute, 0, 0);
            return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
        }

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;
        return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    };

    const getItemCount = (order) => {
        return (order?.items || []).reduce((total, item) => total + Number(item?.quantity || 0), 0);
    };

    const getBillOrdersText = (bill) => {
        if (Array.isArray(bill?.orderNumbers)) return bill.orderNumbers.join(", ");
        return bill?.orderNumber || "—";
    };

    const findExistingBill = (order, billList) => {
        if (!order || !Array.isArray(billList)) return null;

        const orderId = getOrderId(order);
        const orderNumber = String(order?.orderNumber || "").trim();

        return (
            billList.find((bill) => {
                if (orderNumber && Array.isArray(bill?.orderNumbers)) {
                    const match = bill.orderNumbers.some(
                        (number) => String(number || "").trim() === orderNumber
                    );
                    if (match) return true;
                }

                if (orderNumber && bill?.orderNumber && String(bill.orderNumber).trim() === orderNumber) {
                    return true;
                }

                if (orderId && bill?.orderId && String(bill.orderId) === String(orderId)) {
                    return true;
                }

                return false;
            }) || null
        );
    };

    const loadServedOrders = useCallback(async () => {
        const data = await requestJson(`${API_BASE_URL}/cashier/orders/served`);

        const normalized = Array.isArray(data)
            ? data
                  .map((order) => ({ ...order, orderId: getOrderId(order) }))
                  .filter((order) => order.orderId !== null)
            : [];

        setOrders(normalized);
    }, []);

    const loadAllOrders = useCallback(async () => {
        const data = await requestWithFallback([
            { url: `${API_BASE_URL}/reception/orders` },
            { url: `${API_BASE_URL}/orders` },
        ]);

        const normalized = Array.isArray(data)
            ? data.map((order) => ({ ...order, orderId: getOrderId(order) }))
            : [];

        setAllOrders(normalized);
    }, []);

    const loadBills = useCallback(async () => {
        const { start, end } = getBillingDateRange();
        const params = new URLSearchParams({ start, end });
        const data = await requestJson(`${API_BASE_URL}/bills/range?${params.toString()}`);
        setBills(Array.isArray(data) ? data : []);
    }, [getBillingDateRange]);

    const loadReservations = useCallback(async () => {
        const data = await requestJson(`${API_BASE_URL}/reservations`);
        setReservations(Array.isArray(data) ? data : []);
    }, []);

    const loadTables = useCallback(async () => {
        const data = await requestJson(`${API_BASE_URL}/reception/tables`);
        setTables(Array.isArray(data) ? data : []);
    }, []);

    const loadDashboard = useCallback(
        async (showLoader = false) => {
            try {
                if (showLoader) setLoading(true);
                else setRefreshing(true);

                setError("");

                await Promise.all([
                    loadServedOrders(),
                    loadAllOrders(),
                    loadBills(),
                    loadReservations(),
                    loadTables(),
                ]);
            } catch (err) {
                console.error("Dashboard load error:", err);
                setError(err.message || "Unable to load dashboard.");
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [loadServedOrders, loadAllOrders, loadBills, loadReservations, loadTables]
    );

    useEffect(() => {
        loadDashboard(true);
    }, [loadDashboard]);

    useEffect(() => {
        const interval = setInterval(() => {
            loadDashboard(false);
        }, 10000);

        return () => clearInterval(interval);
    }, [loadDashboard]);

    useEffect(() => {
        if (!successMessage) return;
        const timer = setTimeout(() => setSuccessMessage(""), 3500);
        return () => clearTimeout(timer);
    }, [successMessage]);

    useEffect(() => {
        if (activeMainTab === "HISTORY") {
            loadBills();
        }
    }, [billingView, billingDate, activeMainTab, loadBills]);

    const changeReservationStatus = async (reservation, action) => {
        const id = getReservationId(reservation);

        if (!id) {
            setError("Reservation ID is missing.");
            return;
        }

        const actionMap = {
            CONFIRM: { label: "confirm", path: "confirm" },
            CANCEL: { label: "cancel", path: "cancel" },
            SEAT: { label: "seat", path: "seat" },
            COMPLETE: { label: "complete", path: "complete" },
        };

        const config = actionMap[action];
        if (!config) return;

        try {
            setActionLoadingId(`reservation-${id}`);
            setError("");
            setSuccessMessage("");

            const updated = await requestWithFallback([
                {
                    url: `${API_BASE_URL}/reception/reservations/${id}/${config.path}`,
                    options: { method: "PATCH" },
                },
                {
                    url: `${API_BASE_URL}/reservations/${id}/${config.path}`,
                    options: { method: "PATCH" },
                },
            ]);

            if (updated) {
                setReservations((current) =>
                    current.map((item) => (getReservationId(item) === id ? updated : item))
                );
            }

            await Promise.all([loadReservations(), loadTables(), loadAllOrders()]);

            setSuccessMessage(`Reservation ${config.label}d successfully.`);
        } catch (err) {
            console.error("Reservation action error:", err);
            setError(err.message || `Unable to ${config.label} reservation.`);
        } finally {
            setActionLoadingId(null);
        }
    };

    const createReservation = async (event) => {
        event.preventDefault();

        const { customerName, customerPhone, customerEmail, tableId, date, time, partySize } = reservationForm;

        if (!customerName.trim()) {
            setError("Guest name is required.");
            return;
        }

        if (!customerPhone.trim()) {
            setError("Guest phone number is required.");
            return;
        }

        if (!customerEmail.trim()) {
            setError("Guest email is required.");
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim())) {
            setError("Please enter a valid email address.");
            return;
        }

        if (!tableId) {
            setError("Please select a table.");
            return;
        }

        if (!date) {
            setError("Please select a reservation date.");
            return;
        }

        if (!time) {
            setError("Please select a reservation time.");
            return;
        }

        if (!partySize || Number(partySize) < 1) {
            setError("Party size must be at least 1.");
            return;
        }

        try {
            setActionLoadingId("create-reservation");
            setError("");
            setSuccessMessage("");

            const data = await requestJson(`${API_BASE_URL}/reservations`, {
                method: "POST",
                body: JSON.stringify({
                    customerName: customerName.trim(),
                    customerPhone: customerPhone.trim(),
                    customerEmail: customerEmail.trim(),
                    tableId: Number(tableId),
                    reservationDate: date,
                    reservationTime: time,
                    partySize: Number(partySize),
                }),
            });

            setReservations((current) => [...current, data]);

            setReservationForm({
                customerName: "",
                customerPhone: "",
                customerEmail: "",
                tableId: "",
                date: getTodayLocalString(),
                time: "",
                partySize: 1,
            });

            setShowReservationForm(false);

            await Promise.all([loadReservations(), loadTables()]);

            setSuccessMessage(
                data?.reservationNumber
                    ? `${data.reservationNumber} created successfully.`
                    : "Reservation created successfully."
            );
        } catch (err) {
            console.error("Create reservation error:", err);
            setError(err.message || "Unable to create reservation.");
        } finally {
            setActionLoadingId(null);
        }
    };

    const openReservationForm = () => {
        setReservationForm({
            customerName: "",
            customerPhone: "",
            customerEmail: "",
            tableId: "",
            date: reservationDate || getTodayLocalString(),
            time: "",
            partySize: 1,
        });

        setError("");
        setShowReservationForm(true);
    };

    const parseLocalDate = (dateString) => {
        const [year, month, day] = String(dateString).substring(0, 10).split("-").map(Number);
        return new Date(year, month - 1, day);
    };

    const toLocalDateString = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const addDays = (dateString, amount) => {
        const date = parseLocalDate(dateString);
        date.setDate(date.getDate() + amount);
        return toLocalDateString(date);
    };

    const getStartOfWeek = (dateString) => {
        const date = parseLocalDate(dateString);
        const day = date.getDay();
        const difference = day === 0 ? -6 : 1 - day;
        date.setDate(date.getDate() + difference);
        return toLocalDateString(date);
    };

    const getEndOfWeek = (dateString) => addDays(getStartOfWeek(dateString), 6);

    const getReservationDate = (reservation) => {
        return String(reservation?.reservationDate ?? reservation?.date ?? "").substring(0, 10);
    };

    const reservationsForSelectedView = useMemo(() => {
        if (reservationView === "DAY") {
            return reservations.filter((reservation) => getReservationDate(reservation) === reservationDate);
        }

        if (reservationView === "WEEK") {
            const start = getStartOfWeek(reservationDate);
            const end = getEndOfWeek(reservationDate);

            return reservations.filter((reservation) => {
                const date = getReservationDate(reservation);
                return date >= start && date <= end;
            });
        }

        const selected = parseLocalDate(reservationDate);
        const year = selected.getFullYear();
        const month = selected.getMonth();

        return reservations.filter((reservation) => {
            const date = getReservationDate(reservation);
            if (!date) return false;
            const reservationDateObject = parseLocalDate(date);
            return reservationDateObject.getFullYear() === year && reservationDateObject.getMonth() === month;
        });
    }, [reservations, reservationView, reservationDate]);

    const filteredReservations = useMemo(() => {
        const search = searchTerm.trim().toLowerCase();

        return reservationsForSelectedView
            .filter((reservation) => {
                const matchesSearch =
                    !search ||
                    String(reservation?.reservationNumber || "").toLowerCase().includes(search) ||
                    String(reservation?.customerName || "").toLowerCase().includes(search) ||
                    String(reservation?.customerPhone || "").toLowerCase().includes(search) ||
                    String(reservation?.tableNumber || "").toLowerCase().includes(search);

                const matchesStatus = reservationFilter === "ALL" || reservation?.status === reservationFilter;

                return matchesSearch && matchesStatus;
            })
            .sort(
                (a, b) =>
                    String(a?.reservationDate || "").localeCompare(String(b?.reservationDate || "")) ||
                    String(a?.reservationTime || "").localeCompare(String(b?.reservationTime || ""))
            );
    }, [reservationsForSelectedView, searchTerm, reservationFilter]);

    const weekDays = useMemo(() => {
        const start = parseLocalDate(getStartOfWeek(reservationDate));

        return Array.from({ length: 7 }, (_, index) => {
            const date = new Date(start);
            date.setDate(start.getDate() + index);
            const dateString = toLocalDateString(date);

            const count = reservations.filter(
                (reservation) => getReservationDate(reservation) === dateString
            ).length;

            return {
                date: dateString,
                label: date.toLocaleDateString("en-IN", { weekday: "short" }),
                number: date.getDate(),
                count,
            };
        });
    }, [reservationDate, reservations]);

    const monthDays = useMemo(() => {
        const selected = parseLocalDate(reservationDate);
        const year = selected.getFullYear();
        const month = selected.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
        const totalDays = lastDay.getDate();

        const cells = [];

        for (let i = 0; i < startOffset; i++) {
            cells.push(null);
        }

        for (let day = 1; day <= totalDays; day++) {
            const date = new Date(year, month, day);
            const dateString = toLocalDateString(date);

            const dayReservations = reservations.filter(
                (reservation) => getReservationDate(reservation) === dateString
            );

            cells.push({
                date: dateString,
                number: day,
                count: dayReservations.length,
                pending: dayReservations.filter((item) => item.status === "PENDING").length,
                confirmed: dayReservations.filter((item) => item.status === "CONFIRMED").length,
                seated: dayReservations.filter((item) => item.status === "SEATED").length,
            });
        }

        return cells;
    }, [reservationDate, reservations]);

    const moveReservationPeriod = (direction) => {
        if (reservationView === "DAY") {
            setReservationDate(addDays(reservationDate, direction));
            return;
        }

        if (reservationView === "WEEK") {
            setReservationDate(addDays(reservationDate, direction * 7));
            return;
        }

        const current = parseLocalDate(reservationDate);
        current.setMonth(current.getMonth() + direction);
        setReservationDate(toLocalDateString(current));
    };

    const goToToday = () => {
        setReservationDate(getTodayLocalString());
    };

    const moveBillingPeriod = (direction) => {
        if (billingView === "DAY") {
            setBillingDate(addDays(billingDate, direction));
            return;
        }

        if (billingView === "WEEK") {
            setBillingDate(addDays(billingDate, direction * 7));
            return;
        }

        const current = parseLocalDate(billingDate);
        current.setMonth(current.getMonth() + direction);
        setBillingDate(toLocalDateString(current));
    };

    const goToBillingToday = () => {
        setBillingDate(getTodayLocalString());
    };

    const billingPeriodTitle = useMemo(() => {
        if (billingView === "DAY") {
            return formatReservationDate(billingDate);
        }

        if (billingView === "WEEK") {
            return `${formatReservationDate(getStartOfWeek(billingDate))} – ${formatReservationDate(
                getEndOfWeek(billingDate)
            )}`;
        }

        const date = parseLocalDate(billingDate);
        return date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
    }, [billingDate, billingView]);

    const changeTableStatus = async (table, newStatus) => {
        const tableId = getTableId(table);

        if (!tableId) {
            setError("Table ID is missing.");
            return;
        }

        if (table?.status === newStatus) return;

        try {
            setActionLoadingId(`table-${tableId}`);
            setError("");
            setSuccessMessage("");

            const updated = await requestJson(
                `${API_BASE_URL}/reception/tables/${tableId}/status?status=${newStatus}`,
                { method: "PATCH" }
            );

            setTables((current) =>
                current.map((item) => (getTableId(item) === tableId ? updated : item))
            );

            await loadReservations();

            setSuccessMessage(`${table?.tableNumber || "Table"} changed to ${newStatus}.`);
        } catch (err) {
            console.error("Table status error:", err);
            setError(err.message || "Unable to update table status.");
        } finally {
            setActionLoadingId(null);
        }
    };

    const viewBill = async (billId) => {
        if (!billId) return;

        try {
            setBillLoading(true);
            setError("");

            const data = await requestJson(`${API_BASE_URL}/cashier/bills/${billId}`);

            setSelectedBill(data);
        } catch (err) {
            console.error("View bill error:", err);
            setError(err.message || "Unable to load bill.");
        } finally {
            setBillLoading(false);
        }
    };

    const generateBill = async (order) => {
        const orderId = getOrderId(order);

        if (!orderId) {
            setError("Order ID is missing.");
            return;
        }

        try {
            setActionLoadingId(`bill-${orderId}`);
            setError("");
            setSuccessMessage("");

            const existingBill = findExistingBill(order, bills);

            if (existingBill) {
                setSelectedBill(existingBill);
                setActiveMainTab("BILLING");
                return;
            }

            const data = await requestJson(`${API_BASE_URL}/cashier/bills/order/${orderId}`, {
                method: "POST",
            });

            setSelectedBill(data);

            await Promise.all([loadServedOrders(), loadBills()]);

            setSuccessMessage(
                data?.billNumber ? `${data.billNumber} generated successfully.` : "Bill generated successfully."
            );
        } catch (err) {
            if (String(err.message || "").toLowerCase().includes("bill already exists")) {
                try {
                    const refreshedBills = await requestJson(`${API_BASE_URL}/bills`);
                    const existing = findExistingBill(order, refreshedBills);

                    setBills(Array.isArray(refreshedBills) ? refreshedBills : []);

                    if (existing) {
                        setSelectedBill(existing);
                        setActiveMainTab("BILLING");
                        return;
                    }
                } catch (loadError) {
                    console.error(loadError);
                }
            }

            console.error("Generate bill error:", err);
            setError(err.message || "Unable to generate bill.");
        } finally {
            setActionLoadingId(null);
        }
    };

    const printBill = async (bill) => {
        const billId = bill?.id;
        if (!billId) return;

        try {
            setActionLoadingId(`print-${billId}`);
            setError("");

            const response = await fetch(`${API_BASE_URL}/cashier/bills/${billId}/print`, {
                method: "GET",
                headers: getHeaders(),
            });

            const text = await response.text();

            if (!response.ok) {
                throw new Error(text || "Unable to print bill.");
            }

            const escaped = String(text)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;")
                .replace(/\n/g, "<br>");

            const printWindow = window.open("", "_blank", "width=500,height=700");

            if (!printWindow) {
                throw new Error("Popup blocked. Please allow popups to print the bill.");
            }

            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                    <head>
                        <title>Print Bill</title>
                        <style>
                            body { font-family: Arial, sans-serif; padding: 30px; color: #241812; }
                            .receipt { max-width: 420px; margin: 0 auto; }
                            h1 { text-align: center; margin-bottom: 25px; }
                            .receipt-body { font-size: 14px; line-height: 1.5; }
                        </style>
                    </head>
                    <body>
                        <div class="receipt">
                            <h1>THE LOOKOUT</h1>
                            <div class="receipt-body">${escaped}</div>
                        </div>
                    </body>
                </html>
            `);

            printWindow.document.close();
            printWindow.focus();

            setTimeout(() => {
                printWindow.print();
            }, 250);

            const marked = await requestJson(`${API_BASE_URL}/cashier/bills/${billId}/printed`, {
                method: "PATCH",
            });

            setSelectedBill(marked);

            await loadBills();

            setSuccessMessage("Bill sent to printer.");
        } catch (err) {
            console.error("Print bill error:", err);
            setError(err.message || "Unable to print bill.");
        } finally {
            setActionLoadingId(null);
        }
    };

    const markPaid = async (bill) => {
        const billId = bill?.id;
        if (!billId) return;

        try {
            setActionLoadingId(`paid-${billId}`);
            setError("");
            setSuccessMessage("");

            const data = await requestJson(`${API_BASE_URL}/cashier/bills/${billId}/paid`, {
                method: "PATCH",
            });

            setSelectedBill(data);

            await Promise.all([loadServedOrders(), loadBills(), loadTables(), loadAllOrders()]);

            setSuccessMessage(data?.billNumber ? `${data.billNumber} marked as paid.` : "Bill marked as paid.");
        } catch (err) {
            console.error("Paid error:", err);
            setError(err.message || "Unable to mark bill as paid.");
        } finally {
            setActionLoadingId(null);
        }
    };

    const filteredTables = useMemo(() => {
        const search = searchTerm.trim().toLowerCase();

        return tables.filter((table) => {
            const matchesSearch =
                !search ||
                String(table?.tableNumber || "").toLowerCase().includes(search) ||
                String(table?.location || "").toLowerCase().includes(search);

            const matchesStatus = tableFilter === "ALL" || table?.status === tableFilter;

            return matchesSearch && matchesStatus;
        });
    }, [tables, searchTerm, tableFilter]);

    const filteredOrders = useMemo(() => {
        const search = searchTerm.trim().toLowerCase();

        return allOrders.filter((order) => {
            const matchesSearch =
                !search ||
                String(order?.orderNumber || "").toLowerCase().includes(search) ||
                String(order?.tableNumber || "").toLowerCase().includes(search) ||
                String(order?.waiterName || "").toLowerCase().includes(search);

            const matchesStatus = orderFilter === "ALL" || order?.status === orderFilter;

            return matchesSearch && matchesStatus;
        });
    }, [allOrders, searchTerm, orderFilter]);

    const logout = () => {
        localStorage.removeItem("cashierToken");
        localStorage.removeItem("cashierEmployeeId");
        localStorage.removeItem("cashierFullName");
        localStorage.removeItem("receptionToken");
        localStorage.removeItem("token");
        localStorage.removeItem("employeeId");
        localStorage.removeItem("fullName");
        localStorage.removeItem("role");

        window.location.href = "/login";
    };

    const pendingReservations = reservations.filter((item) => item?.status === "PENDING").length;
    const confirmedReservations = reservations.filter((item) => item?.status === "CONFIRMED").length;
    const seatedReservations = reservations.filter((item) => item?.status === "SEATED").length;
    const reservedTables = tables.filter((table) => table?.status === "RESERVED").length;
    const occupiedTables = tables.filter((table) => table?.status === "OCCUPIED").length;
    const availableTables = tables.filter((table) => table?.status === "AVAILABLE").length;
    const paidBills = bills.filter((bill) => bill?.status === "PAID");

    const reservationPeriodTitle = useMemo(() => {
        if (reservationView === "DAY") {
            return formatReservationDate(reservationDate);
        }

        if (reservationView === "WEEK") {
            return `${formatReservationDate(getStartOfWeek(reservationDate))} – ${formatReservationDate(
                getEndOfWeek(reservationDate)
            )}`;
        }

        const date = parseLocalDate(reservationDate);
        return date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
    }, [reservationDate, reservationView]);

    const getStatusClass = (status) => String(status || "").toLowerCase();
    const getTableStatusClass = (status) => String(status || "").toLowerCase();
    const getBillStatusClass = (status) => String(status || "").toLowerCase();
    const getOrderStatusClass = (status) => String(status || "").toLowerCase();

    if (loading) {
        return (
            <div className="cashier-page">
                <div className="cashier-state">
                    <div className="cashier-spinner" />
                    <strong>Loading Reception & Cashier</strong>
                    <p>Preparing front desk operations...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="cashier-page">

            <header className="cashier-header">
                <div className="cashier-header-left">
                    <div className="cashier-eyebrow">FRONT DESK OPERATIONS</div>
                    <h1>Reception &amp; Cashier</h1>
                    <p>Manage reservations, tables, orders and billing from one operational desk.</p>
                </div>

                <div className="cashier-header-right">
                    <div className="cashier-live-badge">
                        <span className="cashier-live-dot" />
                        Live Operations
                    </div>

                    <button
                        type="button"
                        className="cashier-refresh-button"
                        onClick={() => loadDashboard(false)}
                        disabled={refreshing}
                    >
                        {refreshing ? "Refreshing..." : "Refresh"}
                    </button>

                    <button type="button" className="cashier-logout-button" onClick={logout}>
                        Logout
                    </button>
                </div>
            </header>

            {successMessage && (
                <div className="cashier-alert cashier-success">
                    <span className="cashier-alert-icon">✓</span>
                    <span>{successMessage}</span>
                </div>
            )}

            {error && (
                <div className="cashier-alert cashier-error">
                    <span className="cashier-alert-icon">!</span>
                    <span>{error}</span>
                    <button type="button" onClick={() => setError("")}>Dismiss</button>
                </div>
            )}

            <section className="cashier-summary">
                <div className="cashier-summary-card">
                    <span>Pending Reservations</span>
                    <strong>{pendingReservations}</strong>
                    <small>Awaiting confirmation</small>
                </div>

                <div className="cashier-summary-card">
                    <span>Confirmed Reservations</span>
                    <strong>{confirmedReservations}</strong>
                    <small>Ready for guest arrival</small>
                </div>

                <div className="cashier-summary-card">
                    <span>Seated Guests</span>
                    <strong>{seatedReservations}</strong>
                    <small>Currently seated</small>
                </div>

                <div className="cashier-summary-card cashier-summary-highlight">
                    <span>Available Tables</span>
                    <strong>{availableTables}</strong>
                    <small>Ready for seating</small>
                </div>
            </section>

            <nav className="cashier-main-tabs">
                {MAIN_TABS.map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        className={
                            activeMainTab === tab.key
                                ? "cashier-main-tab cashier-main-tab-active"
                                : "cashier-main-tab"
                        }
                        onClick={() => setActiveMainTab(tab.key)}
                    >
                        {tab.label}

                        {tab.key === "BILLING" &&
                            bills.filter((bill) => bill?.status !== "PAID").length > 0 && (
                                <span
                                    style={{
                                        marginLeft: "7px",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        minWidth: "18px",
                                        height: "18px",
                                        padding: "0 5px",
                                        borderRadius: "999px",
                                        background: "#81502f",
                                        color: "white",
                                        fontSize: "8px",
                                    }}
                                >
                                    {bills.filter((bill) => bill?.status !== "PAID").length}
                                </span>
                            )}
                    </button>
                ))}
            </nav>

            {activeMainTab === "RECEPTION" && (
                <>
                    <nav className="cashier-sub-tabs">
                        {RECEPTION_TABS.map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                className={
                                    activeReceptionTab === tab.key
                                        ? "cashier-sub-tab cashier-sub-tab-active"
                                        : "cashier-sub-tab"
                                }
                                onClick={() => setActiveReceptionTab(tab.key)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>

                    {activeReceptionTab === "RESERVATIONS" && (
                        <section className="cashier-section">
                            <div className="cashier-section-header">
                                <div>
                                    <h2>Reservations</h2>
                                    <p>Manage bookings, confirmation, seating and completion.</p>
                                </div>

                                <button
                                    type="button"
                                    className="cashier-refresh-button"
                                    onClick={openReservationForm}
                                >
                                    + Reserve Table
                                </button>
                            </div>

                            <div className="cashier-reservation-toolbar">
                                <div className="cashier-reservation-view-switch">
                                    {["DAY", "WEEK", "MONTH"].map((view) => (
                                        <button
                                            key={view}
                                            type="button"
                                            className={
                                                reservationView === view
                                                    ? "cashier-reservation-view-button cashier-reservation-view-button-active"
                                                    : "cashier-reservation-view-button"
                                            }
                                            onClick={() => setReservationView(view)}
                                        >
                                            {view}
                                        </button>
                                    ))}
                                </div>

                                <div className="cashier-reservation-period-title">
                                    {reservationPeriodTitle}
                                </div>
                            </div>

                            <div className="cashier-reservation-date-navigation">
                                <button
                                    type="button"
                                    className="cashier-date-nav-button"
                                    onClick={() => moveReservationPeriod(-1)}
                                    aria-label="Previous"
                                >
                                    ←
                                </button>

                                <div className="cashier-current-period">{reservationPeriodTitle}</div>

                                <button type="button" className="cashier-today-button" onClick={goToToday}>
                                    Today
                                </button>

                                <button
                                    type="button"
                                    className="cashier-date-nav-button"
                                    onClick={() => moveReservationPeriod(1)}
                                    aria-label="Next"
                                >
                                    →
                                </button>
                            </div>

                            {reservationView === "WEEK" && (
                                <div className="cashier-week-strip">
                                    {weekDays.map((day) => (
                                        <button
                                            key={day.date}
                                            type="button"
                                            className={
                                                day.date === reservationDate
                                                    ? "cashier-week-day active"
                                                    : "cashier-week-day"
                                            }
                                            onClick={() => {
                                                setReservationDate(day.date);
                                                setReservationView("DAY");
                                            }}
                                        >
                                            <div className="cashier-week-day-label">{day.label}</div>
                                            <div className="cashier-week-day-number">{day.number}</div>
                                            <div className="cashier-week-day-count">
                                                {day.count} {day.count === 1 ? "booking" : "bookings"}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {reservationView === "MONTH" && (
                                <div className="cashier-month-calendar">
                                    <div className="cashier-month-weekdays">
                                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                                            <div key={day} className="cashier-month-weekday">
                                                {day}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="cashier-month-grid">
                                        {monthDays.map((day, index) => {
                                            if (!day) {
                                                return <div key={`empty-${index}`} className="cashier-month-empty" />;
                                            }

                                            return (
                                                <button
                                                    key={day.date}
                                                    type="button"
                                                    className={
                                                        day.date === reservationDate
                                                            ? "cashier-month-day selected"
                                                            : "cashier-month-day"
                                                    }
                                                    onClick={() => {
                                                        setReservationDate(day.date);
                                                        setReservationView("DAY");
                                                    }}
                                                >
                                                    <span className="cashier-month-number">{day.number}</span>

                                                    {day.count > 0 && (
                                                        <>
                                                            <div className="cashier-month-booking-count">
                                                                {day.count} {day.count === 1 ? "booking" : "bookings"}
                                                            </div>

                                                            <div className="cashier-month-dots">
                                                                {day.pending > 0 && (
                                                                    <span className="cashier-calendar-dot pending" />
                                                                )}
                                                                {day.confirmed > 0 && (
                                                                    <span className="cashier-calendar-dot confirmed" />
                                                                )}
                                                                {day.seated > 0 && (
                                                                    <span className="cashier-calendar-dot seated" />
                                                                )}
                                                            </div>
                                                        </>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="cashier-history-tools">
                                <div className="cashier-search-box">
                                    <span>🔎</span>
                                    <input
                                        type="text"
                                        placeholder="Search guest, phone, reservation or table..."
                                        value={searchTerm}
                                        onChange={(event) => setSearchTerm(event.target.value)}
                                    />
                                </div>

                                <select
                                    className="cashier-history-filter"
                                    value={reservationFilter}
                                    onChange={(event) => setReservationFilter(event.target.value)}
                                >
                                    <option value="ALL">All Statuses</option>
                                    <option value="PENDING">Pending</option>
                                    <option value="CONFIRMED">Confirmed</option>
                                    <option value="SEATED">Seated</option>
                                    <option value="COMPLETED">Completed</option>
                                    <option value="CANCELLED">Cancelled</option>
                                </select>
                            </div>

                            <div className="cashier-reservation-count">
                                Showing <strong>{filteredReservations.length}</strong>{" "}
                                {filteredReservations.length === 1 ? "reservation" : "reservations"}
                            </div>

                            {filteredReservations.length === 0 ? (
                                <div className="cashier-empty">
                                    <div className="cashier-empty-icon">◷</div>
                                    <h3>No reservations</h3>
                                    <p>There are no reservations matching this date and filter.</p>

                                    <button
                                        type="button"
                                        className="cashier-primary-small"
                                        style={{ marginTop: "15px" }}
                                        onClick={openReservationForm}
                                    >
                                        + Create Reservation
                                    </button>
                                </div>
                            ) : (
                                <div className="cashier-data-grid">
                                    {filteredReservations.map((reservation) => {
                                        const id = getReservationId(reservation);
                                        const status = reservation?.status || "UNKNOWN";
                                        const busy = actionLoadingId === `reservation-${id}`;

                                        return (
                                            <article
                                                key={id}
                                                className={`cashier-reservation-card ${getStatusClass(status)}`}
                                            >
                                                <div className="cashier-reservation-card-header">
                                                    <div>
                                                        <div className="cashier-reservation-number">
                                                            {reservation?.reservationNumber || `RES-${id}`}
                                                        </div>

                                                        <div className="cashier-reservation-customer">
                                                            {reservation?.customerName || "Guest"} ·{" "}
                                                            {reservation?.customerPhone || "Phone not provided"}
                                                        </div>

                                                        <div
                                                            className="cashier-reservation-email"
                                                            style={{
                                                                marginTop: "4px",
                                                                fontSize: "12px",
                                                                color: "#6f5a4d",
                                                                wordBreak: "break-word",
                                                            }}
                                                        >
                                                            {reservation?.customerEmail || "Email not provided"}
                                                        </div>
                                                    </div>

                                                    <span className={`cashier-status ${getStatusClass(status)}`}>
                                                        {getReservationStatusIcon(status)} {statusLabel(status)}
                                                    </span>
                                                </div>

                                                <div className="cashier-reservation-main">
                                                    <div className="cashier-reservation-info">
                                                        <span>Table</span>
                                                        <strong>{reservation?.tableNumber || "—"}</strong>
                                                    </div>

                                                    <div className="cashier-reservation-info">
                                                        <span>Party</span>
                                                        <strong>
                                                            {reservation?.partySize || "—"}{" "}
                                                            {Number(reservation?.partySize) === 1 ? "Guest" : "Guests"}
                                                        </strong>
                                                    </div>

                                                    <div className="cashier-reservation-info">
                                                        <span>Date</span>
                                                        <strong>
                                                            {formatReservationDate(getReservationDate(reservation))}
                                                        </strong>
                                                    </div>

                                                    <div className="cashier-reservation-info">
                                                        <span>Time</span>
                                                        <strong>
                                                            {formatTime(
                                                                reservation?.reservationTime || reservation?.time
                                                            )}
                                                        </strong>
                                                    </div>
                                                </div>

                                                <div className="cashier-reservation-actions">
                                                    {status === "PENDING" && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                disabled={busy}
                                                                className="cashier-reservation-confirm"
                                                                onClick={() =>
                                                                    changeReservationStatus(reservation, "CONFIRM")
                                                                }
                                                            >
                                                                {busy ? "Processing..." : "✓ Confirm"}
                                                            </button>

                                                            <button
                                                                type="button"
                                                                disabled={busy}
                                                                className="cashier-reservation-cancel"
                                                                onClick={() =>
                                                                    changeReservationStatus(reservation, "CANCEL")
                                                                }
                                                            >
                                                                Cancel
                                                            </button>
                                                        </>
                                                    )}

                                                    {status === "CONFIRMED" && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                disabled={busy}
                                                                className="cashier-reservation-seat"
                                                                onClick={() =>
                                                                    changeReservationStatus(reservation, "SEAT")
                                                                }
                                                            >
                                                                {busy ? "Processing..." : "● Seat Guest"}
                                                            </button>

                                                            <button
                                                                type="button"
                                                                disabled={busy}
                                                                className="cashier-reservation-cancel"
                                                                onClick={() =>
                                                                    changeReservationStatus(reservation, "CANCEL")
                                                                }
                                                            >
                                                                Cancel
                                                            </button>
                                                        </>
                                                    )}

                                                    {status === "SEATED" && (
                                                        <button
                                                            type="button"
                                                            disabled={busy}
                                                            className="cashier-reservation-complete"
                                                            onClick={() =>
                                                                changeReservationStatus(reservation, "COMPLETE")
                                                            }
                                                        >
                                                            {busy ? "Processing..." : "✓ Complete Reservation"}
                                                        </button>
                                                    )}

                                                    {status === "COMPLETED" && (
                                                        <span className="cashier-secondary-small">
                                                            ✓ Reservation completed
                                                        </span>
                                                    )}

                                                    {status === "CANCELLED" && (
                                                        <span className="cashier-secondary-small">
                                                            × Reservation cancelled
                                                        </span>
                                                    )}
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            )}
                        </section>
                    )}

                    {activeReceptionTab === "TABLES" && (
                        <section className="cashier-section">
                            <div className="cashier-section-header">
                                <div>
                                    <h2>Tables</h2>
                                    <p>Monitor table availability, reservations and current occupancy.</p>
                                </div>

                                <span className="cashier-count-badge">{filteredTables.length} tables</span>
                            </div>

                            <div className="cashier-table-summary">
                                <div>
                                    <span>Available</span>
                                    <strong>{availableTables}</strong>
                                </div>

                                <div>
                                    <span>Reserved</span>
                                    <strong>{reservedTables}</strong>
                                </div>

                                <div>
                                    <span>Occupied</span>
                                    <strong>{occupiedTables}</strong>
                                </div>
                            </div>

                            <div className="cashier-history-tools">
                                <div className="cashier-search-box">
                                    <span>🔎</span>
                                    <input
                                        type="text"
                                        placeholder="Search table or location..."
                                        value={searchTerm}
                                        onChange={(event) => setSearchTerm(event.target.value)}
                                    />
                                </div>

                                <select
                                    className="cashier-history-filter"
                                    value={tableFilter}
                                    onChange={(event) => setTableFilter(event.target.value)}
                                >
                                    <option value="ALL">All Tables</option>
                                    <option value="AVAILABLE">Available</option>
                                    <option value="RESERVED">Reserved</option>
                                    <option value="OCCUPIED">Occupied</option>
                                </select>
                            </div>

                            {filteredTables.length === 0 ? (
                                <div className="cashier-empty">
                                    <div className="cashier-empty-icon">▦</div>
                                    <h3>No tables found</h3>
                                    <p>No tables match the selected filter.</p>
                                </div>
                            ) : (
                                <div className="cashier-table-grid">
                                    {filteredTables.map((table) => {
                                        const tableId = getTableId(table);
                                        const busy = actionLoadingId === `table-${tableId}`;

                                        return (
                                            <div
                                                key={tableId}
                                                className={`cashier-table-card ${getTableStatusClass(table?.status)}`}
                                            >
                                                <div className="cashier-table-card-top">
                                                    <div className="cashier-big-table-number">
                                                        {table?.tableNumber || `Table ${tableId}`}
                                                    </div>

                                                    <span
                                                        className={`cashier-status ${getTableStatusClass(
                                                            table?.status
                                                        )}`}
                                                    >
                                                        {statusLabel(table?.status)}
                                                    </span>
                                                </div>

                                                <div className="cashier-table-info">
                                                    <div>
                                                        <span>Location</span>
                                                        <strong>{table?.location || "—"}</strong>
                                                    </div>

                                                    <div>
                                                        <span>Capacity</span>
                                                        <strong>{table?.capacity || "—"} guests</strong>
                                                    </div>
                                                </div>

                                                <div className="cashier-table-actions">
                                                    {table?.status === "AVAILABLE" && (
                                                        <button
                                                            type="button"
                                                            className="cashier-secondary-small"
                                                            disabled={busy}
                                                            onClick={() => changeTableStatus(table, "RESERVED")}
                                                        >
                                                            Mark Reserved
                                                        </button>
                                                    )}

                                                    {(table?.status === "RESERVED" || table?.status === "OCCUPIED") && (
                                                        <button
                                                            type="button"
                                                            className="cashier-secondary-small"
                                                            disabled={busy}
                                                            onClick={() => changeTableStatus(table, "AVAILABLE")}
                                                        >
                                                            Mark Available
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </section>
                    )}

                    {activeReceptionTab === "ORDERS" && (
                        <section className="cashier-section">
                            <div className="cashier-section-header">
                                <div>
                                    <h2>Orders</h2>
                                    <p>Monitor restaurant orders, tables and waiter assignment.</p>
                                </div>

                                <span className="cashier-count-badge">{filteredOrders.length} orders</span>
                            </div>

                            <div className="cashier-history-tools">
                                <div className="cashier-search-box">
                                    <span>🔎</span>
                                    <input
                                        type="text"
                                        placeholder="Search order, table or waiter..."
                                        value={searchTerm}
                                        onChange={(event) => setSearchTerm(event.target.value)}
                                    />
                                </div>

                                <select
                                    className="cashier-history-filter"
                                    value={orderFilter}
                                    onChange={(event) => setOrderFilter(event.target.value)}
                                >
                                    <option value="ALL">All Orders</option>
                                    <option value="PLACED">Placed</option>
                                    <option value="CONFIRMED">Confirmed</option>
                                    <option value="PREPARING">Preparing</option>
                                    <option value="READY">Ready</option>
                                    <option value="SERVED">Served</option>
                                </select>
                            </div>

                            {filteredOrders.length === 0 ? (
                                <div className="cashier-empty">
                                    <div className="cashier-empty-icon">#</div>
                                    <h3>No orders found</h3>
                                    <p>No orders match the selected filter.</p>
                                </div>
                            ) : (
                                <div className="cashier-order-grid">
                                    {filteredOrders.map((order) => {
                                        const orderId = getOrderId(order);
                                        const existingBill = findExistingBill(order, bills);

                                        return (
                                            <div key={orderId} className="cashier-order-card">
                                                <div className="cashier-order-card-header">
                                                    <div>
                                                        <div className="cashier-order-number">
                                                            {order?.orderNumber || `ORDER-${orderId}`}
                                                        </div>
                                                    </div>

                                                    <span
                                                        className={`cashier-status ${getOrderStatusClass(
                                                            order?.status
                                                        )}`}
                                                    >
                                                        {statusLabel(order?.status)}
                                                    </span>
                                                </div>

                                                <div className="cashier-order-info-grid">
                                                    <div className="cashier-order-info">
                                                        <span>Table</span>
                                                        <strong>{order?.tableNumber || "—"}</strong>
                                                    </div>

                                                    <div className="cashier-order-info">
                                                        <span>Waiter</span>
                                                        <strong>{order?.waiterName || "Not assigned"}</strong>
                                                    </div>

                                                    <div className="cashier-order-info">
                                                        <span>Items</span>
                                                        <strong>{getItemCount(order)}</strong>
                                                    </div>
                                                </div>

                                                {order?.status === "SERVED" && (
                                                    <div className="cashier-order-actions">
                                                        <button
                                                            type="button"
                                                            className="cashier-primary-button"
                                                            onClick={() => {
                                                                if (existingBill) {
                                                                    setSelectedBill(existingBill);
                                                                    setActiveMainTab("BILLING");
                                                                } else {
                                                                    generateBill(order);
                                                                }
                                                            }}
                                                        >
                                                            {existingBill ? "View Bill" : "Generate Bill"}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </section>
                    )}
                </>
            )}

            {activeMainTab === "BILLING" && (
                <section className="cashier-section">
                    <div className="cashier-section-header">
                        <div>
                            <h2>Billing</h2>
                            <p>Generate, print and complete customer bills.</p>
                        </div>

                        <span className="cashier-count-badge">
                            {bills.filter((bill) => bill?.status !== "PAID").length} open bills
                        </span>
                    </div>

                    <nav className="cashier-sub-tabs">
                        {BILLING_TABS.map((tab) => (
                            <button
                                key={tab.key}
                                type="button"
                                className={
                                    activeBillingTab === tab.key
                                        ? "cashier-sub-tab cashier-sub-tab-active"
                                        : "cashier-sub-tab"
                                }
                                onClick={() => setActiveBillingTab(tab.key)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>

                    <div className="cashier-data-grid">
                        {bills.length === 0 ? (
                            <div className="cashier-empty">
                                <div className="cashier-empty-icon">₹</div>
                                <h3>No bills yet</h3>
                                <p>Served orders will appear here when they are ready for billing.</p>
                            </div>
                        ) : (
                            bills.map((bill) => (
                                <div key={bill?.id} className="cashier-data-card">
                                    <div className="cashier-data-card-top">
                                        <div>
                                            <div className="cashier-card-number">
                                                {bill?.billNumber || `BILL-${bill?.id}`}
                                            </div>
                                            <div className="cashier-card-muted">
                                                Orders: {getBillOrdersText(bill)}
                                            </div>
                                        </div>

                                        <span className={`cashier-status ${getBillStatusClass(bill?.status)}`}>
                                            {statusLabel(bill?.status)}
                                        </span>
                                    </div>

                                    <div
                                        className="cashier-order-total"
                                        style={{ padding: 0, border: "none", background: "transparent", marginBottom: "14px" }}
                                    >
                                        <strong style={{ fontSize: "20px" }}>
                                            {formatMoney(bill?.totalAmount)}
                                        </strong>
                                    </div>

                                    <button
                                        type="button"
                                        className="cashier-primary-button"
                                        onClick={() => viewBill(bill?.id)}
                                    >
                                        {billLoading ? "Loading..." : "View Bill"}
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            )}

            {activeMainTab === "HISTORY" && (
                <section className="cashier-section">
                    <div className="cashier-section-header">
                        <div>
                            <h2>Payment History</h2>
                            <p>View completed restaurant payments.</p>
                        </div>

                        <span className="cashier-count-badge">{paidBills.length} paid bills</span>
                    </div>

                    <div className="cashier-reservation-toolbar">
                        <div className="cashier-reservation-view-switch">
                            {["DAY", "WEEK", "MONTH"].map((view) => (
                                <button
                                    key={view}
                                    type="button"
                                    className={
                                        billingView === view
                                            ? "cashier-reservation-view-button cashier-reservation-view-button-active"
                                            : "cashier-reservation-view-button"
                                    }
                                    onClick={() => setBillingView(view)}
                                >
                                    {view}
                                </button>
                            ))}
                        </div>

                        <div className="cashier-reservation-period-title">{billingPeriodTitle}</div>
                    </div>

                    <div className="cashier-reservation-date-navigation">
                        <button
                            type="button"
                            className="cashier-date-nav-button"
                            onClick={() => moveBillingPeriod(-1)}
                            aria-label="Previous"
                        >
                            ←
                        </button>

                        <div className="cashier-current-period">{billingPeriodTitle}</div>

                        <button type="button" className="cashier-today-button" onClick={goToBillingToday}>
                            Today
                        </button>

                        <button
                            type="button"
                            className="cashier-date-nav-button"
                            onClick={() => moveBillingPeriod(1)}
                            aria-label="Next"
                        >
                            →
                        </button>
                    </div>

                    {paidBills.length === 0 ? (
                        <div className="cashier-empty">
                            <div className="cashier-empty-icon">✓</div>
                            <h3>No payment history</h3>
                            <p>Completed customer payments will appear here.</p>
                        </div>
                    ) : (
                        <div className="cashier-data-grid">
                            {paidBills.map((bill) => (
                                <div key={bill?.id} className="cashier-data-card">
                                    <div>
                                        <strong>{bill?.billNumber || `BILL-${bill?.id}`}</strong>
                                        <p>{bill?.orderNumber || "Order"}</p>
                                    </div>

                                    <strong style={{ fontSize: "18px", color: "#3e2a20" }}>
                                        {formatMoney(bill?.totalAmount)}
                                    </strong>

                                    <button
                                        type="button"
                                        className="cashier-secondary-button"
                                        onClick={() => viewBill(bill?.id)}
                                    >
                                        View Bill
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {showReservationForm && (
                <div
                    className="cashier-modal-overlay"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setShowReservationForm(false);
                        }
                    }}
                >
                    <div className="cashier-modal">
                        <div className="cashier-modal-header">
                            <div>
                                <div className="cashier-modal-eyebrow">New Reservation</div>
                                <h2>Reserve a Table</h2>
                                <p>
                                    New reservations begin as <strong>PENDING</strong> and can then be confirmed.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="cashier-modal-close"
                                onClick={() => setShowReservationForm(false)}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={createReservation}>
                            <div className="cashier-modal-items">
                                <div
                                    className="cashier-form-grid"
                                    style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "13px" }}
                                >
                                    <div className="cashier-form-field">
                                        <label
                                            style={{
                                                display: "block",
                                                marginBottom: "6px",
                                                color: "#8b7569",
                                                fontSize: "9px",
                                                fontWeight: 900,
                                                textTransform: "uppercase",
                                                letterSpacing: "0.8px",
                                            }}
                                        >
                                            Guest Name
                                        </label>

                                        <input
                                            type="text"
                                            placeholder="Enter guest name"
                                            style={{
                                                width: "100%",
                                                height: "43px",
                                                padding: "0 12px",
                                                border: "1px solid #c3ad9e",
                                                borderRadius: "9px",
                                                background: "#f7f0ea",
                                                color: "#33241b",
                                            }}
                                            value={reservationForm.customerName}
                                            onChange={(event) =>
                                                setReservationForm((current) => ({
                                                    ...current,
                                                    customerName: event.target.value,
                                                }))
                                            }
                                            required
                                        />
                                    </div>

                                    <div className="cashier-form-field">
                                        <label
                                            style={{
                                                display: "block",
                                                marginBottom: "6px",
                                                color: "#8b7569",
                                                fontSize: "9px",
                                                fontWeight: 900,
                                                textTransform: "uppercase",
                                                letterSpacing: "0.8px",
                                            }}
                                        >
                                            Phone
                                        </label>

                                        <input
                                            type="tel"
                                            placeholder="Enter phone number"
                                            style={{
                                                width: "100%",
                                                height: "43px",
                                                padding: "0 12px",
                                                border: "1px solid #c3ad9e",
                                                borderRadius: "9px",
                                                background: "#f7f0ea",
                                                color: "#33241b",
                                            }}
                                            value={reservationForm.customerPhone}
                                            onChange={(event) =>
                                                setReservationForm((current) => ({
                                                    ...current,
                                                    customerPhone: event.target.value,
                                                }))
                                            }
                                            required
                                        />
                                    </div>

                                    <div className="cashier-form-field">
                                        <label
                                            style={{
                                                display: "block",
                                                marginBottom: "6px",
                                                color: "#8b7569",
                                                fontSize: "9px",
                                                fontWeight: 900,
                                                textTransform: "uppercase",
                                                letterSpacing: "0.8px",
                                            }}
                                        >
                                            Email
                                        </label>

                                        <input
                                            type="email"
                                            placeholder="Enter email address"
                                            style={{
                                                width: "100%",
                                                height: "43px",
                                                padding: "0 12px",
                                                border: "1px solid #c3ad9e",
                                                borderRadius: "9px",
                                                background: "#f7f0ea",
                                                color: "#33241b",
                                            }}
                                            value={reservationForm.customerEmail}
                                            onChange={(event) =>
                                                setReservationForm((current) => ({
                                                    ...current,
                                                    customerEmail: event.target.value,
                                                }))
                                            }
                                            required
                                        />
                                    </div>

                                    <div className="cashier-form-field">
                                        <label
                                            style={{
                                                display: "block",
                                                marginBottom: "6px",
                                                color: "#8b7569",
                                                fontSize: "9px",
                                                fontWeight: 900,
                                                textTransform: "uppercase",
                                                letterSpacing: "0.8px",
                                            }}
                                        >
                                            Party Size
                                        </label>

                                        <input
                                            type="number"
                                            min="1"
                                            style={{
                                                width: "100%",
                                                height: "43px",
                                                padding: "0 12px",
                                                border: "1px solid #c3ad9e",
                                                borderRadius: "9px",
                                                background: "#f7f0ea",
                                                color: "#33241b",
                                            }}
                                            value={reservationForm.partySize}
                                            onChange={(event) =>
                                                setReservationForm((current) => ({
                                                    ...current,
                                                    partySize: event.target.value,
                                                    tableId: "",
                                                }))
                                            }
                                            required
                                        />
                                    </div>

                                    <div className="cashier-form-field">
                                        <label
                                            style={{
                                                display: "block",
                                                marginBottom: "6px",
                                                color: "#8b7569",
                                                fontSize: "9px",
                                                fontWeight: 900,
                                                textTransform: "uppercase",
                                                letterSpacing: "0.8px",
                                            }}
                                        >
                                            Table
                                        </label>

                                        <select
                                            style={{
                                                width: "100%",
                                                height: "43px",
                                                padding: "0 12px",
                                                border: "1px solid #c3ad9e",
                                                borderRadius: "9px",
                                                background: "#f7f0ea",
                                                color: "#33241b",
                                            }}
                                            value={reservationForm.tableId}
                                            onChange={(event) =>
                                                setReservationForm((current) => ({
                                                    ...current,
                                                    tableId: event.target.value,
                                                }))
                                            }
                                            required
                                        >
                                            <option value="">Select Table</option>

                                            {tables
                                                .filter(
                                                    (table) =>
                                                        table?.status === "AVAILABLE" || table?.status === "RESERVED"
                                                )
                                                .filter(
                                                    (table) =>
                                                        !reservationForm.partySize ||
                                                        !table?.capacity ||
                                                        Number(table.capacity) >= Number(reservationForm.partySize)
                                                )
                                                .map((table) => (
                                                    <option key={getTableId(table)} value={getTableId(table)}>
                                                        {table?.tableNumber} — Capacity {table?.capacity} —{" "}
                                                        {table?.status}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>

                                    <div className="cashier-form-field">
                                        <label
                                            style={{
                                                display: "block",
                                                marginBottom: "6px",
                                                color: "#8b7569",
                                                fontSize: "9px",
                                                fontWeight: 900,
                                                textTransform: "uppercase",
                                                letterSpacing: "0.8px",
                                            }}
                                        >
                                            Reservation Date
                                        </label>

                                        <input
                                            type="date"
                                            style={{
                                                width: "100%",
                                                height: "43px",
                                                padding: "0 12px",
                                                border: "1px solid #c3ad9e",
                                                borderRadius: "9px",
                                                background: "#f7f0ea",
                                                color: "#33241b",
                                            }}
                                            value={reservationForm.date}
                                            min={getTodayLocalString()}
                                            onChange={(event) =>
                                                setReservationForm((current) => ({
                                                    ...current,
                                                    date: event.target.value,
                                                }))
                                            }
                                            required
                                        />
                                    </div>

                                    <div className="cashier-form-field">
                                        <label
                                            style={{
                                                display: "block",
                                                marginBottom: "6px",
                                                color: "#8b7569",
                                                fontSize: "9px",
                                                fontWeight: 900,
                                                textTransform: "uppercase",
                                                letterSpacing: "0.8px",
                                            }}
                                        >
                                            Reservation Time
                                        </label>

                                        <input
                                            type="time"
                                            style={{
                                                width: "100%",
                                                height: "43px",
                                                padding: "0 12px",
                                                border: "1px solid #c3ad9e",
                                                borderRadius: "9px",
                                                background: "#f7f0ea",
                                                color: "#33241b",
                                            }}
                                            value={reservationForm.time}
                                            onChange={(event) =>
                                                setReservationForm((current) => ({
                                                    ...current,
                                                    time: event.target.value,
                                                }))
                                            }
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="cashier-modal-actions">
                                <button
                                    type="button"
                                    className="cashier-secondary-button"
                                    onClick={() => setShowReservationForm(false)}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="cashier-primary-button"
                                    style={{ width: "auto" }}
                                    disabled={actionLoadingId === "create-reservation"}
                                >
                                    {actionLoadingId === "create-reservation" ? "Creating..." : "Reserve Table"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* =================================================
                BILL DETAIL MODAL (shows regardless of active tab)
            ================================================= */}

            {selectedBill && (
                <div
                    className="cashier-modal-overlay"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setSelectedBill(null);
                        }
                    }}
                >
                    <div className="cashier-modal">
                        <div className="cashier-modal-header">
                            <div>
                                <div className="cashier-modal-eyebrow">
                                    {statusLabel(selectedBill?.status)}
                                </div>
                                <h2>{selectedBill?.billNumber || "Bill"}</h2>
                                <p>Table: {selectedBill?.tableNumber || "—"}</p>
                            </div>

                            <button
                                type="button"
                                className="cashier-modal-close"
                                onClick={() => setSelectedBill(null)}
                            >
                                ×
                            </button>
                        </div>

                        <div className="cashier-modal-items">
                            <div style={{ marginBottom: "14px" }}>
                                <strong>Orders:</strong> {getBillOrdersText(selectedBill)}
                                {selectedBill?.sessionCode && (
                                    <div style={{ marginTop: "4px", fontSize: "13px", color: "#8b7569" }}>
                                        Session: {selectedBill.sessionCode}
                                    </div>
                                )}
                            </div>

                            {Array.isArray(selectedBill?.items) && selectedBill.items.length > 0 && (
                                <div style={{ marginBottom: "16px" }}>
                                    <h3 style={{ marginBottom: "10px" }}>Bill Items</h3>

                                    {selectedBill.items.map((item, index) => (
                                        <div
                                            key={item?.id ?? index}
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                padding: "10px 0",
                                                borderBottom: "1px solid #57453a",
                                            }}
                                        >
                                            <div>
                                                <strong>{item?.menuItemName || item?.name || "Item"}</strong>
                                                <div style={{ fontSize: "12px", color: "#8b7569" }}>
                                                    {formatMoney(item?.unitPrice)} × {item?.quantity}
                                                </div>
                                            </div>

                                            <strong>{formatMoney(item?.totalPrice)}</strong>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="cashier-modal-totals">
                            <div>
                                <span>Subtotal</span>
                                <strong>{formatMoney(selectedBill?.subtotal)}</strong>
                            </div>

                            <div>
                                <span>Tax</span>
                                <strong>{formatMoney(selectedBill?.tax)}</strong>
                            </div>

                            <div>
                                <span>Discount</span>
                                <strong>{formatMoney(selectedBill?.discount)}</strong>
                            </div>

                            <div className="cashier-modal-grand-total">
                                <span>Total Amount</span>
                                <strong>{formatMoney(selectedBill?.totalAmount)}</strong>
                            </div>
                        </div>

                        <div className="cashier-modal-actions">
                            <button
                                type="button"
                                className="cashier-secondary-button"
                                onClick={() => setSelectedBill(null)}
                            >
                                Close
                            </button>

                            <button
                                type="button"
                                className="cashier-secondary-button"
                                disabled={actionLoadingId === `print-${selectedBill?.id}`}
                                onClick={() => printBill(selectedBill)}
                            >
                                {actionLoadingId === `print-${selectedBill?.id}` ? "Printing..." : "Print Bill"}
                            </button>

                            {selectedBill?.status !== "PAID" && (
                                <button
                                    type="button"
                                    className="cashier-primary-button"
                                    style={{ width: "auto" }}
                                    disabled={actionLoadingId === `paid-${selectedBill?.id}`}
                                    onClick={() => markPaid(selectedBill)}
                                >
                                    {actionLoadingId === `paid-${selectedBill?.id}` ? "Processing..." : "Mark Paid"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

export default CashierDashboard;