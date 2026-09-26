import { useEffect, useMemo, useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080/api";

function CustomerMenu() {
  const [table, setTable] = useState(null);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);

  const [activeCategory, setActiveCategory] = useState("all");

  const [cart, setCart] = useState([]);

  const [loadingTable, setLoadingTable] = useState(true);
  const [loadingMenu, setLoadingMenu] = useState(true);

  const [error, setError] = useState("");

  const [placingOrder, setPlacingOrder] = useState(false);

  const [orderSuccess, setOrderSuccess] = useState(null);

  // =====================================================
  // SESSION CODE
  // =====================================================

  const [sessionCode, setSessionCode] = useState("");
  const [sessionCodeInput, setSessionCodeInput] = useState("");
  const [sessionCodeError, setSessionCodeError] = useState("");
  const [showSessionCodeModal, setShowSessionCodeModal] =
    useState(false);
  const [pendingOrderBody, setPendingOrderBody] = useState(null);

  // =====================================================
  // GET QR TOKEN
  // =====================================================

  const qrToken = new URLSearchParams(
    window.location.search
  ).get("table");

  // =====================================================
  // IMAGE URL HELPER
  // =====================================================

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) {
      return "";
    }

    if (
      imageUrl.startsWith("http://") ||
      imageUrl.startsWith("https://") ||
      imageUrl.startsWith("data:") ||
      imageUrl.startsWith("blob:")
    ) {
      return imageUrl;
    }

    return `${API_BASE_URL}${
      imageUrl.startsWith("/") ? "" : "/"
    }${imageUrl}`;
  };

  // =====================================================
  // VERIFY TABLE
  // =====================================================

  useEffect(() => {
    const verifyTable = async () => {
      if (!qrToken) {
        setError("No table QR code was provided.");
        setLoadingTable(false);
        return;
      }

      try {
        setLoadingTable(true);
        setError("");

        const response = await fetch(
          `${API_BASE_URL}/table/verify/${qrToken}`
        );

        const data = await response.json();

        if (!response.ok || !data.valid) {
          throw new Error(
            data.message || "Invalid table QR code."
          );
        }

        setTable(data);
      } catch (err) {
        setError(
          err.message || "Unable to verify the table."
        );
      } finally {
        setLoadingTable(false);
      }
    };

    verifyTable();
  }, [qrToken]);

  // =====================================================
  // LOAD MENU
  // =====================================================

  useEffect(() => {
    const loadMenu = async () => {
      try {
        setLoadingMenu(true);

        const [
          categoriesResponse,
          itemsResponse,
        ] = await Promise.all([
          fetch(`${API_BASE_URL}/menu/categories`),
          fetch(`${API_BASE_URL}/menu/items`),
        ]);

        const categoriesData =
          await categoriesResponse.json();

        const itemsData =
          await itemsResponse.json();

        if (!categoriesResponse.ok) {
          throw new Error(
            "Failed to load menu categories."
          );
        }

        if (!itemsResponse.ok) {
          throw new Error(
            "Failed to load menu items."
          );
        }

        setCategories(categoriesData);
        setMenuItems(itemsData);
      } catch (err) {
        setError(
          err.message || "Unable to load menu."
        );
      } finally {
        setLoadingMenu(false);
      }
    };

    loadMenu();
  }, []);

  // =====================================================
  // FILTER MENU
  // =====================================================

  const filteredItems = useMemo(() => {
    if (activeCategory === "all") {
      return menuItems;
    }

    return menuItems.filter(
      (item) =>
        String(item.categoryId) ===
        String(activeCategory)
    );
  }, [activeCategory, menuItems]);

  // =====================================================
  // ADD TO CART
  // =====================================================

  const addToCart = (item) => {
    setCart((currentCart) => {
      const existing = currentCart.find(
        (cartItem) =>
          cartItem.menuItemId === item.id
      );

      if (existing) {
        return currentCart.map(
          (cartItem) =>
            cartItem.menuItemId === item.id
              ? {
                  ...cartItem,
                  quantity:
                    cartItem.quantity + 1,
                }
              : cartItem
        );
      }

      return [
        ...currentCart,
        {
          menuItemId: item.id,
          menuItemName: item.name,
          unitPrice: Number(item.price),
          quantity: 1,
          specialInstruction: "",
        },
      ];
    });

    setError("");
  };

  // =====================================================
  // UPDATE QUANTITY
  // =====================================================

  const updateQuantity = (
    menuItemId,
    quantity
  ) => {
    if (quantity <= 0) {
      removeFromCart(menuItemId);
      return;
    }

    setCart((currentCart) =>
      currentCart.map(
        (item) =>
          item.menuItemId === menuItemId
            ? {
                ...item,
                quantity,
              }
            : item
      )
    );
  };

  // =====================================================
  // REMOVE FROM CART
  // =====================================================

  const removeFromCart = (menuItemId) => {
    setCart((currentCart) =>
      currentCart.filter(
        (item) =>
          item.menuItemId !== menuItemId
      )
    );
  };

  // =====================================================
  // SPECIAL INSTRUCTION
  // =====================================================

  const updateInstruction = (
    menuItemId,
    specialInstruction
  ) => {
    setCart((currentCart) =>
      currentCart.map(
        (item) =>
          item.menuItemId === menuItemId
            ? {
                ...item,
                specialInstruction,
              }
            : item
      )
    );
  };

  // =====================================================
  // CART TOTAL
  // =====================================================

  const cartTotal = useMemo(() => {
    return cart.reduce(
      (total, item) =>
        total +
        Number(item.unitPrice) *
          item.quantity,
      0
    );
  }, [cart]);

  // =====================================================
  // CART COUNT
  // =====================================================

  const cartCount = useMemo(() => {
    return cart.reduce(
      (total, item) =>
        total + item.quantity,
      0
    );
  }, [cart]);

  // =====================================================
  // SUBMIT ORDER
  // =====================================================

  const submitOrder = async (
    requestBody,
    retryWithSessionCode = false
  ) => {
    try {
      setPlacingOrder(true);
      setError("");

      if (!retryWithSessionCode) {
        setOrderSuccess(null);
      }

      const response = await fetch(
        `${API_BASE_URL}/orders`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      const data = await response.json();

      // =================================================
      // ACTIVE SESSION EXISTS
      // =================================================

      if (
        response.status === 409 &&
        data.message &&
        data.message
          .toLowerCase()
          .includes("active order")
      ) {
        setPendingOrderBody(requestBody);
        setSessionCodeInput("");
        setSessionCodeError("");
        setShowSessionCodeModal(true);

        return;
      }

      // =================================================
      // WRONG SESSION CODE
      // =================================================

      if (
        response.status === 409 &&
        data.message &&
        data.message
          .toLowerCase()
          .includes(
            "invalid 4-digit session code"
          )
      ) {
        setSessionCodeError(
          "Incorrect session code. Please try again."
        );

        setShowSessionCodeModal(true);

        return;
      }

      // =================================================
      // OTHER ERRORS
      // =================================================

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to place order."
        );
      }

      // =================================================
      // SUCCESS
      // =================================================

      setOrderSuccess(data);

      if (data.sessionCode) {
        setSessionCode(
          String(data.sessionCode)
        );
      }

      setCart([]);

      setPendingOrderBody(null);
      setShowSessionCodeModal(false);
      setSessionCodeInput("");
      setSessionCodeError("");

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err) {
      setError(
        err.message ||
          "Unable to place order."
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  // =====================================================
  // PLACE ORDER
  // =====================================================

  const placeOrder = async () => {
    if (!table) {
      setError(
        "Please wait until the table is verified."
      );
      return;
    }

    if (cart.length === 0) {
      setError(
        "Please add at least one item to your cart."
      );
      return;
    }

    const requestBody = {
      qrToken,

      items: cart.map((item) => ({
        menuItemId:
          item.menuItemId,

        quantity:
          item.quantity,

        specialInstruction:
          item.specialInstruction.trim(),
      })),
    };

    await submitOrder(requestBody);
  };

  // =====================================================
  // SUBMIT WITH SESSION CODE
  // =====================================================

  const submitWithSessionCode = async () => {
    const code =
      sessionCodeInput.trim();

    if (!/^\d{4}$/.test(code)) {
      setSessionCodeError(
        "Please enter a valid 4-digit session code."
      );
      return;
    }

    if (!pendingOrderBody) {
      setSessionCodeError(
        "No pending order was found."
      );
      return;
    }

    const requestBody = {
      ...pendingOrderBody,
      sessionCode: code,
    };

    setSessionCode(code);

    await submitOrder(
      requestBody,
      true
    );
  };

  // =====================================================
  // CLOSE SESSION MODAL
  // =====================================================

  const closeSessionCodeModal = () => {
    if (placingOrder) {
      return;
    }

    setShowSessionCodeModal(false);
    setSessionCodeInput("");
    setSessionCodeError("");
    setPendingOrderBody(null);
  };

  // =====================================================
  // PLACE ANOTHER ORDER
  // =====================================================

  const startNewOrder = () => {
    setOrderSuccess(null);
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (
    loadingTable ||
    loadingMenu
  ) {
    return (
      <div className="customer-menu-page">
        <style>
          {`
            .customer-menu-page {
              width: 100%;
              min-height: 100vh;
              overflow-x: hidden;
            }

            .customer-menu-loading {
              width: 100%;
              min-height: 100vh;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 24px;
              text-align: center;
            }

            @media (max-width: 500px) {
              .customer-menu-loading {
                padding: 20px 16px;
              }

              .customer-menu-loading h2 {
                font-size: 1.3rem;
              }

              .customer-menu-loading p {
                font-size: 0.9rem;
              }
            }
          `}
        </style>

        <div className="customer-menu-loading">
          <div className="customer-menu-spinner"></div>

          <h2>
            Preparing your table...
          </h2>

          <p>
            Loading the menu for you.
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // TABLE ERROR
  // =====================================================

  if (error && !table) {
    return (
      <div className="customer-menu-page">
        <style>
          {`
            .customer-menu-page {
              width: 100%;
              min-height: 100vh;
              overflow-x: hidden;
            }

            .customer-menu-error {
              width: 100%;
              min-height: 100vh;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 24px;
              text-align: center;
            }

            .customer-menu-error p {
              max-width: 500px;
              overflow-wrap: anywhere;
            }

            @media (max-width: 500px) {
              .customer-menu-error {
                padding: 20px 16px;
              }

              .customer-menu-error h2 {
                font-size: 1.3rem;
              }

              .customer-menu-error p {
                font-size: 0.9rem;
              }
            }
          `}
        </style>

        <div className="customer-menu-error">
          <div className="customer-menu-error-icon">
            ⚠️
          </div>

          <h2>
            Unable to open the menu
          </h2>

          <p>
            {error}
          </p>

          <button
            className="btn btn-primary"
            onClick={() =>
              window.location.reload()
            }
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-menu-page">

      {/* =================================================
          RESPONSIVE CSS
      ================================================= */}

      <style>
        {`
          /* =================================================
             BASE RESPONSIVE SAFETY
          ================================================= */

          .customer-menu-page {
            width: 100%;
            min-height: 100vh;
            overflow-x: hidden;
          }

          .customer-menu-header {
            width: 100%;
          }

          .customer-menu-header-inner {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 24px;
          }

          .customer-menu-header-inner > div:first-child {
            min-width: 0;
          }

          .customer-menu-header h1 {
            overflow-wrap: anywhere;
          }

          .customer-table-info {
            overflow-wrap: anywhere;
          }

          .customer-cart-summary {
            flex-shrink: 0;
          }

          .customer-menu-main {
            width: 100%;
            min-width: 0;
          }

          /* =================================================
             CART
          ================================================= */

          .customer-cart {
            width: 100%;
            min-width: 0;
          }

          .customer-cart-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
          }

          .customer-cart-header > div {
            min-width: 0;
          }

          .customer-cart-items {
            width: 100%;
            min-width: 0;
          }

          .customer-cart-item {
            width: 100%;
            min-width: 0;
          }

          .customer-cart-item-main {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 12px;
          }

          .customer-cart-item-info {
            min-width: 0;
          }

          .customer-cart-item-info h4 {
            overflow-wrap: anywhere;
          }

          .customer-cart-item-bottom {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
          }

          .customer-cart-item-total {
            flex-shrink: 0;
            white-space: nowrap;
          }

          .customer-cart-item textarea {
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
          }

          .customer-cart-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
          }

          .customer-cart-total {
            min-width: 0;
          }

          .customer-place-order {
            flex-shrink: 0;
          }

          /* =================================================
             CATEGORY TABS
          ================================================= */

          .customer-category-tabs {
            width: 100%;
            display: flex;
            gap: 10px;
            overflow-x: auto;
            padding-bottom: 8px;
            scrollbar-width: thin;
            -webkit-overflow-scrolling: touch;
          }

          .customer-category-tabs::-webkit-scrollbar {
            height: 4px;
          }

          .customer-tab {
            flex-shrink: 0;
            white-space: nowrap;
          }

          /* =================================================
             MENU LIST
          ================================================= */

          .customer-menu-list {
            width: 100%;
            min-width: 0;
          }

          .customer-menu-card {
            width: 100%;
            min-width: 0;
            display: flex;
          }

          .customer-menu-image {
            flex-shrink: 0;
            overflow: hidden;
          }

          .customer-menu-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
          }

          .customer-menu-card-content {
            min-width: 0;
            flex: 1;
          }

          .customer-menu-card-top {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 15px;
          }

          .customer-menu-card-top > div {
            min-width: 0;
          }

          .customer-menu-card-top h3 {
            overflow-wrap: anywhere;
          }

          .customer-menu-price {
            flex-shrink: 0;
            white-space: nowrap;
          }

          .customer-menu-card-content p {
            overflow-wrap: anywhere;
          }

          .customer-menu-card-bottom {
            display: flex;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
          }

          .customer-preparation-time,
          .customer-availability {
            white-space: nowrap;
          }

          .customer-add-button {
            margin-left: auto;
            flex-shrink: 0;
          }

          /* =================================================
             ORDER CONFIRMATION
          ================================================= */

          .customer-order-confirmation {
            width: 100%;
            min-width: 0;
          }

          .customer-confirmation-top {
            display: flex;
            align-items: flex-start;
            gap: 18px;
          }

          .customer-confirmation-top > div:last-child {
            min-width: 0;
          }

          .customer-confirmation-top h2,
          .customer-confirmation-top p {
            overflow-wrap: anywhere;
          }

          .customer-order-info-grid {
            width: 100%;
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 12px;
          }

          .customer-order-info-card {
            min-width: 0;
          }

          .customer-order-info-card strong {
            overflow-wrap: anywhere;
          }

          .customer-confirmation-items {
            width: 100%;
            min-width: 0;
          }

          .customer-confirmation-items-header {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 15px;
          }

          .customer-confirmation-items-header > div {
            min-width: 0;
          }

          .customer-confirmation-items-header h3 {
            overflow-wrap: anywhere;
          }

          .customer-receipt {
            width: 100%;
            min-width: 0;
          }

          .customer-receipt-item {
            display: flex;
            justify-content: space-between;
            gap: 15px;
          }

          .customer-receipt-item-left {
            min-width: 0;
          }

          .customer-receipt-item-left strong,
          .customer-receipt-item-left span,
          .customer-receipt-item-left small {
            overflow-wrap: anywhere;
          }

          .customer-receipt-item-price {
            flex-shrink: 0;
            white-space: nowrap;
          }

          .customer-receipt-subtotal,
          .customer-receipt-total {
            display: flex;
            justify-content: space-between;
            gap: 15px;
          }

          .customer-new-order-button {
            width: 100%;
          }

          /* =================================================
             SESSION MODAL
          ================================================= */

          .customer-session-modal-content {
            width: 100%;
            max-width: 460px;
            padding: 36px;
            background: #211b18;
            border: 1px solid var(--accent-border);
            border-radius: 18px;
            box-shadow:
              0 25px 80px rgba(0, 0, 0, 0.6);
            box-sizing: border-box;
          }

          .customer-session-modal-buttons {
            display: flex;
            gap: 12px;
            margin-top: 25px;
          }

          .customer-session-modal-buttons button {
            min-width: 0;
          }

          /* =================================================
             TABLET
          ================================================= */

          @media (max-width: 900px) {

            .customer-order-info-grid {
              grid-template-columns:
                repeat(2, minmax(0, 1fr));
            }
          }

          /* =================================================
             MOBILE
          ================================================= */

          @media (max-width: 700px) {

            .customer-menu-header-inner {
              align-items: flex-start;
              flex-direction: column;
              gap: 16px;
            }

            .customer-cart-summary {
              width: 100%;
              display: flex;
              align-items: center;
              justify-content: space-between;
            }

            .customer-order-info-grid {
              grid-template-columns:
                repeat(2, minmax(0, 1fr));
            }

            /* Menu cards become vertical */

            .customer-menu-card {
              flex-direction: column;
            }

            .customer-menu-image {
              width: 100%;
              height: 220px;
            }

            .customer-menu-card-content {
              width: 100%;
            }

            .customer-menu-card-bottom {
              align-items: center;
            }

            .customer-add-button {
              margin-left: auto;
            }

            /* Cart */

            .customer-cart-footer {
              flex-direction: column;
              align-items: stretch;
            }

            .customer-cart-total {
              display: flex;
              align-items: center;
              justify-content: space-between;
            }

            .customer-place-order {
              width: 100%;
            }

            /* Confirmation */

            .customer-confirmation-top {
              gap: 12px;
            }
          }

          /* =================================================
             SMALL MOBILE
          ================================================= */

          @media (max-width: 500px) {

            .customer-menu-page {
              font-size: 0.95rem;
            }

            .customer-menu-header-inner {
              padding-left: 16px;
              padding-right: 16px;
            }

            .customer-menu-main {
              padding-left: 16px;
              padding-right: 16px;
            }

            /* Header */

            .customer-menu-header h1 {
              font-size: 1.7rem;
            }

            .customer-table-info {
              font-size: 0.85rem;
            }

            .customer-cart-summary {
              font-size: 0.9rem;
            }

            /* Menu image */

            .customer-menu-image {
              height: 190px;
            }

            /* Menu card */

            .customer-menu-card-top {
              gap: 10px;
            }

            .customer-menu-card-top h3 {
              font-size: 1.15rem;
            }

            .customer-menu-price {
              font-size: 1rem;
            }

            .customer-menu-card-bottom {
              gap: 8px;
            }

            .customer-add-button {
              width: 100%;
              margin-left: 0;
            }

            /* Cart */

            .customer-cart-header {
              align-items: flex-start;
            }

            .customer-cart-item-bottom {
              align-items: center;
            }

            .customer-cart-item-total {
              font-size: 0.95rem;
            }

            /* Confirmation */

            .customer-confirmation-top {
              flex-direction: column;
            }

            .customer-order-info-grid {
              grid-template-columns:
                repeat(2, minmax(0, 1fr));
              gap: 8px;
            }

            .customer-order-info-card {
              padding: 14px;
            }

            .customer-order-info-card strong {
              font-size: 0.95rem;
            }

            .customer-confirmation-items-header {
              align-items: flex-start;
              flex-direction: column;
            }

            .customer-receipt-item {
              gap: 10px;
            }

            /* Session modal */

            .customer-session-modal-content {
              padding: 24px;
              border-radius: 14px;
            }

            .customer-session-modal-content h2 {
              font-size: 1.35rem;
            }

            .customer-session-modal-buttons {
              flex-direction: column;
            }

            .customer-session-modal-buttons button {
              width: 100%;
            }
          }

          /* =================================================
             VERY SMALL PHONES
          ================================================= */

          @media (max-width: 380px) {

            .customer-menu-header-inner,
            .customer-menu-main {
              padding-left: 12px;
              padding-right: 12px;
            }

            .customer-menu-header h1 {
              font-size: 1.5rem;
            }

            .customer-menu-image {
              height: 165px;
            }

            .customer-menu-card-top {
              flex-direction: column;
            }

            .customer-menu-price {
              align-self: flex-start;
            }

            .customer-cart-item-main {
              gap: 8px;
            }

            .customer-quantity-row button {
              width: 30px;
              height: 30px;
            }

            .customer-order-info-grid {
              grid-template-columns: 1fr;
            }

            .customer-receipt-item {
              flex-direction: column;
              gap: 6px;
            }

            .customer-receipt-item-price {
              align-self: flex-end;
            }

            .customer-session-modal-content {
              padding: 20px;
            }
          }
        `}
      </style>

      {/* =================================================
          SESSION CODE MODAL
      ================================================= */}

      {showSessionCodeModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            background:
              "rgba(0, 0, 0, 0.78)",
            backdropFilter:
              "blur(8px)",
          }}
        >
          <div className="customer-session-modal-content">

            <span className="eyebrow">
              ACTIVE SESSION
            </span>

            <h2
              style={{
                marginTop: "10px",
                marginBottom: "10px",
              }}
            >
              Enter Session Code
            </h2>

            <p
              style={{
                color:
                  "var(--text-muted)",
                lineHeight: 1.6,
                marginBottom: "25px",
              }}
            >
              This table already has an active
              order. Enter the 4-digit session code
              provided with your previous order.
            </p>

            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              autoFocus
              value={sessionCodeInput}
              onChange={(event) => {
                const value =
                  event.target.value
                    .replace(/\D/g, "")
                    .slice(0, 4);

                setSessionCodeInput(value);
                setSessionCodeError("");
              }}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  sessionCodeInput.length === 4
                ) {
                  submitWithSessionCode();
                }
              }}
              placeholder="4-digit code"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "15px",
                fontSize: "1.5rem",
                letterSpacing: "0.5rem",
                textAlign: "center",
                color:
                  "var(--text-heading)",
                background: "#181411",
                border:
                  "1px solid var(--accent-border)",
                borderRadius: "10px",
                outline: "none",
              }}
            />

            {sessionCodeError && (
              <p
                style={{
                  marginTop: "12px",
                  marginBottom: 0,
                  color: "#e98978",
                  fontSize: "0.9rem",
                }}
              >
                {sessionCodeError}
              </p>
            )}

            <div className="customer-session-modal-buttons">

              <button
                type="button"
                onClick={
                  closeSessionCodeModal
                }
                disabled={placingOrder}
                style={{
                  flex: 1,
                  padding: "13px",
                  border:
                    "1px solid var(--accent-border)",
                  borderRadius: "8px",
                  background:
                    "transparent",
                  color:
                    "var(--text-body)",
                  cursor:
                    placingOrder
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  submitWithSessionCode
                }
                disabled={
                  placingOrder ||
                  sessionCodeInput.length !== 4
                }
                className="btn btn-primary"
                style={{
                  flex: 1,
                }}
              >
                {placingOrder
                  ? "Placing..."
                  : "Continue"}
              </button>

            </div>
          </div>
        </div>
      )}

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="customer-menu-header">

        <div className="container customer-menu-header-inner">

          <div>

            <span className="eyebrow">
              Restaurant
            </span>

            <h1>
              Our Menu
            </h1>

            {table && (
              <p className="customer-table-info">
                Table {table.tableNumber}
                {" · "}
                Seats {table.capacity}
                {" · "}
                {table.location}
              </p>
            )}

          </div>

          <div className="customer-cart-summary">

            <span>
              🛒 {cartCount}
            </span>

            <strong>
              ₹{cartTotal.toFixed(2)}
            </strong>

          </div>

        </div>

      </header>

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="container customer-menu-main">

        {error && (
          <div className="customer-menu-alert">
            {error}
          </div>
        )}

        {/* =================================================
            ORDER CONFIRMATION
        ================================================= */}

        {orderSuccess && (
          <section className="customer-order-confirmation">

            <div className="customer-confirmation-top">

              <div className="customer-success-icon">
                ✓
              </div>

              <div>

                <span className="eyebrow">
                  ORDER PLACED
                </span>

                <h2>
                  Thank you for your order!
                </h2>

                <p>
                  Your order has been sent
                  to our kitchen.
                </p>

              </div>

            </div>

            {/* ORDER INFORMATION */}

            <div className="customer-order-info-grid">

              <div className="customer-order-info-card">

                <span>
                  ORDER NUMBER
                </span>

                <strong>
                  {orderSuccess.orderNumber}
                </strong>

              </div>

              <div className="customer-order-info-card">

                <span>
                  TABLE
                </span>

                <strong>
                  {orderSuccess.tableNumber}
                </strong>

              </div>

              <div className="customer-order-info-card">

                <span>
                  STATUS
                </span>

                <strong className="customer-order-status">
                  {orderSuccess.status}
                </strong>

              </div>

              <div className="customer-order-info-card">

                <span>
                  TOTAL
                </span>

                <strong>
                  ₹
                  {Number(
                    orderSuccess.totalAmount
                  ).toFixed(2)}
                </strong>

              </div>

            </div>

            {/* SESSION CODE */}

            {orderSuccess.sessionCode && (
              <div
                className="customer-order-info-card"
                style={{
                  marginTop: "18px",
                  textAlign: "center",
                }}
              >

                <span>
                  SESSION CODE
                </span>

                <strong
                  style={{
                    display: "block",
                    marginTop: "8px",
                    fontSize: "1.8rem",
                    letterSpacing: "0.35rem",
                    color:
                      "var(--accent-secondary)",
                  }}
                >
                  {orderSuccess.sessionCode}
                </strong>

                <small
                  style={{
                    display: "block",
                    marginTop: "8px",
                    color:
                      "var(--text-muted)",
                  }}
                >
                  Keep this code to place
                  another order from this table.
                </small>

              </div>
            )}

            {/* =================================================
                RECEIPT STYLE ORDER SUMMARY
            ================================================= */}

            <div className="customer-confirmation-items">

              <div className="customer-confirmation-items-header">

                <div>

                  <span className="eyebrow">
                    ORDER SUMMARY
                  </span>

                  <h3>
                    Items Ordered
                  </h3>

                </div>

                <span>
                  {orderSuccess.items?.reduce(
                    (total, item) =>
                      total + item.quantity,
                    0
                  ) || 0}{" "}
                  items
                </span>

              </div>

              <div className="customer-receipt">

                {orderSuccess.items?.map(
                  (item) => (
                    <div
                      className="customer-receipt-item"
                      key={item.menuItemId}
                    >

                      <div className="customer-receipt-item-left">

                        <strong>
                          {item.menuItemName}
                        </strong>

                        <span>
                          ₹
                          {Number(
                            item.unitPrice
                          ).toFixed(2)}
                          {" × "}
                          {item.quantity}
                        </span>

                        {item.specialInstruction && (
                          <small>
                            Note:{" "}
                            {item.specialInstruction}
                          </small>
                        )}

                      </div>

                      <strong className="customer-receipt-item-price">
                        ₹
                        {Number(
                          item.totalPrice
                        ).toFixed(2)}
                      </strong>

                    </div>
                  )
                )}

                <div className="customer-receipt-divider" />

                <div className="customer-receipt-subtotal">

                  <span>
                    Total Items
                  </span>

                  <strong>
                    {orderSuccess.items?.reduce(
                      (total, item) =>
                        total + item.quantity,
                      0
                    ) || 0}
                  </strong>

                </div>

                <div className="customer-receipt-total">

                  <span>
                    Total Amount
                  </span>

                  <strong>
                    ₹
                    {Number(
                      orderSuccess.totalAmount
                    ).toFixed(2)}
                  </strong>

                </div>

              </div>

            </div>

            {/* NEW ORDER */}

            <button
              className="btn btn-primary customer-new-order-button"
              onClick={startNewOrder}
            >
              Continue Ordering
            </button>

          </section>
        )}

        {/* =================================================
            MENU
        ================================================= */}

        {!orderSuccess && (
          <>

            {/* =================================================
                YOUR ORDER - TOP
            ================================================= */}

            <section className="customer-cart customer-cart-top">

              <div className="customer-cart-header">

                <div>

                  <span className="eyebrow">
                    YOUR ORDER
                  </span>

                  <h2>
                    Cart
                  </h2>

                </div>

                <strong>
                  {cartCount}{" "}
                  {cartCount === 1
                    ? "item"
                    : "items"}
                </strong>

              </div>

              {cart.length === 0 ? (

                <div className="customer-cart-empty">

                  <div className="customer-cart-empty-icon">
                    🛒
                  </div>

                  <div>

                    <h3>
                      Your cart is empty
                    </h3>

                    <p>
                      Add dishes from the menu below.
                    </p>

                  </div>

                </div>

              ) : (

                <div className="customer-cart-items">

                  {cart.map(
                    (item) => (
                      <div
                        className="customer-cart-item"
                        key={item.menuItemId}
                      >

                        <div className="customer-cart-item-main">

                          <div className="customer-cart-item-info">

                            <h4>
                              {item.menuItemName}
                            </h4>

                            <span>
                              ₹
                              {Number(
                                item.unitPrice
                              ).toFixed(2)}
                              {" "}each
                            </span>

                          </div>

                          <button
                            className="customer-remove-button"
                            onClick={() =>
                              removeFromCart(
                                item.menuItemId
                              )
                            }
                            title="Remove item"
                          >
                            ×
                          </button>

                        </div>

                        <div className="customer-cart-item-bottom">

                          <div className="customer-quantity-row">

                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.menuItemId,
                                  item.quantity - 1
                                )
                              }
                            >
                              −
                            </button>

                            <span>
                              {item.quantity}
                            </span>

                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.menuItemId,
                                  item.quantity + 1
                                )
                              }
                            >
                              +
                            </button>

                          </div>

                          <strong className="customer-cart-item-total">
                            ₹
                            {(
                              Number(
                                item.unitPrice
                              ) *
                              item.quantity
                            ).toFixed(2)}
                          </strong>

                        </div>

                        <textarea
                          placeholder="Special instruction (optional)"
                          value={
                            item.specialInstruction
                          }
                          onChange={(event) =>
                            updateInstruction(
                              item.menuItemId,
                              event.target.value
                            )
                          }
                          rows={2}
                        />

                      </div>
                    )
                  )}

                </div>

              )}

              {/* CART FOOTER */}

              <div className="customer-cart-footer">

                <div className="customer-cart-total">

                  <span>
                    Total Amount
                  </span>

                  <strong>
                    ₹{cartTotal.toFixed(2)}
                  </strong>

                </div>

                <button
                  className="btn btn-primary customer-place-order"
                  onClick={placeOrder}
                  disabled={
                    cart.length === 0 ||
                    placingOrder
                  }
                >
                  {placingOrder
                    ? "Placing Order..."
                    : "Place Order"}
                </button>

              </div>

            </section>

            {/* =================================================
                CATEGORY TABS
            ================================================= */}

            <div className="customer-category-tabs">

              <button
                className={
                  activeCategory === "all"
                    ? "customer-tab active"
                    : "customer-tab"
                }
                onClick={() =>
                  setActiveCategory("all")
                }
              >
                All Dishes
              </button>

              {categories.map(
                (category) => (
                  <button
                    key={category.id}
                    className={
                      String(
                        activeCategory
                      ) ===
                      String(category.id)
                        ? "customer-tab active"
                        : "customer-tab"
                    }
                    onClick={() =>
                      setActiveCategory(
                        category.id
                      )
                    }
                  >
                    {category.name}
                  </button>
                )
              )}

            </div>

            {/* =================================================
                MENU LIST
            ================================================= */}

            <section className="customer-menu-list">

              {filteredItems.length === 0 ? (

                <div className="customer-empty-state">

                  <h3>
                    No dishes available
                  </h3>

                  <p>
                    Please check another category.
                  </p>

                </div>

              ) : (

                filteredItems.map(
                  (item) => (
                    <article
                      className="customer-menu-card"
                      key={item.id}
                    >

                      {/* IMAGE */}

                      <div className="customer-menu-image">

                        {item.imageUrl ? (

                          <img
                            src={getImageUrl(
                              item.imageUrl
                            )}
                            alt={item.name}
                            onError={(event) => {
                              event.currentTarget.style.display =
                                "none";

                              const parent =
                                event.currentTarget
                                  .parentElement;

                              if (parent) {
                                parent.innerHTML =
                                  `<div class="customer-no-image">🍽️</div>`;
                              }
                            }}
                          />

                        ) : (

                          <div className="customer-no-image">
                            🍽️
                          </div>

                        )}

                      </div>

                      {/* CONTENT */}

                      <div className="customer-menu-card-content">

                        <div className="customer-menu-card-top">

                          <div>

                            <span className="customer-menu-category">
                              {item.categoryName}
                            </span>

                            <h3>
                              {item.name}
                            </h3>

                          </div>

                          <strong className="customer-menu-price">
                            ₹
                            {Number(
                              item.price
                            ).toFixed(2)}
                          </strong>

                        </div>

                        {item.description && (
                          <p>
                            {item.description}
                          </p>
                        )}

                        <div className="customer-menu-card-bottom">

                          <span className="customer-preparation-time">
                            ⏱{" "}
                            {item.preparationTimeMinutes}
                            {" "}
                            min
                          </span>

                          <span className="customer-availability">
                            Available
                          </span>

                          <button
                            className="btn btn-primary customer-add-button"
                            onClick={() =>
                              addToCart(item)
                            }
                            disabled={
                              !item.available ||
                              !item.active
                            }
                          >
                            + Add
                          </button>

                        </div>

                      </div>

                    </article>
                  )
                )

              )}

            </section>

          </>
        )}

      </main>
    </div>
  );
}

export default CustomerMenu;