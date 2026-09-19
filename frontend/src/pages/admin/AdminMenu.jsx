import { useEffect, useMemo, useRef, useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080/api";

const BACKEND_BASE_URL =
  API_BASE_URL.replace(/\/api\/?$/, "");

function AdminMenu() {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState("");

  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [showItemModal, setShowItemModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const [editingItem, setEditingItem] = useState(null);

  const [imageMode, setImageMode] = useState("URL");
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const imageInputRef = useRef(null);

  const [itemForm, setItemForm] = useState({
    categoryId: "",
    name: "",
    description: "",
    price: "",
    imageUrl: "",
    preparationTimeMinutes: "",
  });

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    displayOrder: 0,
  });

  const token = localStorage.getItem("token");

  // =========================================================
  // HEADERS
  // =========================================================

  const getAuthHeaders = () => ({
    ...(token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}),
  });

  const getJsonHeaders = () => ({
    "Content-Type": "application/json",
    ...getAuthHeaders(),
  });

  // =========================================================
  // IMAGE URL
  // =========================================================

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) {
      return "";
    }

    if (
      imageUrl.startsWith("http://") ||
      imageUrl.startsWith("https://") ||
      imageUrl.startsWith("blob:")
    ) {
      return imageUrl;
    }

    return `${BACKEND_BASE_URL}${
      imageUrl.startsWith("/") ? "" : "/"
    }${imageUrl}`;
  };

  // =========================================================
  // LOAD MENU
  // =========================================================

  const loadMenu = async () => {
    try {
      setLoading(true);
      setError("");

      const [categoryResponse, itemResponse] =
        await Promise.all([
          fetch(
            `${API_BASE_URL}/admin/menu/categories`,
            {
              headers: getAuthHeaders(),
            }
          ),
          fetch(
            `${API_BASE_URL}/admin/menu/items`,
            {
              headers: getAuthHeaders(),
            }
          ),
        ]);

      if (!categoryResponse.ok) {
        const message =
          await categoryResponse.text();

        throw new Error(
          message ||
            "Failed to load menu categories."
        );
      }

      if (!itemResponse.ok) {
        const message =
          await itemResponse.text();

        throw new Error(
          message ||
            "Failed to load menu items."
        );
      }

      const categoryData =
        await categoryResponse.json();

      const itemData =
        await itemResponse.json();

      setCategories(categoryData);
      setItems(itemData);
    } catch (err) {
      setError(
        err.message ||
          "Failed to load menu."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenu();
  }, []);

  // =========================================================
  // FILTER
  // =========================================================

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const categoryMatch =
        categoryFilter === "ALL" ||
        String(item.categoryId) ===
          String(categoryFilter);

      let statusMatch = true;

      if (statusFilter === "AVAILABLE") {
        statusMatch =
          item.active && item.available;
      }

      if (statusFilter === "UNAVAILABLE") {
        statusMatch =
          item.active && !item.available;
      }

      if (statusFilter === "INACTIVE") {
        statusMatch = !item.active;
      }

      return categoryMatch && statusMatch;
    });
  }, [
    items,
    categoryFilter,
    statusFilter,
  ]);

  // =========================================================
  // STATS
  // =========================================================

  const activeCount = items.filter(
    (item) => item.active
  ).length;

  const availableCount = items.filter(
    (item) =>
      item.active && item.available
  ).length;

  const unavailableCount = items.filter(
    (item) =>
      item.active && !item.available
  ).length;

  const inactiveCount = items.filter(
    (item) => !item.active
  ).length;

  // =========================================================
  // IMAGE RESET
  // =========================================================

  const resetImageState = () => {
    if (imagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }

    setSelectedImageFile(null);
    setImagePreview("");

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  // =========================================================
  // CREATE ITEM
  // =========================================================

  const openCreateItemModal = () => {
    setEditingItem(null);
    resetImageState();

    setImageMode("URL");
    setError("");

    setItemForm({
      categoryId:
        categories.length > 0
          ? String(categories[0].id)
          : "",
      name: "",
      description: "",
      price: "",
      imageUrl: "",
      preparationTimeMinutes: "",
    });

    setShowItemModal(true);
  };

  // =========================================================
  // EDIT ITEM
  // =========================================================

  const openEditItemModal = (item) => {
    setEditingItem(item);
    resetImageState();

    setImageMode("URL");
    setError("");

    setItemForm({
      categoryId: item.categoryId
        ? String(item.categoryId)
        : "",
      name: item.name || "",
      description: item.description || "",
      price: item.price ?? "",
      imageUrl: item.imageUrl || "",
      preparationTimeMinutes:
        item.preparationTimeMinutes ?? "",
    });

    setShowItemModal(true);
  };

  // =========================================================
  // CLOSE ITEM MODAL
  // =========================================================

  const closeItemModal = () => {
    if (saving || uploadingImage) {
      return;
    }

    setShowItemModal(false);
    setEditingItem(null);
    resetImageState();
  };

  // =========================================================
  // ITEM CHANGE
  // =========================================================

  const handleItemChange = (event) => {
    const { name, value } = event.target;

    setItemForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =========================================================
  // CATEGORY CHANGE
  // =========================================================

  const handleCategoryChange = (event) => {
    const { name, value } = event.target;

    setCategoryForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =========================================================
  // IMAGE MODE
  // =========================================================

  const handleImageModeChange = (mode) => {
    if (saving || uploadingImage) {
      return;
    }

    setImageMode(mode);
    setSelectedImageFile(null);

    if (imagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }

    setImagePreview("");

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }

    if (mode === "UPLOAD") {
      setItemForm((previous) => ({
        ...previous,
        imageUrl: "",
      }));
    }
  };

  // =========================================================
  // SELECT IMAGE
  // =========================================================

  const handleImageFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");

    if (!file.type.startsWith("image/")) {
      setError(
        "Please select a valid image file."
      );

      event.target.value = "";
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        "Only JPG, JPEG, PNG and WEBP images are supported."
      );

      event.target.value = "";
      return;
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      setError(
        "Image size must be 5 MB or less."
      );

      event.target.value = "";
      return;
    }

    if (imagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }

    const objectUrl =
      URL.createObjectURL(file);

    setSelectedImageFile(file);
    setImagePreview(objectUrl);
  };

  // =========================================================
  // UPLOAD IMAGE
  // =========================================================

  const uploadImage = async () => {
    if (!selectedImageFile) {
      throw new Error(
        "Please select an image first."
      );
    }

    const formData = new FormData();

    formData.append(
      "file",
      selectedImageFile
    );

    setUploadingImage(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/menu/upload-image`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: formData,
        }
      );

      const responseText =
        await response.text();

      if (!response.ok) {
        throw new Error(
          `Image upload failed (${response.status})${
            responseText
              ? `: ${responseText}`
              : "."
          }`
        );
      }

      const uploadedUrl =
        responseText.trim();

      if (!uploadedUrl) {
        throw new Error(
          "Image upload succeeded, but the server returned an empty image URL."
        );
      }

      return uploadedUrl;
    } finally {
      setUploadingImage(false);
    }
  };

  // =========================================================
  // SAVE ITEM
  // =========================================================

  const handleSaveItem = async (event) => {
    event.preventDefault();

    try {
      setError("");

      if (!itemForm.categoryId) {
        throw new Error(
          "Please select a category."
        );
      }

      if (!itemForm.name.trim()) {
        throw new Error(
          "Item name is required."
        );
      }

      if (
        itemForm.price === "" ||
        Number(itemForm.price) < 0
      ) {
        throw new Error(
          "Please enter a valid price."
        );
      }

      if (
        itemForm.preparationTimeMinutes !== "" &&
        Number(
          itemForm.preparationTimeMinutes
        ) < 0
      ) {
        throw new Error(
          "Preparation time cannot be negative."
        );
      }

      if (
        imageMode === "UPLOAD" &&
        !selectedImageFile &&
        !editingItem?.imageUrl
      ) {
        throw new Error(
          "Please select an image to upload."
        );
      }

      setSaving(true);

      let finalImageUrl = null;

      if (imageMode === "URL") {
        finalImageUrl =
          itemForm.imageUrl.trim() || null;
      }

      if (imageMode === "UPLOAD") {
        if (selectedImageFile) {
          finalImageUrl =
            await uploadImage();
        } else if (editingItem?.imageUrl) {
          finalImageUrl =
            editingItem.imageUrl;
        } else {
          throw new Error(
            "Please select an image to upload."
          );
        }
      }

      const payload = {
        categoryId:
          Number(itemForm.categoryId),

        name:
          itemForm.name.trim(),

        description:
          itemForm.description.trim(),

        price:
          Number(itemForm.price),

        imageUrl:
          finalImageUrl,

        preparationTimeMinutes:
          itemForm.preparationTimeMinutes === ""
            ? null
            : Number(
                itemForm.preparationTimeMinutes
              ),
      };

      const url = editingItem
        ? `${API_BASE_URL}/admin/menu/items/${editingItem.id}`
        : `${API_BASE_URL}/admin/menu/items`;

      const response = await fetch(url, {
        method: editingItem
          ? "PUT"
          : "POST",

        headers: getJsonHeaders(),

        body: JSON.stringify(payload),
      });

      const responseText =
        await response.text();

      if (!response.ok) {
        throw new Error(
          responseText ||
            "Failed to save menu item."
        );
      }

      await loadMenu();

      setShowItemModal(false);
      setEditingItem(null);
      resetImageState();
    } catch (err) {
      setError(
        err.message ||
          "Failed to save menu item."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // CREATE CATEGORY
  // =========================================================

  const handleCreateCategory = async (
    event
  ) => {
    event.preventDefault();

    try {
      setError("");

      if (!categoryForm.name.trim()) {
        throw new Error(
          "Category name is required."
        );
      }

      const payload = {
        name:
          categoryForm.name.trim(),

        description:
          categoryForm.description.trim(),

        displayOrder:
          Number(
            categoryForm.displayOrder
          ) || 0,
      };

      const response = await fetch(
        `${API_BASE_URL}/admin/menu/categories`,
        {
          method: "POST",
          headers: getJsonHeaders(),
          body: JSON.stringify(payload),
        }
      );

      const responseText =
        await response.text();

      if (!response.ok) {
        throw new Error(
          responseText ||
            "Failed to create category."
        );
      }

      setCategoryForm({
        name: "",
        description: "",
        displayOrder: 0,
      });

      setShowCategoryModal(false);

      await loadMenu();
    } catch (err) {
      setError(
        err.message ||
          "Failed to create category."
      );
    }
  };

  // =========================================================
  // CHANGE AVAILABILITY
  // =========================================================

  const changeAvailability = async (
    item
  ) => {
    try {
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/admin/menu/items/${item.id}/availability?available=${!item.available}`,
        {
          method: "PATCH",
          headers: getAuthHeaders(),
        }
      );

      const responseText =
        await response.text();

      if (!response.ok) {
        throw new Error(
          responseText ||
            "Failed to change availability."
        );
      }

      await loadMenu();
    } catch (err) {
      setError(
        err.message ||
          "Failed to change availability."
      );
    }
  };

  // =========================================================
  // CHANGE ACTIVE STATUS
  // =========================================================

  const changeActiveStatus = async (
    item
  ) => {
    try {
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/admin/menu/items/${item.id}/active?active=${!item.active}`,
        {
          method: "PATCH",
          headers: getAuthHeaders(),
        }
      );

      const responseText =
        await response.text();

      if (!response.ok) {
        throw new Error(
          responseText ||
            "Failed to change active status."
        );
      }

      await loadMenu();
    } catch (err) {
      setError(
        err.message ||
          "Failed to change active status."
      );
    }
  };

  // =========================================================
  // ARCHIVE
  // =========================================================

  const archiveItem = async (item) => {
    const confirmed =
      window.confirm(
        `Archive "${item.name}"?\n\nThe item will no longer be active.`
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/admin/menu/items/${item.id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      const responseText =
        await response.text();

      if (!response.ok) {
        throw new Error(
          responseText ||
            "Failed to archive menu item."
        );
      }

      await loadMenu();
    } catch (err) {
      setError(
        err.message ||
          "Failed to archive menu item."
      );
    }
  };

  // =========================================================
  // RESTORE
  // =========================================================

  const restoreItem = async (item) => {
    try {
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/admin/menu/items/${item.id}/restore`,
        {
          method: "PATCH",
          headers: getAuthHeaders(),
        }
      );

      const responseText =
        await response.text();

      if (!response.ok) {
        throw new Error(
          responseText ||
            "Failed to restore menu item."
        );
      }

      await loadMenu();
    } catch (err) {
      setError(
        err.message ||
          "Failed to restore menu item."
      );
    }
  };

  return (
    <div className="admin-menu-page">
      <style>{`
        .admin-menu-page,
        .admin-menu-page * {
          box-sizing: border-box;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif !important;
        }

        .admin-menu-page {
          width: 100%;
          min-height: 100%;
          padding: 30px;
          background: #f3efe8 !important;
          color: #2c241e !important;
        }

        .admin-menu-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 24px;
          margin-bottom: 28px;
        }

        .admin-menu-title h1 {
          margin: 0 !important;
          color: #2b211b !important;
          font-size: 30px !important;
          line-height: 1.2 !important;
          font-weight: 700 !important;
          letter-spacing: -0.02em;
        }

        .admin-menu-title p {
          margin: 8px 0 0 !important;
          color: #776c61 !important;
          font-size: 14px !important;
        }

        .admin-menu-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .menu-btn {
          min-height: 42px;
          padding: 0 16px;
          border-radius: 10px;
          font-size: 13px !important;
          font-weight: 600 !important;
          cursor: pointer;
          transition: all 0.18s ease;
        }

        .menu-btn:hover {
          transform: translateY(-1px);
        }

        .menu-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .menu-btn-primary {
          border: 1px solid #30251e !important;
          background: #30251e !important;
          color: #fffaf3 !important;
        }

        .menu-btn-primary:hover {
          background: #46372d !important;
        }

        .menu-btn-secondary {
          border: 1px solid #d3c8ba !important;
          background: #fffaf3 !important;
          color: #30251e !important;
        }

        .menu-btn-secondary:hover {
          background: #eee5d9 !important;
        }

        .menu-btn-danger {
          border: 1px solid #e5bcbc !important;
          background: #fff0ee !important;
          color: #b52c25 !important;
        }

        .menu-btn-danger:hover {
          background: #fbe1de !important;
        }

        .menu-btn-success {
          border: 1px solid #bdd9c2 !important;
          background: #edf7ef !important;
          color: #28733b !important;
        }

        .menu-btn-success:hover {
          background: #deefe1 !important;
        }

        .menu-btn-small {
          min-height: 32px;
          padding: 0 10px;
          font-size: 11px !important;
          white-space: nowrap;
        }

        .menu-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 18px;
          margin-bottom: 22px;
        }

        .menu-stat {
          position: relative;
          overflow: hidden;
          padding: 21px 22px;
          background: #fffaf3 !important;
          border: 1px solid #ded2c4 !important;
          border-radius: 15px;
          box-shadow: 0 3px 12px rgba(63, 48, 35, 0.05);
        }

        .menu-stat::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          top: 0;
          height: 3px;
          background: #b1844e;
        }

        .menu-stat-label {
          margin-bottom: 10px;
          color: #7b7064 !important;
          font-size: 12px !important;
          font-weight: 600 !important;
        }

        .menu-stat-value {
          color: #2a211b !important;
          font-size: 28px !important;
          font-weight: 700 !important;
        }

        .menu-filters {
          display: flex;
          align-items: center;
          gap: 24px;
          min-height: 82px;
          padding: 16px 20px;
          margin-bottom: 22px;
          background: #fffaf3 !important;
          border: 1px solid #ded2c4 !important;
          border-radius: 15px;
          box-shadow: 0 3px 12px rgba(63, 48, 35, 0.04);
        }

        .menu-filter-group {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .menu-filter-group label {
          color: #493c32 !important;
          font-size: 13px !important;
          font-weight: 700 !important;
        }

        .menu-select {
          min-width: 190px;
          height: 44px;
          padding: 0 13px;
          border: 1px solid #d3c8ba !important;
          border-radius: 10px;
          background: #fdf9f2 !important;
          color: #40342b !important;
          font-size: 13px !important;
          outline: none;
        }

        .menu-select:focus {
          border-color: #a47a4b !important;
          box-shadow: 0 0 0 3px rgba(164, 122, 75, 0.12);
        }

        .menu-items-card {
          overflow: hidden;
          background: #fffaf3 !important;
          border: 1px solid #ded2c4 !important;
          border-radius: 15px;
          box-shadow: 0 3px 14px rgba(63, 48, 35, 0.05);
        }

        .menu-items-card-header {
          min-height: 72px;
          padding: 18px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #f1e8dc !important;
          border-bottom: 1px solid #d9ccbd !important;
        }

        .menu-items-card-header h2 {
          margin: 0 !important;
          color: #30251e !important;
          font-size: 17px !important;
          font-weight: 700 !important;
        }

        .menu-items-count {
          color: #75695c !important;
          font-size: 13px !important;
          font-weight: 600 !important;
        }

        .menu-table-wrap {
          width: 100%;
          overflow-x: auto;
        }

        .menu-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: auto;
        }

        .menu-table th {
          padding: 15px 14px;
          background: #e8ded1 !important;
          color: #55483d !important;
          border-bottom: 1px solid #d6c8b8 !important;
          text-align: left;
          font-size: 11px !important;
          font-weight: 800 !important;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .menu-table td {
          padding: 15px 14px;
          background: #fffaf3 !important;
          color: #40352c !important;
          border-bottom: 1px solid #eee4d8 !important;
          font-size: 13px !important;
          vertical-align: middle;
        }

        .menu-table tbody tr:hover td {
          background: #f7efe5 !important;
        }

        .menu-table tbody tr:last-child td {
          border-bottom: none !important;
        }

        .menu-item-info {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 235px;
        }

        .menu-item-image,
        .menu-item-image-placeholder {
          width: 62px;
          height: 62px;
          flex-shrink: 0;
          border-radius: 10px;
        }

        .menu-item-image {
          object-fit: cover;
          background: #eadfd1 !important;
          border: 1px solid #d9ccbd !important;
        }

        .menu-item-image-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #eadfd1 !important;
          border: 1px solid #d9ccbd !important;
          color: #8a7d70 !important;
          font-size: 11px !important;
          font-weight: 600 !important;
        }

        .menu-item-name {
          margin-bottom: 5px;
          color: #241c17 !important;
          font-size: 14px !important;
          font-weight: 700 !important;
        }

        .menu-item-description {
          max-width: 240px;
          overflow: hidden;
          color: #786c61 !important;
          font-size: 12px !important;
          line-height: 1.45;
          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .menu-category-badge {
          display: inline-flex;
          align-items: center;
          min-height: 34px;
          padding: 0 10px;
          border: 1px solid #d9cbbb !important;
          border-radius: 9px;
          background: #eee5d9 !important;
          color: #493b30 !important;
          font-size: 12px !important;
          font-weight: 700 !important;
        }

        .menu-price {
          color: #352920 !important;
          font-size: 13px !important;
          font-weight: 700 !important;
          white-space: nowrap;
        }

        .menu-prep-time {
          color: #685b50 !important;
          font-size: 13px !important;
          white-space: nowrap;
        }

        .menu-status {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 32px;
          padding: 0 10px;
          border-radius: 999px;
          font-size: 10px !important;
          font-weight: 800 !important;
          white-space: nowrap;
        }

        .menu-status-available {
          background: #e4f3e7 !important;
          color: #2c7438 !important;
        }

        .menu-status-unavailable {
          background: #fcefdc !important;
          color: #a56600 !important;
        }

        .menu-status-inactive {
          background: #e8e3dd !important;
          color: #71675e !important;
        }

        .menu-actions-cell {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
          width: 100%;
          max-width: 300px;
        }

        .menu-error {
          margin-bottom: 20px;
          padding: 13px 15px;
          border: 1px solid #e2bcbc !important;
          border-radius: 10px;
          background: #fff0ee !important;
          color: #a72a24 !important;
          font-size: 13px !important;
          font-weight: 600 !important;
        }

        .menu-loading,
        .menu-empty {
          padding: 60px 20px;
          background: #fffaf3 !important;
          color: #766a5f !important;
          text-align: center;
          font-size: 14px !important;
        }

        .menu-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(38, 28, 21, 0.58);
        }

        .menu-modal {
          width: min(650px, 100%);
          max-height: 90vh;
          overflow-y: auto;
          border: 1px solid #d8cabb;
          border-radius: 16px;
          background: #fffaf3 !important;
          box-shadow: 0 25px 80px rgba(35, 25, 18, 0.25);
        }

        .menu-modal-header {
          min-height: 68px;
          padding: 18px 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #f1e8dc !important;
          border-bottom: 1px solid #d9ccbd !important;
        }

        .menu-modal-header h3 {
          margin: 0 !important;
          color: #2e241d !important;
          font-size: 18px !important;
          font-weight: 700 !important;
        }

        .menu-modal-close {
          width: 34px;
          height: 34px;
          border: 1px solid #d5c9bb !important;
          border-radius: 8px;
          background: #fffaf3 !important;
          color: #493c32 !important;
          font-size: 18px !important;
          cursor: pointer;
        }

        .menu-form {
          padding: 22px;
          background: #fffaf3 !important;
        }

        .menu-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .menu-form-field {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .menu-form-field.full {
          grid-column: 1 / -1;
        }

        .menu-form-field label {
          color: #493c32 !important;
          font-size: 12px !important;
          font-weight: 700 !important;
        }

        .menu-input,
        .menu-textarea {
          width: 100%;
          border: 1px solid #d4c8bb !important;
          border-radius: 9px;
          background: #fdf9f2 !important;
          color: #2f261f !important;
          font-size: 13px !important;
          outline: none;
        }

        .menu-input {
          height: 44px;
          padding: 0 12px;
        }

        .menu-textarea {
          min-height: 100px;
          padding: 11px 12px;
          resize: vertical;
        }

        .menu-input::placeholder,
        .menu-textarea::placeholder {
          color: #a09386 !important;
        }

        .menu-input:focus,
        .menu-textarea:focus {
          border-color: #a47a4b !important;
          box-shadow: 0 0 0 3px rgba(164, 122, 75, 0.12);
        }

        .menu-image-source {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .menu-image-mode {
          min-height: 48px;
          padding: 0 14px;
          border: 1px solid #d5c8ba !important;
          border-radius: 10px;
          background: #fdf9f2 !important;
          color: #5b4c40 !important;
          font-size: 13px !important;
          font-weight: 700 !important;
          cursor: pointer;
        }

        .menu-image-mode.active {
          border-color: #8e683f !important;
          background: #eadbc9 !important;
          color: #30251e !important;
        }

        .menu-upload-box {
          margin-top: 10px;
          padding: 16px;
          border: 1px dashed #c8b9a8 !important;
          border-radius: 11px;
          background: #f8f0e6 !important;
        }

        .menu-upload-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .menu-upload-label {
          color: #57483d !important;
          font-size: 12px !important;
          font-weight: 600 !important;
        }

        .menu-upload-help {
          margin-top: 8px;
          color: #85776a !important;
          font-size: 11px !important;
          line-height: 1.45;
        }

        .menu-image-preview,
        .menu-image-url-preview {
          width: 110px;
          height: 110px;
          margin-top: 14px;
          border-radius: 10px;
          object-fit: cover;
          border: 1px solid #d5c8ba !important;
          background: #eadfd1 !important;
        }

        .menu-upload-file-name {
          margin-top: 8px;
          color: #5f5146 !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          word-break: break-word;
        }

        .menu-form-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 22px;
          padding-top: 18px;
          border-top: 1px solid #dfd2c4 !important;
        }

        @media (max-width: 1100px) {
          .menu-stats {
            grid-template-columns: repeat(
              2,
              minmax(0, 1fr)
            );
          }
        }

        @media (max-width: 760px) {
          .admin-menu-page {
            padding: 20px;
          }

          .admin-menu-header {
            flex-direction: column;
          }

          .admin-menu-actions {
            width: 100%;
          }

          .menu-stats {
            grid-template-columns: 1fr;
          }

          .menu-filters {
            align-items: flex-start;
            flex-direction: column;
          }

          .menu-filter-group {
            width: 100%;
            flex-direction: column;
            align-items: flex-start;
          }

          .menu-select {
            width: 100%;
          }

          .menu-form-grid {
            grid-template-columns: 1fr;
          }

          .menu-form-field.full {
            grid-column: auto;
          }

          .menu-image-source {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="admin-menu-header">
        <div className="admin-menu-title">
          <h1>Menu Management</h1>

          <p>
            Create, edit and manage your restaurant menu.
          </p>
        </div>

        <div className="admin-menu-actions">
          <button
            className="menu-btn menu-btn-secondary"
            onClick={() =>
              setShowCategoryModal(true)
            }
          >
            + Category
          </button>

          <button
            className="menu-btn menu-btn-primary"
            onClick={openCreateItemModal}
            disabled={
              categories.length === 0
            }
          >
            + Menu Item
          </button>

          <button
            className="menu-btn menu-btn-secondary"
            onClick={loadMenu}
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="menu-error">
          {error}
        </div>
      )}

      <div className="menu-stats">
        <div className="menu-stat">
          <div className="menu-stat-label">
            Total Items
          </div>

          <div className="menu-stat-value">
            {items.length}
          </div>
        </div>

        <div className="menu-stat">
          <div className="menu-stat-label">
            Active
          </div>

          <div className="menu-stat-value">
            {activeCount}
          </div>
        </div>

        <div className="menu-stat">
          <div className="menu-stat-label">
            Available
          </div>

          <div className="menu-stat-value">
            {availableCount}
          </div>
        </div>

        <div className="menu-stat">
          <div className="menu-stat-label">
            Unavailable / Inactive
          </div>

          <div className="menu-stat-value">
            {unavailableCount +
              inactiveCount}
          </div>
        </div>
      </div>

      <div className="menu-filters">
        <div className="menu-filter-group">
          <label>Category</label>

          <select
            className="menu-select"
            value={categoryFilter}
            onChange={(event) =>
              setCategoryFilter(
                event.target.value
              )
            }
          >
            <option value="ALL">
              All Categories
            </option>

            {categories.map((category) => (
              <option
                key={category.id}
                value={category.id}
              >
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="menu-filter-group">
          <label>Status</label>

          <select
            className="menu-select"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
          >
            <option value="ALL">
              All
            </option>

            <option value="AVAILABLE">
              Available
            </option>

            <option value="UNAVAILABLE">
              Unavailable
            </option>

            <option value="INACTIVE">
              Inactive
            </option>
          </select>
        </div>
      </div>

      <div className="menu-items-card">
        <div className="menu-items-card-header">
          <h2>Menu Items</h2>

          <span className="menu-items-count">
            Showing {filteredItems.length} of{" "}
            {items.length}
          </span>
        </div>

        {loading ? (
          <div className="menu-loading">
            Loading menu...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="menu-empty">
            No menu items found.
          </div>
        ) : (
          <div className="menu-table-wrap">
            <table className="menu-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Prep Time</th>
                  <th>Availability</th>
                  <th>Active</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="menu-item-info">
                        {item.imageUrl ? (
                          <img
                            src={getImageUrl(
                              item.imageUrl
                            )}
                            alt={item.name}
                            className="menu-item-image"
                            onError={(event) => {
                              event.currentTarget.style.display =
                                "none";
                            }}
                          />
                        ) : (
                          <div className="menu-item-image-placeholder">
                            No Image
                          </div>
                        )}

                        <div>
                          <div className="menu-item-name">
                            {item.name}
                          </div>

                          <div className="menu-item-description">
                            {item.description ||
                              "No description"}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="menu-category-badge">
                        {item.categoryName ||
                          "Uncategorized"}
                      </span>
                    </td>

                    <td>
                      <div className="menu-price">
                        ₹
                        {Number(
                          item.price || 0
                        ).toFixed(2)}
                      </div>
                    </td>

                    <td>
                      <div className="menu-prep-time">
                        {item.preparationTimeMinutes !=
                        null
                          ? `${item.preparationTimeMinutes} min`
                          : "-"}
                      </div>
                    </td>

                    <td>
                      {item.active ? (
                        item.available ? (
                          <span className="menu-status menu-status-available">
                            AVAILABLE
                          </span>
                        ) : (
                          <span className="menu-status menu-status-unavailable">
                            UNAVAILABLE
                          </span>
                        )
                      ) : (
                        <span className="menu-status menu-status-inactive">
                          INACTIVE
                        </span>
                      )}
                    </td>

                    <td>
                      <span
                        className={`menu-status ${
                          item.active
                            ? "menu-status-available"
                            : "menu-status-inactive"
                        }`}
                      >
                        {item.active
                          ? "ACTIVE"
                          : "INACTIVE"}
                      </span>
                    </td>

                    <td>
                      <div className="menu-actions-cell">
                        <button
                          className="menu-btn menu-btn-secondary menu-btn-small"
                          onClick={() =>
                            openEditItemModal(item)
                          }
                        >
                          Edit
                        </button>

                        <button
                          className={`menu-btn menu-btn-small ${
                            item.available
                              ? "menu-btn-danger"
                              : "menu-btn-success"
                          }`}
                          onClick={() =>
                            changeAvailability(item)
                          }
                        >
                          {item.available
                            ? "Make Unavailable"
                            : "Make Available"}
                        </button>

                        <button
                          className={`menu-btn menu-btn-small ${
                            item.active
                              ? "menu-btn-danger"
                              : "menu-btn-success"
                          }`}
                          onClick={() =>
                            changeActiveStatus(item)
                          }
                        >
                          {item.active
                            ? "Deactivate"
                            : "Activate"}
                        </button>

                        {item.active ? (
                          <button
                            className="menu-btn menu-btn-danger menu-btn-small"
                            onClick={() =>
                              archiveItem(item)
                            }
                          >
                            Archive
                          </button>
                        ) : (
                          <button
                            className="menu-btn menu-btn-success menu-btn-small"
                            onClick={() =>
                              restoreItem(item)
                            }
                          >
                            Restore
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showItemModal && (
        <div
          className="menu-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeItemModal();
            }
          }}
        >
          <div className="menu-modal">
            <div className="menu-modal-header">
              <h3>
                {editingItem
                  ? "Edit Menu Item"
                  : "Create Menu Item"}
              </h3>

              <button
                className="menu-modal-close"
                onClick={closeItemModal}
                disabled={
                  saving ||
                  uploadingImage
                }
              >
                ×
              </button>
            </div>

            <form
              className="menu-form"
              onSubmit={handleSaveItem}
            >
              <div className="menu-form-grid">
                <div className="menu-form-field">
                  <label>Category *</label>

                  <select
                    className="menu-select"
                    name="categoryId"
                    value={
                      itemForm.categoryId
                    }
                    onChange={
                      handleItemChange
                    }
                    required
                  >
                    <option value="">
                      Select category
                    </option>

                    {categories.map(
                      (category) => (
                        <option
                          key={category.id}
                          value={category.id}
                        >
                          {category.name}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="menu-form-field">
                  <label>Item Name *</label>

                  <input
                    className="menu-input"
                    name="name"
                    value={itemForm.name}
                    onChange={
                      handleItemChange
                    }
                    placeholder="e.g. Paneer Tikka"
                    required
                  />
                </div>

                <div className="menu-form-field full">
                  <label>Description</label>

                  <textarea
                    className="menu-textarea"
                    name="description"
                    value={
                      itemForm.description
                    }
                    onChange={
                      handleItemChange
                    }
                    placeholder="Describe the dish..."
                  />
                </div>

                <div className="menu-form-field">
                  <label>Price *</label>

                  <input
                    className="menu-input"
                    type="number"
                    min="0"
                    step="0.01"
                    name="price"
                    value={itemForm.price}
                    onChange={
                      handleItemChange
                    }
                    placeholder="210.00"
                    required
                  />
                </div>

                <div className="menu-form-field">
                  <label>
                    Preparation Time (minutes)
                  </label>

                  <input
                    className="menu-input"
                    type="number"
                    min="0"
                    name="preparationTimeMinutes"
                    value={
                      itemForm.preparationTimeMinutes
                    }
                    onChange={
                      handleItemChange
                    }
                    placeholder="15"
                  />
                </div>

                <div className="menu-form-field full">
                  <label>Item Image</label>

                  <div className="menu-image-source">
                    <button
                      type="button"
                      className={`menu-image-mode ${
                        imageMode === "URL"
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        handleImageModeChange(
                          "URL"
                        )
                      }
                      disabled={
                        saving ||
                        uploadingImage
                      }
                    >
                      Image URL
                    </button>

                    <button
                      type="button"
                      className={`menu-image-mode ${
                        imageMode === "UPLOAD"
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        handleImageModeChange(
                          "UPLOAD"
                        )
                      }
                      disabled={
                        saving ||
                        uploadingImage
                      }
                    >
                      Upload Image
                    </button>
                  </div>

                  {imageMode === "URL" && (
                    <>
                      <input
                        className="menu-input"
                        type="url"
                        name="imageUrl"
                        value={
                          itemForm.imageUrl
                        }
                        onChange={
                          handleItemChange
                        }
                        placeholder="https://example.com/momos.jpg"
                      />

                      {itemForm.imageUrl && (
                        <img
                          src={getImageUrl(
                            itemForm.imageUrl
                          )}
                          alt="Preview"
                          className="menu-image-url-preview"
                          onError={(event) => {
                            event.currentTarget.style.display =
                              "none";
                          }}
                        />
                      )}

                      <div className="menu-upload-help">
                        Use a public image URL.
                        This mode does not upload
                        anything to your server.
                      </div>
                    </>
                  )}

                  {imageMode === "UPLOAD" && (
                    <div className="menu-upload-box">
                      <div className="menu-upload-row">
                        <div className="menu-upload-label">
                          Select menu item image
                        </div>

                        <button
                          type="button"
                          className="menu-btn menu-btn-secondary menu-btn-small"
                          onClick={() =>
                            imageInputRef.current?.click()
                          }
                          disabled={
                            saving ||
                            uploadingImage
                          }
                        >
                          Choose Image
                        </button>
                      </div>

                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={
                          handleImageFileChange
                        }
                        style={{
                          display: "none",
                        }}
                      />

                      <div className="menu-upload-help">
                        JPG, JPEG, PNG or WEBP.
                        Maximum size: 5 MB.
                      </div>

                      {selectedImageFile && (
                        <>
                          <div className="menu-upload-file-name">
                            {
                              selectedImageFile.name
                            }
                          </div>

                          {imagePreview && (
                            <img
                              src={imagePreview}
                              alt="Selected image preview"
                              className="menu-image-preview"
                            />
                          )}

                          <div className="menu-upload-help">
                            The image will first
                            be uploaded to the
                            backend and the returned
                            image path will be saved
                            in the menu item.
                          </div>
                        </>
                      )}

                      {!selectedImageFile &&
                        editingItem?.imageUrl && (
                          <>
                            <div className="menu-upload-help">
                              Current image:
                            </div>

                            <img
                              src={getImageUrl(
                                editingItem.imageUrl
                              )}
                              alt="Current menu item"
                              className="menu-image-preview"
                            />

                            <div className="menu-upload-help">
                              Choose a new image to
                              replace the current one.
                            </div>
                          </>
                        )}

                      {!selectedImageFile &&
                        !editingItem?.imageUrl && (
                          <div className="menu-upload-help">
                            Choose an image to upload.
                          </div>
                        )}
                    </div>
                  )}
                </div>
              </div>

              <div className="menu-form-actions">
                <button
                  type="button"
                  className="menu-btn menu-btn-secondary"
                  onClick={closeItemModal}
                  disabled={
                    saving ||
                    uploadingImage
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="menu-btn menu-btn-primary"
                  disabled={
                    saving ||
                    uploadingImage
                  }
                >
                  {uploadingImage
                    ? "Uploading Image..."
                    : saving
                    ? "Saving..."
                    : editingItem
                    ? "Update Item"
                    : "Create Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCategoryModal && (
        <div
          className="menu-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setShowCategoryModal(false);
            }
          }}
        >
          <div className="menu-modal">
            <div className="menu-modal-header">
              <h3>
                Create Menu Category
              </h3>

              <button
                className="menu-modal-close"
                onClick={() =>
                  setShowCategoryModal(false)
                }
              >
                ×
              </button>
            </div>

            <form
              className="menu-form"
              onSubmit={
                handleCreateCategory
              }
            >
              <div className="menu-form-grid">
                <div className="menu-form-field full">
                  <label>
                    Category Name *
                  </label>

                  <input
                    className="menu-input"
                    name="name"
                    value={
                      categoryForm.name
                    }
                    onChange={
                      handleCategoryChange
                    }
                    placeholder="e.g. Tibetan Specials"
                    required
                  />
                </div>

                <div className="menu-form-field full">
                  <label>
                    Description
                  </label>

                  <textarea
                    className="menu-textarea"
                    name="description"
                    value={
                      categoryForm.description
                    }
                    onChange={
                      handleCategoryChange
                    }
                    placeholder="Category description..."
                  />
                </div>

                <div className="menu-form-field">
                  <label>
                    Display Order
                  </label>

                  <input
                    className="menu-input"
                    type="number"
                    min="0"
                    name="displayOrder"
                    value={
                      categoryForm.displayOrder
                    }
                    onChange={
                      handleCategoryChange
                    }
                  />
                </div>
              </div>

              <div className="menu-form-actions">
                <button
                  type="button"
                  className="menu-btn menu-btn-secondary"
                  onClick={() =>
                    setShowCategoryModal(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="menu-btn menu-btn-primary"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminMenu;