import { useCallback, useEffect, useState } from "react";

const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:8080/api";

function WaiterDashboard() {
    // =====================================================
    // STATE
    // =====================================================

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [actionLoadingId, setActionLoadingId] = useState(null);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    // =====================================================
    // TOKEN
    // =====================================================

    const getToken = () => {
        return localStorage.getItem("waiterToken") || "";
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
                      Authorization: `Bearer ${token}`,
                  }
                : {}),
        };
    };

    // =====================================================
    // GET ORDER ID
    // =====================================================

    const getOrderId = (order) => {
        return order?.orderId ?? order?.id ?? null;
    };

    // =====================================================
    // LOGOUT
    // =====================================================

    const handleLogout = () => {
        localStorage.removeItem("waiterToken");
        localStorage.removeItem("waiterEmployeeId");
        localStorage.removeItem("waiterFullName");

        window.location.href = "/login";
    };

    // =====================================================
    // LOAD ALL READY ORDERS
    // =====================================================

    const loadOrders = useCallback(
        async (showFullLoader = false) => {
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
                        "Waiter login session not found. Please login again."
                    );
                }

                const response = await fetch(
                    `${API_BASE_URL}/waiter/orders`,
                    {
                        method: "GET",
                        headers: getHeaders(),
                    }
                );

                const data = await response
                    .json()
                    .catch(() => null);

                if (!response.ok) {
                    if (response.status === 401) {
                        throw new Error(
                            "Waiter login session has expired. Please login again."
                        );
                    }

                    if (response.status === 403) {
                        throw new Error(
                            data?.message ||
                                data?.error ||
                                "You do not have permission to access waiter orders."
                        );
                    }

                    throw new Error(
                        data?.message ||
                            data?.error ||
                            `Failed to load waiter orders (${response.status})`
                    );
                }

                const normalized = Array.isArray(data)
                    ? data
                          .map((order) => {
                              const orderId =
                                  getOrderId(order);

                              return {
                                  ...order,
                                  orderId,
                              };
                          })
                          .filter(
                              (order) =>
                                  order.orderId !== null
                          )
                    : [];

                setOrders(normalized);
            } catch (err) {
                setOrders([]);

                setError(
                    err.message ||
                        "Unable to load ready orders."
                );
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        []
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
        const interval = setInterval(() => {
            loadOrders(false);
        }, 10000);

        return () => {
            clearInterval(interval);
        };
    }, [loadOrders]);

    // =====================================================
    // CLEAR SUCCESS MESSAGE
    // =====================================================

    useEffect(() => {
        if (!successMessage) {
            return;
        }

        const timeout = setTimeout(() => {
            setSuccessMessage("");
        }, 3000);

        return () => {
            clearTimeout(timeout);
        };
    }, [successMessage]);

    // =====================================================
    // SERVE ORDER
    // =====================================================

    const serveOrder = async (orderId) => {
        if (!orderId) {
            setError("Order ID is missing.");
            return;
        }

        try {
            setActionLoadingId(orderId);

            setError("");
            setSuccessMessage("");

            const token = getToken();

            if (!token) {
                throw new Error(
                    "Waiter login session has expired. Please login again."
                );
            }

            const response = await fetch(
                `${API_BASE_URL}/waiter/orders/${orderId}/status?status=SERVED`,
                {
                    method: "PATCH",
                    headers: getHeaders(),
                }
            );

            const data = await response
                .json()
                .catch(() => null);

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error(
                        "Waiter login session has expired. Please login again."
                    );
                }

                if (response.status === 403) {
                    throw new Error(
                        data?.message ||
                            data?.error ||
                            "You do not have permission to serve this order."
                    );
                }

                throw new Error(
                    data?.message ||
                        data?.error ||
                        `Failed to serve order (${response.status})`
                );
            }

            const servedOrderNumber =
                data?.orderNumber ||
                orders.find(
                    (order) =>
                        order.orderId === orderId
                )?.orderNumber;

            setSuccessMessage(
                servedOrderNumber
                    ? `${servedOrderNumber} marked as served.`
                    : "Order marked as served."
            );

            await loadOrders(false);
        } catch (err) {
            setError(
                err.message ||
                    "Failed to serve order."
            );
        } finally {
            setActionLoadingId(null);
        }
    };

    // =====================================================
    // FORMAT MONEY
    // =====================================================

    const formatMoney = (value) => {
        const amount = Number(value || 0);

        return amount.toLocaleString("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2,
        });
    };

    // =====================================================
    // FORMAT TIME
    // =====================================================

    const formatTime = (value) => {
        if (!value) {
            return "—";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return date.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // =====================================================
    // ITEM COUNT
    // =====================================================

    const getItemCount = (order) => {
        return (order?.items || []).reduce(
            (total, item) =>
                total +
                Number(item?.quantity || 0),
            0
        );
    };

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <div className="waiter-page">

            <style>
                {`

                * {
                    box-sizing: border-box;
                }

                body {
                    margin: 0;
                }

                .waiter-page {
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

                .waiter-header {
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

                .waiter-header-left h1 {
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

                .waiter-header-left p {
                    margin:
                        9px 0 0;

                    color:
                        #baa89a;

                    font-size:
                        14px;
                }

                .waiter-header-right {
                    display:
                        flex;

                    align-items:
                        center;

                    gap:
                        10px;

                    flex-wrap:
                        wrap;

                    justify-content:
                        flex-end;
                }

                .ready-badge {
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

                .ready-dot {
                    width:
                        8px;

                    height:
                        8px;

                    border-radius:
                        50%;

                    background:
                        #69aa70;

                    box-shadow:
                        0 0 0 4px
                        rgba(
                            105,
                            170,
                            112,
                            0.12
                        );
                }

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
                        background 0.18s ease,
                        transform 0.18s ease;
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
                        background 0.18s ease,
                        border-color 0.18s ease,
                        transform 0.18s ease;
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

                .waiter-success {
                    display:
                        flex;

                    align-items:
                        center;

                    gap:
                        9px;

                    margin-bottom:
                        18px;

                    padding:
                        13px 15px;

                    border:
                        1px solid
                        #bdd3c1;

                    border-radius:
                        10px;

                    background:
                        #e4f0e5;

                    color:
                        #35623c;

                    font-size:
                        13px;

                    font-weight:
                        700;
                }

                .success-icon {
                    width:
                        22px;

                    height:
                        22px;

                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        center;

                    flex-shrink:
                        0;

                    border-radius:
                        50%;

                    background:
                        #4e7c55;

                    color:
                        #ffffff;

                    font-size:
                        11px;

                    font-weight:
                        900;
                }

                .waiter-error {
                    display:
                        flex;

                    align-items:
                        center;

                    gap:
                        9px;

                    margin-bottom:
                        18px;

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

                .waiter-error button {
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

                .waiter-summary {
                    display:
                        grid;

                    grid-template-columns:
                        repeat(
                            3,
                            minmax(
                                0,
                                1fr
                            )
                        );

                    gap:
                        14px;

                    margin-bottom:
                        25px;
                }

                .summary-card {
                    padding:
                        18px 19px;

                    border:
                        1px solid
                        #624a3b;

                    border-radius:
                        11px;

                    background:
                        #211914;

                    transition:
                        transform 0.18s ease,
                        border-color 0.18s ease;
                }

                .summary-card:hover {
                    transform:
                        translateY(-2px);

                    border-color:
                        #795a47;
                }

                .summary-card span {
                    display:
                        block;

                    margin-bottom:
                        7px;

                    color:
                        #9a8678;

                    font-size:
                        11px;

                    font-weight:
                        600;

                    text-transform:
                        uppercase;

                    letter-spacing:
                        0.4px;
                }

                .summary-card strong {
                    color:
                        #f0dfd3;

                    font-size:
                        25px;

                    font-weight:
                        800;
                }

                .queue-header {
                    display:
                        flex;

                    align-items:
                        flex-end;

                    justify-content:
                        space-between;

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

                .waiter-loading {
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

                .waiter-spinner {
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
                        waiter-spin
                        0.8s
                        linear
                        infinite;
                }

                @keyframes waiter-spin {
                    to {
                        transform:
                            rotate(360deg);
                    }
                }

                .waiter-loading p {
                    margin:
                        0;

                    color:
                        #9b897c;

                    font-size:
                        13px;
                }

                .waiter-empty {
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

                .waiter-empty h3 {
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

                .waiter-empty p {
                    max-width:
                        390px;

                    margin:
                        0;

                    color:
                        #8f7d71;

                    font-size:
                        13px;

                    line-height:
                        1.5;
                }

                .waiter-order-grid {
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

                .waiter-order-card {
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
                        waiter-card-enter
                        0.25s
                        ease-out;
                }

                @keyframes waiter-card-enter {
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

                    align-items:
                        flex-start;

                    justify-content:
                        space-between;

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

                    align-items:
                        center;

                    flex-wrap:
                        wrap;

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

                .ready-status {
                    flex-shrink:
                        0;

                    padding:
                        7px 10px;

                    border-radius:
                        999px;

                    background:
                        #dbeedf;

                    color:
                        #3c7044;

                    font-size:
                        9px;

                    font-weight:
                        900;

                    letter-spacing:
                        0.4px;
                }

                .order-info-grid {
                    display:
                        grid;

                    grid-template-columns:
                        repeat(
                            3,
                            minmax(
                                0,
                                1fr
                            )
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

                .items-section {
                    padding:
                        16px 18px 9px;
                }

                .items-heading {
                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        space-between;

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

                    align-items:
                        flex-start;

                    justify-content:
                        space-between;

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

                .order-card-footer {
                    display:
                        flex;

                    align-items:
                        center;

                    justify-content:
                        space-between;

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

                .serve-button {
                    min-width:
                        145px;

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

                .serve-button:hover {
                    background:
                        #693f26;

                    transform:
                        translateY(-1px);
                }

                .serve-button:disabled {
                    opacity:
                        0.55;

                    cursor:
                        not-allowed;

                    transform:
                        none;
                }

                @media (max-width: 900px) {
                    .waiter-summary {
                        grid-template-columns:
                            1fr;
                    }
                }

                @media (max-width: 760px) {
                    .waiter-page {
                        padding:
                            20px
                            15px
                            30px;
                    }

                    .waiter-header {
                        flex-direction:
                            column;
                    }

                    .waiter-header-right {
                        width:
                            100%;

                        justify-content:
                            flex-start;
                    }

                    .waiter-order-grid {
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
                    .waiter-header-left h1 {
                        font-size:
                            28px;
                    }

                    .waiter-header-right {
                        flex-direction:
                            column;

                        align-items:
                            stretch;
                    }

                    .ready-badge,
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
                                minmax(
                                    0,
                                    1fr
                                )
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

                    .serve-button {
                        width:
                            100%;
                    }

                    .waiter-success,
                    .waiter-error {
                        align-items:
                            flex-start;
                    }
                }

                `}
            </style>

            {/* HEADER */}

            <div className="waiter-header">

                <div className="waiter-header-left">

                    <h1>
                        Waiter Dashboard
                    </h1>

                    <p>
                        View all ready orders and serve
                        them to customers.
                    </p>

                </div>

                <div className="waiter-header-right">

                    <div className="ready-badge">

                        <span className="ready-dot"></span>

                        Service Queue

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

            {/* SUCCESS */}

            {successMessage && (

                <div className="waiter-success">

                    <span className="success-icon">
                        ✓
                    </span>

                    {successMessage}

                </div>

            )}

            {/* ERROR */}

            {error && (

                <div className="waiter-error">

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

            {/* SUMMARY */}

            <div className="waiter-summary">

                <div className="summary-card">

                    <span>
                        Ready Orders
                    </span>

                    <strong>
                        {orders.length}
                    </strong>

                </div>

                <div className="summary-card">

                    <span>
                        Items To Serve
                    </span>

                    <strong>
                        {orders.reduce(
                            (
                                total,
                                order
                            ) =>
                                total +
                                getItemCount(
                                    order
                                ),
                            0
                        )}
                    </strong>

                </div>

                <div className="summary-card">

                    <span>
                        Queue Value
                    </span>

                    <strong>
                        {
                            formatMoney(
                                orders.reduce(
                                    (
                                        total,
                                        order
                                    ) =>
                                        total +
                                        Number(
                                            order.totalAmount ||
                                                0
                                        ),
                                    0
                                )
                            )
                        }
                    </strong>

                </div>

            </div>

            {/* QUEUE HEADER */}

            {!loading && (

                <div className="queue-header">

                    <div>

                        <h2>
                            Ready Orders
                        </h2>

                        <p>
                            All READY orders waiting
                            for service appear here.
                        </p>

                    </div>

                    <span className="queue-count">

                        {orders.length}{" "}

                        {
                            orders.length === 1
                                ? "order"
                                : "orders"
                        }

                    </span>

                </div>

            )}

            {/* LOADING / EMPTY / ORDERS */}

            {loading ? (

                <div className="waiter-loading">

                    <div className="waiter-spinner"></div>

                    <p>
                        Loading ready orders...
                    </p>

                </div>

            ) : orders.length === 0 ? (

                <div className="waiter-empty">

                    <div className="empty-icon">
                        ✓
                    </div>

                    <h3>
                        No ready orders
                    </h3>

                    <p>
                        There are currently no READY
                        orders waiting for service.
                    </p>

                </div>

            ) : (

                <div className="waiter-order-grid">

                    {orders.map(
                        (order) => {

                            const orderId =
                                getOrderId(
                                    order
                                );

                            const itemCount =
                                getItemCount(
                                    order
                                );

                            const isServing =
                                actionLoadingId ===
                                orderId;

                            return (

                                <article
                                    key={orderId}
                                    className="waiter-order-card"
                                >

                                    {/* CARD HEADER */}

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
                                                    Ready for service
                                                </span>

                                                <span className="meta-dot"></span>

                                                <span>
                                                    {
                                                        formatTime(
                                                            order.createdAt
                                                        )
                                                    }
                                                </span>

                                            </div>

                                        </div>

                                        <span className="ready-status">
                                            READY
                                        </span>

                                    </div>

                                    {/* ORDER INFO */}

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

                                    {/* ITEMS */}

                                    <div className="items-section">

                                        <div className="items-heading">

                                            <strong>
                                                Order Items
                                            </strong>

                                            <span>

                                                {itemCount}{" "}

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

                                    {/* FOOTER */}

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

                                        <button
                                            type="button"
                                            className="serve-button"
                                            onClick={() =>
                                                serveOrder(
                                                    orderId
                                                )
                                            }
                                            disabled={
                                                isServing
                                            }
                                        >

                                            {
                                                isServing
                                                    ? "Serving..."
                                                    : "Serve Order"
                                            }

                                        </button>

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

export default WaiterDashboard;