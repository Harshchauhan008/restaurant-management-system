import { useEffect, useMemo, useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080/api";

function EmployeeManagement() {

  // =====================================================
  // EMPLOYEE DATA
  // =====================================================

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =====================================================
  // MANAGE EMPLOYEE MODAL
  // =====================================================

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showManageModal, setShowManageModal] = useState(false);

  // =====================================================
  // EDIT EMPLOYEE FORM
  // =====================================================

  const [employeeId, setEmployeeId] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [active, setActive] = useState(true);
  const [savingEmployee, setSavingEmployee] = useState(false);

  // =====================================================
  // PASSWORD FORM
  // =====================================================

  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  // =====================================================
  // GET ADMIN TOKEN
  // =====================================================

  const getToken = () => {
    return localStorage.getItem("adminToken") || "";
  };

  // =====================================================
  // LOAD EMPLOYEES
  // =====================================================

  const loadEmployees = async () => {

    try {

      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        throw new Error(
          "Admin login session not found. Please login again."
        );
      }

      const response = await fetch(
        `${API_BASE_URL}/admin/employees`,
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
            "You do not have permission to manage employees."
          );
        }

        throw new Error(
          data?.message ||
          data?.error ||
          `Failed to load employees (${response.status})`
        );
      }

      setEmployees(
        Array.isArray(data)
          ? data
          : []
      );

    } catch (err) {

      setError(
        err.message ||
        "Unable to load employees."
      );

    } finally {

      setLoading(false);

    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    loadEmployees();
  }, []);

  // =====================================================
  // STATISTICS
  // =====================================================

  const totalEmployees =
    employees.length;

  const activeEmployees =
    employees.filter(
      (employee) =>
        employee.active === true
    ).length;

  const inactiveEmployees =
    employees.filter(
      (employee) =>
        employee.active === false
    ).length;

  const kitchenEmployees =
    employees.filter(
      (employee) =>
        employee.role === "KITCHEN"
    ).length;

  const waiterEmployees =
    employees.filter(
      (employee) =>
        employee.role === "WAITER"
    ).length;

  const cashierEmployees =
    employees.filter(
      (employee) =>
        employee.role === "CASHIER"
    ).length;

  const receptionistEmployees =
    employees.filter(
      (employee) =>
        employee.role === "RECEPTIONIST"
    ).length;

  const otherEmployees =
    useMemo(() => {

      return employees.filter(
        (employee) =>
          ![
            "KITCHEN",
            "WAITER",
            "CASHIER",
            "RECEPTIONIST",
          ].includes(employee.role)
      ).length;

    }, [employees]);

  // =====================================================
  // FORMAT ROLE
  // =====================================================

  const formatRole = (role) => {

    if (!role) {
      return "N/A";
    }

    if (role === "RECEPTIONIST") {
      return "Receptionist";
    }

    return (
      role.charAt(0) +
      role.slice(1).toLowerCase()
    );
  };

  // =====================================================
  // OPEN MANAGE MODAL
  // =====================================================

  const openManageModal = (employee) => {

    setSelectedEmployee(employee);

    setEmployeeId(
      employee.employeeId || ""
    );

    setFullName(
      employee.fullName || ""
    );

    setEmail(
      employee.email || ""
    );

    setRole(
      employee.role || ""
    );

    setActive(
      employee.active === true
    );

    setNewPassword("");
    setShowPassword(false);

    setError("");
    setSuccess("");

    setShowManageModal(true);
  };

  // =====================================================
  // CLOSE MANAGE MODAL
  // =====================================================

  const closeManageModal = () => {

    if (
      savingEmployee ||
      resettingPassword
    ) {
      return;
    }

    setShowManageModal(false);
    setSelectedEmployee(null);

    setEmployeeId("");
    setFullName("");
    setEmail("");
    setRole("");
    setActive(true);

    setNewPassword("");
    setShowPassword(false);
  };

  // =====================================================
  // SAVE EMPLOYEE DETAILS
  // =====================================================

  const handleSaveEmployee = async () => {

    if (!selectedEmployee) {
      return;
    }

    setError("");
    setSuccess("");

    // ---------------------------------------------
    // BASIC VALIDATION
    // ---------------------------------------------

    if (!employeeId.trim()) {

      setError(
        "Employee ID cannot be empty."
      );

      return;
    }

    if (!fullName.trim()) {

      setError(
        "Employee name cannot be empty."
      );

      return;
    }

    if (!email.trim()) {

      setError(
        "Email cannot be empty."
      );

      return;
    }

    if (!role) {

      setError(
        "Please select an employee role."
      );

      return;
    }

    try {

      setSavingEmployee(true);

      const token = getToken();

      if (!token) {
        throw new Error(
          "Admin login session not found. Please login again."
        );
      }

      const response = await fetch(
        `${API_BASE_URL}/admin/employees/${selectedEmployee.id}`,
        {
          method: "PUT",

          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            employeeId: employeeId.trim(),
            fullName: fullName.trim(),
            email: email.trim(),
            role: role,
            active: active,
          }),
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
            "You do not have permission to update this employee."
          );
        }

        throw new Error(
          data?.message ||
          data?.error ||
          `Failed to update employee (${response.status})`
        );
      }

      // ---------------------------------------------
      // UPDATE LOCAL EMPLOYEE LIST
      // ---------------------------------------------

      setEmployees((previousEmployees) =>
        previousEmployees.map(
          (employee) =>
            employee.id === selectedEmployee.id
              ? data
              : employee
        )
      );

      setSelectedEmployee(data);

      setEmployeeId(
        data.employeeId || ""
      );

      setFullName(
        data.fullName || ""
      );

      setEmail(
        data.email || ""
      );

      setRole(
        data.role || ""
      );

      setActive(
        data.active === true
      );

      setSuccess(
        "Employee details updated successfully."
      );

    } catch (err) {

      setError(
        err.message ||
        "Unable to update employee."
      );

    } finally {

      setSavingEmployee(false);

    }
  };

  // =====================================================
  // RESET EMPLOYEE PASSWORD
  // =====================================================

  const handleResetPassword = async () => {

    if (!selectedEmployee) {
      return;
    }

    setError("");
    setSuccess("");

    // ---------------------------------------------
    // PASSWORD VALIDATION
    // ---------------------------------------------

    if (!newPassword.trim()) {

      setError(
        "Please enter a new password."
      );

      return;
    }

    if (newPassword.length < 8) {

      setError(
        "Password must contain at least 8 characters."
      );

      return;
    }

    try {

      setResettingPassword(true);

      const token = getToken();

      if (!token) {
        throw new Error(
          "Admin login session not found. Please login again."
        );
      }

      const response = await fetch(
        `${API_BASE_URL}/admin/employees/${selectedEmployee.id}/password`,
        {
          method: "PUT",

          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            newPassword: newPassword,
          }),
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
            "You do not have permission to reset this employee password."
          );
        }

        throw new Error(
          data?.message ||
          data?.error ||
          `Failed to reset password (${response.status})`
        );
      }

      setNewPassword("");
      setShowPassword(false);

      setSuccess(
        "Employee password reset successfully."
      );

    } catch (err) {

      setError(
        err.message ||
        "Unable to reset employee password."
      );

    } finally {

      setResettingPassword(false);

    }
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <>
      <style>
        {`

          * {
            box-sizing: border-box;
          }

          /* =================================================
             PAGE HEADER
          ================================================= */

          .employee-page-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            margin-bottom: 32px;
          }

          .employee-page-title {
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

          .employee-page-subtitle {
            margin: 7px 0 0;
            color: #958981;
            font-size: 0.92rem;
          }

          .employee-refresh-button {
            display: flex;
            align-items: center;
            justify-content: center;
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
            transition:
              background 0.2s ease,
              transform 0.2s ease;
          }

          .employee-refresh-button:hover {
            background:
              rgba(201,123,74,0.18);
            transform:
              translateY(-1px);
          }

          .employee-refresh-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
          }

          /* =================================================
             ERROR
          ================================================= */

          .employee-error {
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

          .employee-error strong {
            display: block;
            margin-bottom: 5px;
            color: #f0ad9f;
          }

          .employee-retry {
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

          .employee-retry:hover {
            background:
              rgba(205,92,75,0.08);
          }

          /* =================================================
             SUCCESS
          ================================================= */

          .employee-success {
            padding: 14px 18px;
            margin-bottom: 20px;
            background:
              rgba(72,128,82,0.13);
            border:
              1px solid
              rgba(109,180,124,0.25);
            border-radius: 10px;
            color: #91c59e;
            font-size: 0.86rem;
          }

          /* =================================================
             STATISTICS
          ================================================= */

          .employee-stats {
            display: grid;
            grid-template-columns:
              repeat(4, minmax(0, 1fr));
            gap: 18px;
            margin-bottom: 18px;
          }

          .employee-stat-card {
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

          .employee-stat-card::after {
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

          .employee-stat-label {
            color: #91857d;
            font-size: 0.78rem;
            font-weight: 600;
            letter-spacing: 0.04em;
            text-transform: uppercase;
          }

          .employee-stat-value {
            margin-top: 14px;
            color: #fffaf5;
            font-family:
              Georgia,
              "Times New Roman",
              serif;
            font-size: 2.1rem;
            font-weight: 600;
          }

          .employee-stat-description {
            margin-top: 6px;
            color: #756b64;
            font-size: 0.8rem;
          }

          /* =================================================
             ROLE SUMMARY
          ================================================= */

          .employee-role-grid {
            display: grid;
            grid-template-columns:
              repeat(5, minmax(0, 1fr));
            gap: 14px;
            margin-bottom: 28px;
          }

          .employee-role-card {
            padding: 17px;
            background: #211b18;
            border:
              1px solid
              rgba(255,255,255,0.07);
            border-radius: 12px;
          }

          .employee-role-name {
            color: #8d8179;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }

          .employee-role-count {
            margin-top: 8px;
            color: #f8f0e9;
            font-family:
              Georgia,
              "Times New Roman",
              serif;
            font-size: 1.7rem;
            font-weight: 600;
          }

          /* =================================================
             EMPLOYEE TABLE
          ================================================= */

          .employee-panel {
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

          .employee-panel-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
            padding: 20px 22px;
            border-bottom:
              1px solid
              rgba(255,255,255,0.07);
          }

          .employee-panel-header h2 {
            margin: 0;
            color: #f8f0e9;
            font-family:
              Georgia,
              "Times New Roman",
              serif;
            font-size: 1.2rem;
            font-weight: 600;
          }

          .employee-panel-header span {
            color: #756b64;
            font-size: 0.78rem;
          }

          .employee-table-wrapper {
            width: 100%;
            overflow-x: auto;
          }

          .employee-table {
            width: 100%;
            border-collapse: collapse;
            min-width: 750px;
          }

          .employee-table th {
            padding: 15px 18px;
            background: #1c1715;
            color: #81756e;
            font-size: 0.72rem;
            font-weight: 700;
            letter-spacing: 0.05em;
            text-align: left;
            text-transform: uppercase;
            white-space: nowrap;
          }

          .employee-table td {
            padding: 17px 18px;
            color: #d8cec6;
            font-size: 0.85rem;
            border-top:
              1px solid
              rgba(255,255,255,0.055);
            white-space: nowrap;
          }

          .employee-table tbody tr {
            transition:
              background 0.2s ease;
          }

          .employee-table tbody tr:hover {
            background:
              rgba(201,123,74,0.045);
          }

          .employee-id {
            color: #e3a16f;
            font-weight: 700;
          }

          .employee-name {
            color: #f6eee8;
            font-weight: 600;
          }

          .employee-email {
            color: #9d9189;
          }

          /* =================================================
             ROLE BADGE
          ================================================= */

          .employee-role-badge {
            display: inline-flex;
            align-items: center;
            padding: 5px 9px;
            border:
              1px solid
              rgba(201,123,74,0.22);
            border-radius: 999px;
            background:
              rgba(201,123,74,0.08);
            color: #dfa074;
            font-size: 0.72rem;
            font-weight: 700;
          }

          /* =================================================
             STATUS
          ================================================= */

          .employee-status {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            font-size: 0.76rem;
            font-weight: 700;
          }

          .employee-status-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
          }

          .employee-status.active {
            color: #91c59e;
          }

          .employee-status.active
          .employee-status-dot {
            background: #6db47c;
          }

          .employee-status.inactive {
            color: #d99a8d;
          }

          .employee-status.inactive
          .employee-status-dot {
            background: #b96758;
          }

          /* =================================================
             MANAGE BUTTON
          ================================================= */

          .employee-manage-button {
            padding: 8px 14px;
            border:
              1px solid
              rgba(201,123,74,0.30);
            border-radius: 8px;
            background:
              rgba(201,123,74,0.08);
            color: #dfa074;
            font: inherit;
            font-size: 0.78rem;
            font-weight: 600;
            cursor: pointer;
            transition:
              background 0.2s ease,
              border-color 0.2s ease,
              transform 0.2s ease;
          }

          .employee-manage-button:hover {
            background:
              rgba(201,123,74,0.17);
            border-color:
              rgba(201,123,74,0.42);
            transform:
              translateY(-1px);
          }

          /* =================================================
             EMPTY
          ================================================= */

          .employee-empty {
            padding: 50px 20px;
            text-align: center;
            color: #81756e;
          }

          .employee-empty-icon {
            margin-bottom: 12px;
            font-size: 2rem;
          }

          .employee-empty-title {
            color: #d8cec6;
            font-size: 1rem;
            font-weight: 600;
          }

          .employee-empty-text {
            margin-top: 6px;
            font-size: 0.82rem;
          }

          /* =================================================
             LOADING
          ================================================= */

          .employee-loading {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 300px;
            color: #91857d;
          }

          .employee-spinner {
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
              employeeSpin
              0.8s linear infinite;
          }

          @keyframes employeeSpin {
            to {
              transform:
                rotate(360deg);
            }
          }

          /* =================================================
             MODAL OVERLAY
          ================================================= */

          .employee-modal-overlay {
            position: fixed;
            inset: 0;
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            background:
              rgba(0,0,0,0.72);
            backdrop-filter:
              blur(5px);
          }

          /* =================================================
             MODAL
          ================================================= */

          .employee-modal {
            width: 100%;
            max-width: 680px;
            max-height: 90vh;
            overflow-y: auto;
            background: #211b18;
            border:
              1px solid
              rgba(255,255,255,0.10);
            border-radius: 16px;
            box-shadow:
              0 30px 80px
              rgba(0,0,0,0.50);
          }

          .employee-modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
            padding: 21px 24px;
            border-bottom:
              1px solid
              rgba(255,255,255,0.08);
          }

          .employee-modal-header h2 {
            margin: 0;
            color: #fffaf5;
            font-family:
              Georgia,
              "Times New Roman",
              serif;
            font-size: 1.35rem;
            font-weight: 600;
          }

          .employee-modal-close {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 34px;
            height: 34px;
            border:
              1px solid
              rgba(255,255,255,0.08);
            border-radius: 8px;
            background:
              rgba(255,255,255,0.03);
            color: #a99d95;
            font-size: 1.1rem;
            cursor: pointer;
          }

          .employee-modal-close:hover {
            background:
              rgba(205,92,75,0.12);
            color: #f0ad9f;
          }

          .employee-modal-body {
            padding: 24px;
          }

          /* =================================================
             FORM
          ================================================= */

          .employee-form-grid {
            display: grid;
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
            gap: 18px;
          }

          .employee-form-group {
            display: flex;
            flex-direction: column;
            gap: 7px;
          }

          .employee-form-group.full {
            grid-column: 1 / -1;
          }

          .employee-form-label {
            color: #9d9189;
            font-size: 0.76rem;
            font-weight: 700;
            letter-spacing: 0.04em;
            text-transform: uppercase;
          }

          .employee-form-input,
          .employee-form-select {
            width: 100%;
            padding: 11px 13px;
            border:
              1px solid
              rgba(255,255,255,0.10);
            border-radius: 8px;
            outline: none;
            background: #181412;
            color: #f5ede7;
            font: inherit;
            font-size: 0.86rem;
            transition:
              border-color 0.2s ease,
              box-shadow 0.2s ease;
          }

          .employee-form-input:focus,
          .employee-form-select:focus {
            border-color:
              rgba(201,123,74,0.55);
            box-shadow:
              0 0 0 3px
              rgba(201,123,74,0.08);
          }

          .employee-form-select option {
            background: #211b18;
            color: #fffaf5;
          }

          /* =================================================
             MODAL SECTION
          ================================================= */

          .employee-modal-section {
            margin-top: 28px;
            padding-top: 24px;
            border-top:
              1px solid
              rgba(255,255,255,0.08);
          }

          .employee-modal-section-title {
            margin: 0 0 5px;
            color: #f8f0e9;
            font-family:
              Georgia,
              "Times New Roman",
              serif;
            font-size: 1.08rem;
            font-weight: 600;
          }

          .employee-modal-section-description {
            margin: 0 0 17px;
            color: #81756e;
            font-size: 0.78rem;
          }

          /* =================================================
             PASSWORD
          ================================================= */

          .employee-password-wrapper {
            position: relative;
          }

          .employee-password-wrapper
          .employee-form-input {
            padding-right: 75px;
          }

          .employee-password-toggle {
            position: absolute;
            right: 8px;
            top: 50%;
            transform:
              translateY(-50%);
            border: 0;
            background: transparent;
            color: #b28a70;
            font: inherit;
            font-size: 0.74rem;
            font-weight: 600;
            cursor: pointer;
          }

          .employee-password-toggle:hover {
            color: #e3a16f;
          }

          /* =================================================
             MODAL ACTIONS
          ================================================= */

          .employee-modal-actions {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 24px;
            padding-top: 20px;
            border-top:
              1px solid
              rgba(255,255,255,0.08);
          }

          .employee-cancel-button {
            padding: 10px 17px;
            border:
              1px solid
              rgba(255,255,255,0.10);
            border-radius: 8px;
            background:
              rgba(255,255,255,0.03);
            color: #bcb0a8;
            font: inherit;
            font-size: 0.82rem;
            font-weight: 600;
            cursor: pointer;
          }

          .employee-cancel-button:hover {
            background:
              rgba(255,255,255,0.06);
          }

          .employee-save-button,
          .employee-reset-button {
            padding: 10px 17px;
            border:
              1px solid
              rgba(201,123,74,0.35);
            border-radius: 8px;
            background:
              rgba(201,123,74,0.13);
            color: #e3a16f;
            font: inherit;
            font-size: 0.82rem;
            font-weight: 700;
            cursor: pointer;
          }

          .employee-save-button:hover,
          .employee-reset-button:hover {
            background:
              rgba(201,123,74,0.21);
          }

          .employee-save-button:disabled,
          .employee-reset-button:disabled,
          .employee-cancel-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          /* =================================================
             RESPONSIVE
          ================================================= */

          @media (max-width: 1200px) {

            .employee-stats {
              grid-template-columns:
                repeat(2, minmax(0, 1fr));
            }

            .employee-role-grid {
              grid-template-columns:
                repeat(3, minmax(0, 1fr));
            }

          }

          @media (max-width: 700px) {

            .employee-page-header {
              align-items: flex-start;
              flex-direction: column;
            }

            .employee-refresh-button {
              width: 100%;
            }

            .employee-stats {
              grid-template-columns: 1fr;
            }

            .employee-role-grid {
              grid-template-columns:
                repeat(2, minmax(0, 1fr));
            }

            .employee-form-grid {
              grid-template-columns: 1fr;
            }

            .employee-form-group.full {
              grid-column: auto;
            }

          }

          @media (max-width: 450px) {

            .employee-role-grid {
              grid-template-columns: 1fr;
            }

            .employee-modal-overlay {
              padding: 10px;
            }

            .employee-modal-body {
              padding: 18px;
            }

          }

        `}
      </style>

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="employee-page-header">

        <div>

          <h1 className="employee-page-title">
            Employee Management
          </h1>

          <p className="employee-page-subtitle">
            Manage restaurant employees and their access
          </p>

        </div>

        <button
          type="button"
          className="employee-refresh-button"
          onClick={loadEmployees}
          disabled={loading}
        >
          ↻{" "}
          {loading
            ? "Refreshing..."
            : "Refresh"}
        </button>

      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="employee-error">

          <strong>
            Something went wrong
          </strong>

          <div>
            {error}
          </div>

          <button
            type="button"
            className="employee-retry"
            onClick={() => setError("")}
          >
            Close
          </button>

        </div>
      )}

      {/* =================================================
          SUCCESS
      ================================================= */}

      {success && (
        <div className="employee-success">
          ✓ {success}
        </div>
      )}

      {/* =================================================
          LOADING
      ================================================= */}

      {loading ? (

        <div className="employee-loading">

          <div className="employee-spinner" />

          Loading employees...

        </div>

      ) : (

        <>

          {/* =================================================
              STATISTICS
          ================================================= */}

          <section className="employee-stats">

            <div className="employee-stat-card">

              <div className="employee-stat-label">
                Total Employees
              </div>

              <div className="employee-stat-value">
                {totalEmployees}
              </div>

              <div className="employee-stat-description">
                All registered employees
              </div>

            </div>

            <div className="employee-stat-card">

              <div className="employee-stat-label">
                Active
              </div>

              <div className="employee-stat-value">
                {activeEmployees}
              </div>

              <div className="employee-stat-description">
                Employees with access
              </div>

            </div>

            <div className="employee-stat-card">

              <div className="employee-stat-label">
                Inactive
              </div>

              <div className="employee-stat-value">
                {inactiveEmployees}
              </div>

              <div className="employee-stat-description">
                Access disabled
              </div>

            </div>

            <div className="employee-stat-card">

              <div className="employee-stat-label">
                Other
              </div>

              <div className="employee-stat-value">
                {otherEmployees}
              </div>

              <div className="employee-stat-description">
                Admin / other roles
              </div>

            </div>

          </section>

          {/* =================================================
              ROLE SUMMARY
          ================================================= */}

          <section className="employee-role-grid">

            <div className="employee-role-card">

              <div className="employee-role-name">
                Kitchen
              </div>

              <div className="employee-role-count">
                {kitchenEmployees}
              </div>

            </div>

            <div className="employee-role-card">

              <div className="employee-role-name">
                Waiter
              </div>

              <div className="employee-role-count">
                {waiterEmployees}
              </div>

            </div>

            <div className="employee-role-card">

              <div className="employee-role-name">
                Cashier
              </div>

              <div className="employee-role-count">
                {cashierEmployees}
              </div>

            </div>

            <div className="employee-role-card">

              <div className="employee-role-name">
                Receptionist
              </div>

              <div className="employee-role-count">
                {receptionistEmployees}
              </div>

            </div>

            <div className="employee-role-card">

              <div className="employee-role-name">
                Total
              </div>

              <div className="employee-role-count">
                {totalEmployees}
              </div>

            </div>

          </section>

          {/* =================================================
              EMPLOYEE TABLE
          ================================================= */}

          <section className="employee-panel">

            <div className="employee-panel-header">

              <h2>
                All Employees
              </h2>

              <span>
                {totalEmployees} employee
                {totalEmployees !== 1
                  ? "s"
                  : ""}
              </span>

            </div>

            {employees.length === 0 ? (

              <div className="employee-empty">

                <div className="employee-empty-icon">
                  👥
                </div>

                <div className="employee-empty-title">
                  No employees found
                </div>

                <div className="employee-empty-text">
                  Employees created by the admin
                  will appear here.
                </div>

              </div>

            ) : (

              <div className="employee-table-wrapper">

                <table className="employee-table">

                  <thead>

                    <tr>

                      <th>
                        Employee ID
                      </th>

                      <th>
                        Name
                      </th>

                      <th>
                        Email
                      </th>

                      <th>
                        Role
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

                    {employees.map(
                      (employee) => (

                        <tr
                          key={
                            employee.id
                          }
                        >

                          <td>

                            <span className="employee-id">
                              {employee.employeeId}
                            </span>

                          </td>

                          <td>

                            <span className="employee-name">
                              {employee.fullName}
                            </span>

                          </td>

                          <td>

                            <span className="employee-email">
                              {employee.email}
                            </span>

                          </td>

                          <td>

                            <span className="employee-role-badge">
                              {formatRole(
                                employee.role
                              )}
                            </span>

                          </td>

                          <td>

                            <span
                              className={
                                `employee-status ${
                                  employee.active
                                    ? "active"
                                    : "inactive"
                                }`
                              }
                            >

                              <span className="employee-status-dot" />

                              {employee.active
                                ? "Active"
                                : "Inactive"}

                            </span>

                          </td>

                          <td>

                            <button
                              type="button"
                              className="employee-manage-button"
                              onClick={() =>
                                openManageModal(
                                  employee
                                )
                              }
                            >
                              Manage
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

        </>

      )}

      {/* =================================================
          MANAGE EMPLOYEE MODAL
      ================================================= */}

      {showManageModal &&
        selectedEmployee && (

          <div
            className="employee-modal-overlay"
            onMouseDown={(event) => {

              if (
                event.target ===
                event.currentTarget
              ) {
                closeManageModal();
              }

            }}
          >

            <div className="employee-modal">

              {/* =================================================
                  MODAL HEADER
              ================================================= */}

              <div className="employee-modal-header">

                <h2>
                  Manage Employee
                </h2>

                <button
                  type="button"
                  className="employee-modal-close"
                  onClick={closeManageModal}
                  disabled={
                    savingEmployee ||
                    resettingPassword
                  }
                >
                  ×
                </button>

              </div>

              <div className="employee-modal-body">

                {/* =================================================
                    UPDATE ERROR
                ================================================= */}

                {error && (
                  <div className="employee-error">

                    <strong>
                      Unable to complete request
                    </strong>

                    <div>
                      {error}
                    </div>

                  </div>
                )}

                {/* =================================================
                    UPDATE SUCCESS
                ================================================= */}

                {success && (
                  <div className="employee-success">
                    ✓ {success}
                  </div>
                )}

                {/* =================================================
                    EMPLOYEE DETAILS
                ================================================= */}

                <div className="employee-form-grid">

                  {/* EMPLOYEE ID */}

                  <div className="employee-form-group">

                    <label className="employee-form-label">
                      Employee ID
                    </label>

                    <input
                      type="text"
                      className="employee-form-input"
                      value={employeeId}
                      onChange={(event) =>
                        setEmployeeId(
                          event.target.value
                        )
                      }
                    />

                  </div>

                  {/* FULL NAME */}

                  <div className="employee-form-group">

                    <label className="employee-form-label">
                      Full Name
                    </label>

                    <input
                      type="text"
                      className="employee-form-input"
                      value={fullName}
                      onChange={(event) =>
                        setFullName(
                          event.target.value
                        )
                      }
                    />

                  </div>

                  {/* EMAIL */}

                  <div className="employee-form-group full">

                    <label className="employee-form-label">
                      Email
                    </label>

                    <input
                      type="email"
                      className="employee-form-input"
                      value={email}
                      onChange={(event) =>
                        setEmail(
                          event.target.value
                        )
                      }
                    />

                  </div>

                  {/* ROLE */}

                  <div className="employee-form-group">

                    <label className="employee-form-label">
                      Role
                    </label>

                    <select
                      className="employee-form-select"
                      value={role}
                      onChange={(event) =>
                        setRole(
                          event.target.value
                        )
                      }
                    >

                      <option value="">
                        Select Role
                      </option>

                      <option value="MANAGER">
                        Manager
                      </option>

                      <option value="KITCHEN">
                        Kitchen
                      </option>

                      <option value="WAITER">
                        Waiter
                      </option>

                      <option value="CASHIER">
                        Cashier
                      </option>

                      <option value="RECEPTIONIST">
                        Receptionist
                      </option>

                      <option value="STAFF">
                        Staff
                      </option>

                      <option value="ADMIN">
                        Admin
                      </option>

                    </select>

                  </div>

                  {/* STATUS */}

                  <div className="employee-form-group">

                    <label className="employee-form-label">
                      Account Status
                    </label>

                    <select
                      className="employee-form-select"
                      value={
                        active
                          ? "ACTIVE"
                          : "INACTIVE"
                      }
                      onChange={(event) =>
                        setActive(
                          event.target.value ===
                            "ACTIVE"
                        )
                      }
                    >

                      <option value="ACTIVE">
                        Active
                      </option>

                      <option value="INACTIVE">
                        Inactive
                      </option>

                    </select>

                  </div>

                </div>

                {/* =================================================
                    SAVE DETAILS
                ================================================= */}

                <div className="employee-modal-actions">

                  <button
                    type="button"
                    className="employee-cancel-button"
                    onClick={closeManageModal}
                    disabled={
                      savingEmployee ||
                      resettingPassword
                    }
                  >
                    Close
                  </button>

                  <button
                    type="button"
                    className="employee-save-button"
                    onClick={
                      handleSaveEmployee
                    }
                    disabled={
                      savingEmployee ||
                      resettingPassword
                    }
                  >
                    {savingEmployee
                      ? "Saving..."
                      : "Save Changes"}
                  </button>

                </div>

                {/* =================================================
                    RESET PASSWORD
                ================================================= */}

                <div className="employee-modal-section">

                  <h3 className="employee-modal-section-title">
                    Reset Password
                  </h3>

                  <p className="employee-modal-section-description">
                    Set a new password for this employee.
                    The current password cannot be viewed.
                  </p>

                  <div className="employee-form-group">

                    <label className="employee-form-label">
                      New Password
                    </label>

                    <div className="employee-password-wrapper">

                      <input
                        type={
                          showPassword
                            ? "text"
                            : "password"
                        }
                        className="employee-form-input"
                        value={newPassword}
                        onChange={(event) =>
                          setNewPassword(
                            event.target.value
                          )
                        }
                        placeholder="Enter new password"
                        autoComplete="new-password"
                      />

                      <button
                        type="button"
                        className="employee-password-toggle"
                        onClick={() =>
                          setShowPassword(
                            (previous) =>
                              !previous
                          )
                        }
                      >
                        {showPassword
                          ? "Hide"
                          : "Show"}
                      </button>

                    </div>

                  </div>

                  <div className="employee-modal-actions">

                    <button
                      type="button"
                      className="employee-reset-button"
                      onClick={
                        handleResetPassword
                      }
                      disabled={
                        resettingPassword ||
                        savingEmployee ||
                        !newPassword
                      }
                    >
                      {resettingPassword
                        ? "Resetting..."
                        : "Reset Password"}
                    </button>

                  </div>

                </div>

              </div>

            </div>

          </div>

        )}

    </>
  );
}

export default EmployeeManagement;