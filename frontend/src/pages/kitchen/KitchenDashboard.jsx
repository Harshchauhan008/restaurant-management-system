import { useCallback, useEffect, useMemo, useState } from "react";

const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:8080/api";

const STATUS_TABS = [
    {
        key: "PLACED",
        label: "New Orders",
        description: "Awaiting confirmation",
    },
    {
        key: "CONFIRMED",
        label: "Confirmed",
        description: "Accepted by kitchen",
    },
    {
        key: "PREPARING",
        label: "Preparing",
        description: "Currently cooking",
    },
    {
        key: "READY",
        label: "Ready",
        description: "Ready for waiter",
    },
];

function KitchenDashboard() {
    // =====================================================
    // STATE
    // =====================================================

    const [activeStatus, setActiveStatus] =
        useState("PLACED");

    const [orders, setOrders] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [error, setError] =
        useState("");

    const [actionLoadingId, setActionLoadingId] =
        useState(null);

    // =====================================================
    // KITCHEN TOKEN
    // =====================================================

    const getToken = () => {
        return localStorage.getItem("kitchenToken") || "";
    };

    // =====================================================
    // HEADERS
    // =====================================================

    const getHeaders = () => {
        const token = getToken();

        return {
            "Content-Type": "application/json",

            ...(token
                ? {
                      Authorization:
                          `Bearer ${token}`,
                  }
                : {}),
        };
    };

    // =====================================================
    // LOGOUT
    // =====================================================
    // IMPORTANT:
    // Remove ONLY the kitchen session.
    //
    // Do NOT remove:
    // waiterToken
    // adminToken
    // cashierToken
    // receptionToken
    //
    // This keeps role sessions independent.
    // =====================================================

    const handleLogout = () => {
        localStorage.removeItem("kitchenToken");

        // These are optional kitchen-only values if
        // you decide to store them later.
        localStorage.removeItem("kitchenEmployeeId");
        localStorage.removeItem("kitchenFullName");

        window.location.href = "/login";
    };

    // =====================================================
    // GET ORDER ID
    // =====================================================

    const getOrderId = (order) => {
        return (
            order?.orderId ??
            order?.id ??
            null
        );
    };

    // =====================================================
    // FETCH ORDERS FOR ONE STATUS
    // =====================================================

    const fetchOrdersForStatus =
        useCallback(
            async (status) => {
                const token = getToken();

                if (!token) {
                    throw new Error(
                        "Kitchen login session not found. Please login again."
                    );
                }

                const response =
                    await fetch(
                        `${API_BASE_URL}/kitchen/orders/status/${status}`,
                        {
                            method: "GET",
                            headers: getHeaders(),
                        }
                    );

                const data =
                    await response
                        .json()
                        .catch(() => null);

                if (!response.ok) {
                    console.error(
                        "Kitchen API status:",
                        response.status
                    );

                    console.error(
                        "Kitchen API response:",
                        data
                    );

                    if (response.status === 401) {
                        throw new Error(
                            "Kitchen login session has expired. Please login again."
                        );
                    }

                    if (response.status === 403) {
                        throw new Error(
                            data?.message ||
                            data?.error ||
                            "You do not have permission to access kitchen orders."
                        );
                    }

                    throw new Error(
                        data?.message ||
                        data?.error ||
                        `Failed to load ${status} orders (${response.status})`
                    );
                }

                return Array.isArray(data)
                    ? data
                    : [];
            },
            []
        );

    // =====================================================
    // LOAD ALL KITCHEN ORDERS
    // =====================================================

    const loadOrders =
        useCallback(
            async (
                showFullLoader = false
            ) => {
                try {
                    if (showFullLoader) {
                        setLoading(true);
                    } else {
                        setRefreshing(true);
                    }

                    setError("");

                    const token = getToken();

                    if (!token) {
                        throw new Error(
                            "Kitchen login session not found. Please login again."
                        );
                    }

                    const results =
                        await Promise.all(
                            STATUS_TABS.map(
                                (tab) =>
                                    fetchOrdersForStatus(
                                        tab.key
                                    )
                            )
                        );

                    const merged = [];

                    results.forEach(
                        (statusOrders) => {
                            statusOrders.forEach(
                                (order) => {
                                    const id =
                                        getOrderId(
                                            order
                                        );

                                    if (!id) {
                                        return;
                                    }

                                    merged.push({
                                        ...order,
                                        orderId: id,
                                    });
                                }
                            );
                        }
                    );

                    setOrders(merged);
                } catch (err) {
                    console.error(
                        "Kitchen load error:",
                        err
                    );

                    setOrders([]);

                    setError(
                        err.message ||
                        "Unable to load kitchen orders."
                    );
                } finally {
                    setLoading(false);
                    setRefreshing(false);
                }
            },
            [fetchOrdersForStatus]
        );

    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {
        loadOrders(true);
    }, [loadOrders]);

    // =====================================================
    // AUTO REFRESH
    // =====================================================

    useEffect(() => {
        const interval =
            setInterval(() => {
                loadOrders(false);
            }, 10000);

        return () => {
            clearInterval(interval);
        };
    }, [loadOrders]);

    // =====================================================
    // CURRENT ORDERS
    // =====================================================

    const visibleOrders =
        useMemo(() => {
            return orders.filter(
                (order) =>
                    order.status ===
                    activeStatus
            );
        }, [
            orders,
            activeStatus,
        ]);

    // =====================================================
    // STATUS COUNT
    // =====================================================

    const getStatusCount =
        (status) => {
            return orders.filter(
                (order) =>
                    order.status === status
            ).length;
        };

    // =====================================================
    // NEXT STATUS
    // =====================================================

    const getNextStatus =
        (currentStatus) => {
            switch (currentStatus) {
                case "PLACED":
                    return "CONFIRMED";

                case "CONFIRMED":
                    return "PREPARING";

                case "PREPARING":
                    return "READY";

                default:
                    return null;
            }
        };

    // =====================================================
    // ACTION TEXT
    // =====================================================

    const getActionText =
        (status) => {
            switch (status) {
                case "PLACED":
                    return "Confirm Order";

                case "CONFIRMED":
                    return "Start Preparing";

                case "PREPARING":
                    return "Mark Ready";

                default:
                    return "";
            }
        };

    // =====================================================
    // UPDATE ORDER STATUS
    // =====================================================

    const updateOrderStatus =
        async (
            orderId,
            nextStatus
        ) => {
            if (!orderId) {
                setError(
                    "Order ID is missing."
                );

                return;
            }

            if (!nextStatus) {
                setError(
                    "Next order status is missing."
                );

                return;
            }

            try {
                setActionLoadingId(
                    orderId
                );

                setError("");

                const token = getToken();

                if (!token) {
                    throw new Error(
                        "Kitchen login session has expired. Please login again."
                    );
                }

                const response =
                    await fetch(
                        `${API_BASE_URL}/kitchen/orders/${orderId}/status?status=${nextStatus}`,
                        {
                            method: "PATCH",
                            headers:
                                getHeaders(),
                        }
                    );

                const data =
                    await response
                        .json()
                        .catch(() => null);

                if (!response.ok) {
                    console.error(
                        "Kitchen status update:",
                        response.status
                    );

                    console.error(
                        "Kitchen status response:",
                        data
                    );

                    if (response.status === 401) {
                        throw new Error(
                            "Kitchen login session has expired. Please login again."
                        );
                    }

                    if (response.status === 403) {
                        throw new Error(
                            data?.message ||
                            data?.error ||
                            "You do not have permission to update this order."
                        );
                    }

                    throw new Error(
                        data?.message ||
                        data?.error ||
                        `Failed to update order (${response.status})`
                    );
                }

                await loadOrders(false);

                // Move to the next status tab.
                setActiveStatus(
                    nextStatus
                );
            } catch (err) {
                console.error(
                    "Kitchen status update error:",
                    err
                );

                setError(
                    err.message ||
                    "Failed to update order."
                );
            } finally {
                setActionLoadingId(
                    null
                );
            }
        };

    // =====================================================
    // MONEY
    // =====================================================

    const formatMoney =
        (value) => {
            const amount =
                Number(value || 0);

            return amount.toLocaleString(
                "en-IN",
                {
                    style: "currency",
                    currency: "INR",
                    maximumFractionDigits: 2,
                }
            );
        };

    // =====================================================
    // TIME
    // =====================================================

    const formatTime =
        (value) => {
            if (!value) {
                return "—";
            }

            const parsed =
                new Date(value);

            if (
                Number.isNaN(
                    parsed.getTime()
                )
            ) {
                return value;
            }

            return parsed.toLocaleTimeString(
                "en-IN",
                {
                    hour: "2-digit",
                    minute: "2-digit",
                }
            );
        };

    // =====================================================
    // ORDER AGE
    // =====================================================

    const getOrderAge =
        (value) => {
            if (!value) {
                return "";
            }

            const created =
                new Date(value);

            if (
                Number.isNaN(
                    created.getTime()
                )
            ) {
                return "";
            }

            const minutes =
                Math.floor(
                    (
                        Date.now() -
                        created.getTime()
                    ) / 60000
                );

            if (minutes <= 0) {
                return "Just now";
            }

            if (minutes === 1) {
                return "1 min ago";
            }

            if (minutes < 60) {
                return `${minutes} mins ago`;
            }

            const hours =
                Math.floor(
                    minutes / 60
                );

            if (hours === 1) {
                return "1 hr ago";
            }

            return `${hours} hrs ago`;
        };

    // =====================================================
    // ITEM COUNT
    // =====================================================

    const getItemCount =
        (order) => {
            return (
                order?.items || []
            ).reduce(
                (
                    total,
                    item
                ) =>
                    total +
                    Number(
                        item?.quantity || 0
                    ),
                0
            );
        };

    // =====================================================
    // STATUS TEXT
    // =====================================================

    const getStatusText =
        (status) => {
            switch (status) {
                case "PLACED":
                    return "NEW";

                case "CONFIRMED":
                    return "CONFIRMED";

                case "PREPARING":
                    return "PREPARING";

                case "READY":
                    return "READY";

                default:
                    return status;
            }
        };

    // =====================================================
    // ACTIVE TAB
    // =====================================================

    const activeTab =
        STATUS_TABS.find(
            (tab) =>
                tab.key === activeStatus
        );

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <div className="kitchen-page">

            <style>
                {`

                * {
                    box-sizing: border-box;
                }

                body {
                    margin: 0;
                }

                .kitchen-page {
                    min-height: 100vh;

                    padding:
                        28px
                        30px
                        40px;

                    background:
                        radial-gradient(
                            circle at top right,
                            rgba(
                                129,
                                80,
                                47,
                                0.10
                            ),
                            transparent 28%
                        ),
                        #171310;

                    color:
                        #f2e8df;

                    font-family:
                        Inter,
                        system-ui,
                        -apple-system,
                        BlinkMacSystemFont,
                        "Segoe UI",
                        sans-serif;
                }

                /* ==========================================
                   HEADER
                ========================================== */

                .kitchen-header {
                    display:
                        flex;

                    justify-content:
                        space-between;

                    align-items:
                        flex-start;

                    gap:
                        24px;

                    margin-bottom:
                        26px;
                }

                .kitchen-header-left h1 {
                    margin:
                        0;

                    color:
                        #f6eee7;

                    font-family:
                        Georgia,
                        serif;

                    font-size:
                        35px;

                    line-height:
                        1.1;

                    letter-spacing:
                        -0.6px;
                }

                .kitchen-header-left p {
                    margin:
                        9px 0 0;

                    color:
                        #baa89a;

                    font-size:
                        14px;
                }

                .kitchen-header-right {
                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        flex-end;

                    gap:
                        10px;

                    flex-wrap:
                        wrap;
                }

                /* ==========================================
                   LIVE BADGE
                ========================================== */

                .live-badge {
                    display:
                        inline-flex;

                    align-items:
                        center;

                    gap:
                        8px;

                    height:
                        40px;

                    padding:
                        0 14px;

                    border:
                        1px solid
                        #624c3c;

                    border-radius:
                        999px;

                    background:
                        #241b16;

                    color:
                        #ddc8b8;

                    font-size:
                        12px;

                    font-weight:
                        700;
                }

                .live-dot {
                    width:
                        8px;

                    height:
                        8px;

                    border-radius:
                        50%;

                    background:
                        #6aaa70;

                    box-shadow:
                        0 0 0 4px
                        rgba(
                            106,
                            170,
                            112,
                            0.12
                        );
                }

                /* ==========================================
                   REFRESH BUTTON
                ========================================== */

                .refresh-button {
                    height:
                        40px;

                    padding:
                        0 15px;

                    border:
                        1px solid
                        #72533f;

                    border-radius:
                        8px;

                    background:
                        #2b201a;

                    color:
                        #eadbd0;

                    font-family:
                        inherit;

                    font-size:
                        12px;

                    font-weight:
                        700;

                    cursor:
                        pointer;

                    transition:
                        background
                        0.18s ease,
                        transform
                        0.18s ease;
                }

                .refresh-button:hover {
                    background:
                        #382820;

                    transform:
                        translateY(-1px);
                }

                .refresh-button:disabled {
                    opacity:
                        0.55;

                    cursor:
                        not-allowed;

                    transform:
                        none;
                }

                /* ==========================================
                   LOGOUT BUTTON
                ========================================== */

                .logout-button {
                    height:
                        40px;

                    padding:
                        0 17px;

                    border:
                        1px solid
                        #8a5b45;

                    border-radius:
                        8px;

                    background:
                        #4a2b1e;

                    color:
                        #f7e8dd;

                    font-family:
                        inherit;

                    font-size:
                        12px;

                    font-weight:
                        800;

                    cursor:
                        pointer;

                    transition:
                        background
                        0.18s ease,
                        border-color
                        0.18s ease,
                        transform
                        0.18s ease;
                }

                .logout-button:hover {
                    background:
                        #633b29;

                    border-color:
                        #a56b44;

                    transform:
                        translateY(-1px);
                }

                .logout-button:active {
                    transform:
                        translateY(0);
                }

                /* ==========================================
                   ERROR
                ========================================== */

                .kitchen-error {
                    display:
                        flex;

                    align-items:
                        center;

                    gap:
                        9px;

                    margin-bottom:
                        20px;

                    padding:
                        13px 15px;

                    border:
                        1px solid
                        #d9aaa3;

                    border-radius:
                        10px;

                    background:
                        #f7e5e2;

                    color:
                        #91372f;

                    font-size:
                        13px;
                }

                .kitchen-error button {
                    margin-left:
                        auto;

                    border:
                        none;

                    background:
                        transparent;

                    color:
                        #91372f;

                    font-family:
                        inherit;

                    font-size:
                        12px;

                    font-weight:
                        800;

                    text-decoration:
                        underline;

                    cursor:
                        pointer;
                }

                /* ==========================================
                   STATUS NAV
                ========================================== */

                .kitchen-status-nav {
                    display:
                        grid;

                    grid-template-columns:
                        repeat(
                            4,
                            minmax(
                                0,
                                1fr
                            )
                        );

                    gap:
                        11px;

                    margin-bottom:
                        27px;
                }

                .status-tab {
                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        space-between;

                    gap:
                        15px;

                    min-height:
                        70px;

                    padding:
                        0 18px;

                    border:
                        1px solid
                        #5f493a;

                    border-radius:
                        11px;

                    background:
                        #211914;

                    color:
                        #b8a699;

                    font-family:
                        inherit;

                    cursor:
                        pointer;

                    transition:
                        background
                        0.2s ease,
                        border-color
                        0.2s ease,
                        transform
                        0.2s ease;
                }

                .status-tab:hover {
                    background:
                        #2b201a;

                    border-color:
                        #80604b;

                    transform:
                        translateY(-1px);
                }

                .status-tab.active {
                    background:
                        #754526;

                    border-color:
                        #a46b44;

                    color:
                        #ffffff;
                }

                .status-tab-content {
                    display:
                        flex;

                    flex-direction:
                        column;

                    align-items:
                        flex-start;

                    gap:
                        4px;
                }

                .status-tab-label {
                    font-size:
                        13px;

                    font-weight:
                        800;
                }

                .status-tab-description {
                    color:
                        #877467;

                    font-size:
                        10px;
                }

                .status-tab.active
                .status-tab-description {
                    color:
                        #e6cdbd;
                }

                .status-count {
                    min-width:
                        32px;

                    height:
                        32px;

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        center;

                    border-radius:
                        50%;

                    background:
                        #342821;

                    color:
                        #d8c6b9;

                    font-size:
                        11px;

                    font-weight:
                        900;
                }

                .status-tab.active
                .status-count {
                    background:
                        rgba(
                            255,
                            255,
                            255,
                            0.16
                        );

                    color:
                        #ffffff;
                }

                /* ==========================================
                   QUEUE HEADER
                ========================================== */

                .queue-header {
                    display:
                        flex;

                    justify-content:
                        space-between;

                    align-items:
                        flex-end;

                    gap:
                        20px;

                    margin-bottom:
                        17px;
                }

                .queue-header h2 {
                    margin:
                        0;

                    color:
                        #efdfd3;

                    font-family:
                        Georgia,
                        serif;

                    font-size:
                        22px;
                }

                .queue-header p {
                    margin:
                        5px 0 0;

                    color:
                        #8f7c70;

                    font-size:
                        12px;
                }

                .queue-count {
                    color:
                        #a99585;

                    font-size:
                        12px;

                    font-weight:
                        700;
                }

                /* ==========================================
                   EMPTY
                ========================================== */

                .kitchen-empty {
                    min-height:
                        350px;

                    display:
                        flex;

                    flex-direction:
                        column;

                    align-items:
                        center;

                    justify-content:
                        center;

                    text-align:
                        center;

                    padding:
                        40px;

                    border:
                        1px dashed
                        #554137;

                    border-radius:
                        14px;

                    background:
                        #1e1713;
                }

                .empty-icon {
                    width:
                        56px;

                    height:
                        56px;

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        center;

                    margin-bottom:
                        15px;

                    border-radius:
                        50%;

                    background:
                        #3c5440;

                    color:
                        #dceee0;

                    font-size:
                        22px;

                    font-weight:
                        900;
                }

                .kitchen-empty h3 {
                    margin:
                        0 0 7px;

                    color:
                        #eadbd1;

                    font-family:
                        Georgia,
                        serif;

                    font-size:
                        20px;
                }

                .kitchen-empty p {
                    margin:
                        0;

                    color:
                        #8f7d71;

                    font-size:
                        13px;

                    line-height:
                        1.5;
                }

                /* ==========================================
                   LOADING
                ========================================== */

                .kitchen-loading {
                    min-height:
                        350px;

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        center;

                    flex-direction:
                        column;

                    border:
                        1px dashed
                        #554137;

                    border-radius:
                        14px;

                    background:
                        #1e1713;
                }

                .kitchen-spinner {
                    width:
                        36px;

                    height:
                        36px;

                    margin-bottom:
                        13px;

                    border:
                        3px solid
                        #44352d;

                    border-top-color:
                        #a56b44;

                    border-radius:
                        50%;

                    animation:
                        kitchen-spin
                        0.8s
                        linear
                        infinite;
                }

                @keyframes kitchen-spin {
                    to {
                        transform:
                            rotate(360deg);
                    }
                }

                .kitchen-loading p {
                    margin:
                        0;

                    color:
                        #9b897c;

                    font-size:
                        13px;
                }

                /* ==========================================
                   ORDER GRID
                ========================================== */

                .kitchen-order-grid {
                    display:
                        grid;

                    grid-template-columns:
                        repeat(
                            auto-fill,
                            minmax(
                                360px,
                                1fr
                            )
                        );

                    gap:
                        18px;
                }

                /* ==========================================
                   ORDER CARD
                ========================================== */

                .kitchen-order-card {
                    display:
                        flex;

                    flex-direction:
                        column;

                    min-width:
                        0;

                    overflow:
                        hidden;

                    border:
                        1px solid
                        #cbb5a3;

                    border-radius:
                        14px;

                    background:
                        #eee3d9;

                    color:
                        #30221a;

                    box-shadow:
                        0 9px 24px
                        rgba(
                            0,
                            0,
                            0,
                            0.18
                        );

                    animation:
                        card-enter
                        0.25s
                        ease-out;
                }

                @keyframes card-enter {
                    from {
                        opacity:
                            0;

                        transform:
                            translateY(6px);
                    }

                    to {
                        opacity:
                            1;

                        transform:
                            translateY(0);
                    }
                }

                .order-card-header {
                    display:
                        flex;

                    justify-content:
                        space-between;

                    align-items:
                        flex-start;

                    gap:
                        15px;

                    padding:
                        17px 18px
                        15px;

                    background:
                        #e1d3c6;

                    border-bottom:
                        1px solid
                        #d0bcad;
                }

                .order-number {
                    color:
                        #412b20;

                    font-family:
                        Georgia,
                        serif;

                    font-size:
                        20px;

                    font-weight:
                        800;
                }

                .order-meta {
                    display:
                        flex;

                    flex-wrap:
                        wrap;

                    align-items:
                        center;

                    gap:
                        8px;

                    margin-top:
                        6px;

                    color:
                        #806c60;

                    font-size:
                        11px;
                }

                .meta-dot {
                    width:
                        3px;

                    height:
                        3px;

                    border-radius:
                        50%;

                    background:
                        #9b8577;
                }

                .order-status-badge {
                    flex-shrink:
                        0;

                    padding:
                        7px 10px;

                    border-radius:
                        999px;

                    font-size:
                        9px;

                    font-weight:
                        900;

                    letter-spacing:
                        0.4px;
                }

                .order-status-badge.placed {
                    background:
                        #f3dfd0;

                    color:
                        #914d27;
                }

                .order-status-badge.confirmed {
                    background:
                        #ece4ca;

                    color:
                        #746123;
                }

                .order-status-badge.preparing {
                    background:
                        #e2dcf0;

                    color:
                        #604f89;
                }

                .order-status-badge.ready {
                    background:
                        #dbeedf;

                    color:
                        #3d7045;
                }

                /* ==========================================
                   ORDER INFO
                ========================================== */

                .order-info-grid {
                    display:
                        grid;

                    grid-template-columns:
                        repeat(
                            3,
                            1fr
                        );

                    border-bottom:
                        1px solid
                        #d8c6b8;
                }

                .order-info {
                    padding:
                        13px 15px;

                    border-right:
                        1px solid
                        #d8c6b8;
                }

                .order-info:last-child {
                    border-right:
                        none;
                }

                .order-info span {
                    display:
                        block;

                    margin-bottom:
                        4px;

                    color:
                        #887569;

                    font-size:
                        10px;

                    font-weight:
                        600;

                    text-transform:
                        uppercase;

                    letter-spacing:
                        0.4px;
                }

                .order-info strong {
                    color:
                        #50382a;

                    font-size:
                        14px;

                    font-weight:
                        800;
                }

                /* ==========================================
                   ITEMS
                ========================================== */

                .items-section {
                    padding:
                        16px 18px 9px;
                }

                .items-heading {
                    display:
                        flex;

                    justify-content:
                        space-between;

                    align-items:
                        center;

                    margin-bottom:
                        11px;
                }

                .items-heading strong {
                    color:
                        #644a38;

                    font-size:
                        11px;

                    font-weight:
                        800;

                    text-transform:
                        uppercase;

                    letter-spacing:
                        0.5px;
                }

                .items-heading span {
                    color:
                        #8d786b;

                    font-size:
                        10px;
                }

                .items-list {
                    display:
                        flex;

                    flex-direction:
                        column;

                    gap:
                        10px;
                }

                .order-item {
                    display:
                        flex;

                    justify-content:
                        space-between;

                    align-items:
                        flex-start;

                    gap:
                        12px;

                    padding-bottom:
                        10px;

                    border-bottom:
                        1px solid
                        #dfd0c4;
                }

                .order-item:last-child {
                    border-bottom:
                        none;
                }

                .item-left {
                    display:
                        flex;

                    align-items:
                        flex-start;

                    gap:
                        9px;

                    min-width:
                        0;
                }

                .item-quantity {
                    min-width:
                        29px;

                    height:
                        29px;

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        center;

                    flex-shrink:
                        0;

                    border-radius:
                        7px;

                    background:
                        #d8c6b8;

                    color:
                        #70462e;

                    font-size:
                        11px;

                    font-weight:
                        900;
                }

                .item-name {
                    color:
                        #3e2c22;

                    font-size:
                        13px;

                    font-weight:
                        800;

                    line-height:
                        1.35;
                }

                .item-note {
                    margin-top:
                        4px;

                    color:
                        #986e52;

                    font-size:
                        10px;

                    line-height:
                        1.45;
                }

                .item-note-label {
                    font-weight:
                        800;
                }

                .item-total {
                    flex-shrink:
                        0;

                    color:
                        #63452f;

                    font-size:
                        12px;

                    font-weight:
                        800;

                    white-space:
                        nowrap;
                }

                /* ==========================================
                   FOOTER
                ========================================== */

                .order-card-footer {
                    display:
                        flex;

                    justify-content:
                        space-between;

                    align-items:
                        center;

                    gap:
                        15px;

                    margin-top:
                        auto;

                    padding:
                        14px 18px;

                    background:
                        #e5d8cd;

                    border-top:
                        1px solid
                        #d3c1b3;
                }

                .total-label {
                    color:
                        #857165;

                    font-size:
                        11px;
                }

                .total-value {
                    margin-top:
                        2px;

                    color:
                        #3f2a1f;

                    font-size:
                        18px;

                    font-weight:
                        900;
                }

                .kitchen-action-button {
                    min-width:
                        150px;

                    height:
                        44px;

                    padding:
                        0 16px;

                    border:
                        none;

                    border-radius:
                        9px;

                    background:
                        #81502f;

                    color:
                        #ffffff;

                    font-family:
                        inherit;

                    font-size:
                        12px;

                    font-weight:
                        800;

                    cursor:
                        pointer;

                    box-shadow:
                        0 4px 10px
                        rgba(
                            110,
                            65,
                            37,
                            0.18
                        );

                    transition:
                        background
                        0.18s ease,
                        transform
                        0.18s ease;
                }

                .kitchen-action-button:hover {
                    background:
                        #693f26;

                    transform:
                        translateY(-1px);
                }

                .kitchen-action-button:disabled {
                    opacity:
                        0.55;

                    cursor:
                        not-allowed;

                    transform:
                        none;
                }

                /* ==========================================
                   RESPONSIVE
                ========================================== */

                @media (max-width: 1100px) {
                    .kitchen-header {
                        flex-direction:
                            column;
                    }

                    .kitchen-header-right {
                        width:
                            100%;

                        justify-content:
                            flex-start;
                    }
                }

                @media (max-width: 1000px) {
                    .kitchen-status-nav {
                        grid-template-columns:
                            repeat(
                                2,
                                minmax(
                                    0,
                                    1fr
                                )
                            );
                    }
                }

                @media (max-width: 760px) {
                    .kitchen-page {
                        padding:
                            20px
                            15px
                            30px;
                    }

                    .kitchen-header {
                        flex-direction:
                            column;
                    }

                    .kitchen-header-right {
                        width:
                            100%;
                    }

                    .kitchen-status-nav {
                        grid-template-columns:
                            1fr;
                    }

                    .kitchen-order-grid {
                        grid-template-columns:
                            1fr;
                    }

                    .queue-header {
                        flex-direction:
                            column;

                        align-items:
                            flex-start;
                    }
                }

                @media (max-width: 480px) {
                    .kitchen-header-left h1 {
                        font-size:
                            28px;
                    }

                    .kitchen-header-right {
                        flex-direction:
                            column;

                        align-items:
                            stretch;
                    }

                    .live-badge,
                    .refresh-button,
                    .logout-button {
                        width:
                            100%;

                        justify-content:
                            center;
                    }

                    .order-info-grid {
                        grid-template-columns:
                            repeat(
                                2,
                                1fr
                            );
                    }

                    .order-info:last-child {
                        grid-column:
                            1 / -1;

                        border-top:
                            1px solid
                            #d8c6b8;

                        border-right:
                            none;
                    }

                    .order-card-footer {
                        flex-direction:
                            column;

                        align-items:
                            stretch;
                    }

                    .kitchen-action-button {
                        width:
                            100%;
                    }

                    .kitchen-error {
                        align-items:
                            flex-start;

                        flex-wrap:
                            wrap;
                    }

                    .kitchen-error button {
                        margin-left:
                            0;
                    }
                }

                `}
            </style>

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="kitchen-header">

                <div className="kitchen-header-left">

                    <h1>
                        Kitchen Dashboard
                    </h1>

                    <p>
                        Monitor and prepare incoming
                        restaurant orders.
                    </p>

                </div>

                <div className="kitchen-header-right">

                    <div className="live-badge">

                        <span className="live-dot"></span>

                        Live Queue

                    </div>

                    <button
                        type="button"
                        className="refresh-button"
                        onClick={() =>
                            loadOrders(false)
                        }
                        disabled={refreshing}
                    >
                        {
                            refreshing
                                ? "Refreshing..."
                                : "Refresh"
                        }
                    </button>

                    <button
                        type="button"
                        className="logout-button"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>

                </div>

            </div>

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (

                <div className="kitchen-error">

                    <strong>
                        Error:
                    </strong>

                    <span>
                        {error}
                    </span>

                    <button
                        type="button"
                        onClick={() =>
                            loadOrders(true)
                        }
                    >
                        Try Again
                    </button>

                </div>

            )}

            {/* =================================================
                STATUS TABS
            ================================================= */}

            <div className="kitchen-status-nav">

                {STATUS_TABS.map(
                    (tab) => (

                        <button
                            key={tab.key}
                            type="button"
                            className={
                                activeStatus ===
                                tab.key
                                    ? "status-tab active"
                                    : "status-tab"
                            }
                            onClick={() =>
                                setActiveStatus(
                                    tab.key
                                )
                            }
                        >

                            <div className="status-tab-content">

                                <span className="status-tab-label">
                                    {tab.label}
                                </span>

                                <span className="status-tab-description">
                                    {tab.description}
                                </span>

                            </div>

                            <span className="status-count">
                                {
                                    getStatusCount(
                                        tab.key
                                    )
                                }
                            </span>

                        </button>

                    )
                )}

            </div>

            {/* =================================================
                QUEUE HEADER
            ================================================= */}

            {!loading && (

                <div className="queue-header">

                    <div>

                        <h2>
                            {
                                activeTab?.label
                            }
                        </h2>

                        <p>
                            Orders currently in
                            this kitchen queue.
                        </p>

                    </div>

                    <span className="queue-count">

                        {
                            visibleOrders.length
                        }{" "}

                        {
                            visibleOrders.length === 1
                                ? "order"
                                : "orders"
                        }

                    </span>

                </div>

            )}

            {/* =================================================
                CONTENT
            ================================================= */}

            {loading ? (

                <div className="kitchen-loading">

                    <div className="kitchen-spinner"></div>

                    <p>
                        Loading kitchen orders...
                    </p>

                </div>

            ) : visibleOrders.length === 0 ? (

                <div className="kitchen-empty">

                    <div className="empty-icon">
                        ✓
                    </div>

                    <h3>
                        No{" "}
                        {
                            activeTab?.label.toLowerCase()
                        }
                    </h3>

                    <p>
                        There are currently no orders
                        in this kitchen queue.
                    </p>

                </div>

            ) : (

                <div className="kitchen-order-grid">

                    {visibleOrders.map(
                        (order) => {

                            const orderId =
                                getOrderId(
                                    order
                                );

                            const nextStatus =
                                getNextStatus(
                                    order.status
                                );

                            const isUpdating =
                                actionLoadingId ===
                                orderId;

                            const itemCount =
                                getItemCount(
                                    order
                                );

                            return (

                                <article
                                    key={orderId}
                                    className="kitchen-order-card"
                                >

                                    {/* =================================
                                        CARD HEADER
                                    ================================= */}

                                    <div className="order-card-header">

                                        <div>

                                            <div className="order-number">

                                                {
                                                    order.orderNumber ||
                                                    `Order #${orderId}`
                                                }

                                            </div>

                                            <div className="order-meta">

                                                <span>
                                                    {
                                                        formatTime(
                                                            order.createdAt
                                                        )
                                                    }
                                                </span>

                                                <span className="meta-dot"></span>

                                                <span>
                                                    {
                                                        getOrderAge(
                                                            order.createdAt
                                                        )
                                                    }
                                                </span>

                                            </div>

                                        </div>

                                        <span
                                            className={
                                                `order-status-badge ${
                                                    (
                                                        order.status ||
                                                        ""
                                                    ).toLowerCase()
                                                }`
                                            }
                                        >
                                            {
                                                getStatusText(
                                                    order.status
                                                )
                                            }
                                        </span>

                                    </div>

                                    {/* =================================
                                        ORDER INFO
                                    ================================= */}

                                    <div className="order-info-grid">

                                        <div className="order-info">

                                            <span>
                                                Table
                                            </span>

                                            <strong>
                                                {
                                                    order.tableNumber ||
                                                    "—"
                                                }
                                            </strong>

                                        </div>

                                        <div className="order-info">

                                            <span>
                                                Items
                                            </span>

                                            <strong>
                                                {
                                                    itemCount
                                                }
                                            </strong>

                                        </div>

                                        <div className="order-info">

                                            <span>
                                                Order ID
                                            </span>

                                            <strong>
                                                #{orderId}
                                            </strong>

                                        </div>

                                    </div>

                                    {/* =================================
                                        ITEMS
                                    ================================= */}

                                    <div className="items-section">

                                        <div className="items-heading">

                                            <strong>
                                                Order Items
                                            </strong>

                                            <span>

                                                {
                                                    itemCount
                                                }{" "}

                                                {
                                                    itemCount ===
                                                    1
                                                        ? "item"
                                                        : "items"
                                                }

                                            </span>

                                        </div>

                                        <div className="items-list">

                                            {(order.items || [])
                                                .map(
                                                    (
                                                        item,
                                                        index
                                                    ) => (

                                                        <div
                                                            key={
                                                                item.id ||
                                                                item.menuItemId ||
                                                                index
                                                            }
                                                            className="order-item"
                                                        >

                                                            <div className="item-left">

                                                                <span className="item-quantity">

                                                                    ×
                                                                    {
                                                                        item.quantity ??
                                                                        0
                                                                    }

                                                                </span>

                                                                <div>

                                                                    <div className="item-name">

                                                                        {
                                                                            item.menuItemName ||
                                                                            "Menu Item"
                                                                        }

                                                                    </div>

                                                                    {item.specialInstruction && (

                                                                        <div className="item-note">

                                                                            <span className="item-note-label">
                                                                                Note:
                                                                            </span>{" "}

                                                                            {
                                                                                item.specialInstruction
                                                                            }

                                                                        </div>

                                                                    )}

                                                                </div>

                                                            </div>

                                                            <span className="item-total">

                                                                {
                                                                    formatMoney(
                                                                        item.totalPrice
                                                                    )
                                                                }

                                                            </span>

                                                        </div>

                                                    )
                                                )}

                                        </div>

                                    </div>

                                    {/* =================================
                                        FOOTER
                                    ================================= */}

                                    <div className="order-card-footer">

                                        <div>

                                            <div className="total-label">
                                                Order Total
                                            </div>

                                            <div className="total-value">

                                                {
                                                    formatMoney(
                                                        order.totalAmount
                                                    )
                                                }

                                            </div>

                                        </div>

                                        {nextStatus && (

                                            <button
                                                type="button"
                                                className="kitchen-action-button"
                                                onClick={() =>
                                                    updateOrderStatus(
                                                        orderId,
                                                        nextStatus
                                                    )
                                                }
                                                disabled={
                                                    isUpdating
                                                }
                                            >

                                                {
                                                    isUpdating
                                                        ? "Updating..."
                                                        : getActionText(
                                                              order.status
                                                          )
                                                }

                                            </button>

                                        )}

                                    </div>

                                </article>

                            );

                        }
                    )}

                </div>

            )}

        </div>
    );
}

export default KitchenDashboard;