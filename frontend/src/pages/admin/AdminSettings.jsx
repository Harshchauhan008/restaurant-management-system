import { useEffect, useState } from "react";

const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:8080/api";

const TABS = [
    { key: "billing", label: "Billing" },
    { key: "employees", label: "Employees" },
    { key: "reports", label: "Reports" },
];

const ROLES = [
    "ADMIN",
    "MANAGER",
    "RECEPTIONIST",
    "KITCHEN",
    "WAITER",
    "CASHIER",
    "STAFF",
];

const REPORT_PERIODS = [
    { key: "YEAR", label: "Year" },
    { key: "MONTH", label: "Month" },
    { key: "WEEK", label: "Week" },
    { key: "DAY", label: "Day" },
];

function AdminSettings() {
    const [activeTab, setActiveTab] = useState("billing");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("success");

    const getToken = () => {
        return (
            localStorage.getItem("adminToken") ||
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

    const showMessage = (text, type = "success") => {
        setMessage(text);
        setMessageType(type);
        window.setTimeout(() => setMessage(""), 3000);
    };

    // ===== BILLING =====
    const [restaurant, setRestaurant] = useState({
        restaurantName: "", logoUrl: "", address: "", phone: "",
        email: "", locationUrl: "", openingHours: "", taxPercentage: 0,
        receiptHeader: "", receiptFooter: "",
    });

    const applyRestaurantData = (data) => {
        setRestaurant({
            restaurantName: data?.restaurantName || "",
            logoUrl: data?.logoUrl || "",
            address: data?.address || "",
            phone: data?.phone || "",
            email: data?.email || "",
            locationUrl: data?.locationUrl || "",
            openingHours: data?.openingHours || "",
            taxPercentage: data?.taxPercentage ?? 0,
            receiptHeader: data?.receiptHeader || "",
            receiptFooter: data?.receiptFooter || "",
        });
    };

    const loadRestaurantSettings = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/admin/settings`, {
                method: "GET", headers: getHeaders(),
            });
            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || "Failed to load settings");
            }
            const data = await response.json();
            applyRestaurantData(data);
        } catch (error) {
            console.error(error);
            showMessage(error.message || "Failed to load settings", "error");
        } finally {
            setLoading(false);
        }
    };

    const saveBillingSettings = async (event) => {
        event.preventDefault();
        try {
            if (!restaurant.restaurantName.trim()) {
                showMessage("Restaurant name is required", "error");
                return;
            }
            const tax = Number(restaurant.taxPercentage);
            if (Number.isNaN(tax) || tax < 0 || tax > 100) {
                showMessage("Tax percentage must be between 0 and 100", "error");
                return;
            }
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/admin/settings`, {
                method: "PUT", headers: getHeaders(),
                body: JSON.stringify({
                    restaurantName: restaurant.restaurantName.trim(),
                    logoUrl: restaurant.logoUrl.trim(),
                    address: restaurant.address.trim(),
                    phone: restaurant.phone.trim(),
                    email: restaurant.email.trim(),
                    locationUrl: restaurant.locationUrl.trim(),
                    openingHours: restaurant.openingHours.trim(),
                    taxPercentage: tax,
                    receiptHeader: restaurant.receiptHeader,
                    receiptFooter: restaurant.receiptFooter,
                }),
            });
            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || "Failed to save billing settings");
            }
            const data = await response.json();
            applyRestaurantData(data);
            showMessage("Billing settings saved successfully");
        } catch (error) {
            console.error(error);
            showMessage(error.message || "Failed to save billing settings", "error");
        } finally {
            setLoading(false);
        }
    };

    // ===== EMPLOYEES =====
    const [employees, setEmployees] = useState([]);
    const [employeeForm, setEmployeeForm] = useState({
        employeeId: "", fullName: "", email: "", password: "", role: "STAFF",
    });
    const [editingEmployeeId, setEditingEmployeeId] = useState(null);
    const [editEmployeeForm, setEditEmployeeForm] = useState({
        fullName: "", email: "", role: "STAFF", active: true,
    });

    const loadEmployees = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/admin/employees`, {
                method: "GET", headers: getHeaders(),
            });
            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || "Failed to load employees");
            }
            const data = await response.json();
            setEmployees(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            showMessage(error.message || "Failed to load employees", "error");
        } finally {
            setLoading(false);
        }
    };

    const createEmployee = async (event) => {
        event.preventDefault();
        try {
            if (!employeeForm.employeeId.trim() || !employeeForm.fullName.trim() ||
                !employeeForm.email.trim() || !employeeForm.password) {
                showMessage("Please fill all employee fields", "error");
                return;
            }
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/admin/employees`, {
                method: "POST", headers: getHeaders(),
                body: JSON.stringify({
                    employeeId: employeeForm.employeeId.trim(),
                    fullName: employeeForm.fullName.trim(),
                    email: employeeForm.email.trim(),
                    password: employeeForm.password,
                    role: employeeForm.role,
                }),
            });
            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || "Failed to create employee");
            }
            setEmployeeForm({ employeeId: "", fullName: "", email: "", password: "", role: "STAFF" });
            showMessage("Employee created successfully");
            await loadEmployees();
        } catch (error) {
            console.error(error);
            showMessage(error.message || "Failed to create employee", "error");
        } finally {
            setLoading(false);
        }
    };

    const startEditEmployee = (employee) => {
        setEditingEmployeeId(employee.id);
        setEditEmployeeForm({
            fullName: employee.fullName || "",
            email: employee.email || "",
            role: employee.role || "STAFF",
            active: employee.active ?? true,
        });
    };

    const cancelEditEmployee = () => {
        setEditingEmployeeId(null);
        setEditEmployeeForm({ fullName: "", email: "", role: "STAFF", active: true });
    };

    const updateEmployee = async (employeeId) => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/admin/employees/${employeeId}`, {
                method: "PUT", headers: getHeaders(),
                body: JSON.stringify({
                    fullName: editEmployeeForm.fullName.trim(),
                    email: editEmployeeForm.email.trim(),
                    role: editEmployeeForm.role,
                    active: editEmployeeForm.active,
                }),
            });
            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || "Failed to update employee");
            }
            showMessage("Employee updated successfully");
            cancelEditEmployee();
            await loadEmployees();
        } catch (error) {
            console.error(error);
            showMessage(error.message || "Failed to update employee", "error");
        } finally {
            setLoading(false);
        }
    };

    const disableEmployee = async (employeeId) => {
        const confirmed = window.confirm("Are you sure you want to disable this employee?");
        if (!confirmed) return;
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/admin/employees/${employeeId}/disable`, {
                method: "PATCH", headers: getHeaders(),
            });
            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || "Failed to disable employee");
            }
            showMessage("Employee disabled successfully");
            await loadEmployees();
        } catch (error) {
            console.error(error);
            showMessage(error.message || "Failed to disable employee", "error");
        } finally {
            setLoading(false);
        }
    };

    // ===== REPORTS =====
    const [reportPeriod, setReportPeriod] = useState("MONTH");
    const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0]);
    const [report, setReport] = useState(null);
    const [reportLoading, setReportLoading] = useState(false);
    const [reportError, setReportError] = useState("");

    const loadReport = async () => {
        try {
            setReportLoading(true);
            setReportError("");
            const params = new URLSearchParams();
            params.set("period", reportPeriod);
            params.set("date", reportDate);
            const response = await fetch(`${API_BASE_URL}/admin/reports?${params.toString()}`, {
                method: "GET", headers: getHeaders(),
            });
            if (!response.ok) {
                const text = await response.text();
                throw new Error(text || `Failed to load ${reportPeriod.toLowerCase()} report`);
            }
            const data = await response.json();
            setReport(data);
        } catch (error) {
            console.error(error);
            setReport(null);
            setReportError(error.message || "Failed to load report");
        } finally {
            setReportLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === "reports") loadReport();
    }, [activeTab, reportPeriod, reportDate]);

    useEffect(() => {
        if (activeTab === "employees") loadEmployees();
    }, [activeTab]);

    const formatMoney = (value) =>
        Number(value || 0).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

    const getMaxChartValue = () => {
        if (!report?.chart || report.chart.length === 0) return 0;
        return Math.max(...report.chart.map((point) => Number(point.value || 0)));
    };

    const getBarHeight = (value) => {
        const max = getMaxChartValue();
        const current = Number(value || 0);
        if (max <= 0 || current <= 0) return 4;
        return Math.max(8, (current / max) * 100);
    };

    const getPeriodTitle = () => {
        switch (reportPeriod) {
            case "YEAR": return "Yearly Sales";
            case "MONTH": return "Monthly Sales";
            case "WEEK": return "Weekly Sales";
            case "DAY": return "Hourly Sales";
            default: return "Sales Report";
        }
    };

    useEffect(() => {
        loadRestaurantSettings();
    }, []);

    return (
        <div className="admin-settings-page">
            <div className="settings-header">
                <div className="settings-header-content">
                    <h1>Admin Settings</h1>
                    <p>Manage billing, employees, and reports.</p>
                </div>
                {loading && <span className="settings-loading">Working...</span>}
            </div>

            {message && (
                <div className={`settings-message ${messageType === "error" ? "error" : "success"}`}>
                    {message}
                </div>
            )}

            <div className="settings-tabs-wrapper">
                <div className="settings-tabs">
                    {TABS.map((tab) => (
                        <button key={tab.key} type="button"
                            className={activeTab === tab.key ? "settings-tab active" : "settings-tab"}
                            onClick={() => setActiveTab(tab.key)}>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {activeTab === "billing" && (
                <form className="settings-card" onSubmit={saveBillingSettings}>
                    <div className="card-heading">
                        <h2>Billing Settings</h2>
                        <p>Manage tax and receipt configuration.</p>
                    </div>
                    <div className="settings-grid">
                        <div className="form-group">
                            <label>Restaurant Name</label>
                            <input type="text" value={restaurant.restaurantName}
                                onChange={(e) => setRestaurant({ ...restaurant, restaurantName: e.target.value })}
                                placeholder="Restaurant Cafe" required />
                        </div>
                        <div className="form-group">
                            <label>Logo URL</label>
                            <input type="text" value={restaurant.logoUrl}
                                onChange={(e) => setRestaurant({ ...restaurant, logoUrl: e.target.value })}
                                placeholder="/uploads/logo.png" />
                        </div>
                        <div className="form-group">
                            <label>Tax Percentage</label>
                            <input type="number" min="0" max="100" step="0.01" value={restaurant.taxPercentage}
                                onChange={(e) => setRestaurant({ ...restaurant, taxPercentage: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label>Currency</label>
                            <input type="text" value="INR (₹)" readOnly />
                        </div>
                        <div className="form-group full">
                            <label>Receipt Header</label>
                            <textarea rows="3" value={restaurant.receiptHeader}
                                onChange={(e) => setRestaurant({ ...restaurant, receiptHeader: e.target.value })}
                                placeholder="Restaurant CAFE" />
                        </div>
                        <div className="form-group full">
                            <label>Receipt Footer</label>
                            <textarea rows="3" value={restaurant.receiptFooter}
                                onChange={(e) => setRestaurant({ ...restaurant, receiptFooter: e.target.value })}
                                placeholder={"THANK YOU!\nVISIT AGAIN"} />
                        </div>
                    </div>
                    <div className="settings-actions">
                        <button type="submit" className="primary-button" disabled={loading}>Save Billing Settings</button>
                    </div>
                </form>
            )}

            {activeTab === "employees" && (
                <div>
                    <form className="settings-card" onSubmit={createEmployee}>
                        <div className="card-heading">
                            <h2>Add Employee</h2>
                            <p>Create an employee account and assign a role.</p>
                        </div>
                        <div className="settings-grid">
                            <div className="form-group">
                                <label>Employee ID</label>
                                <input type="text" value={employeeForm.employeeId}
                                    onChange={(e) => setEmployeeForm({ ...employeeForm, employeeId: e.target.value })}
                                    placeholder="EMP-001" required />
                            </div>
                            <div className="form-group">
                                <label>Full Name</label>
                                <input type="text" value={employeeForm.fullName}
                                    onChange={(e) => setEmployeeForm({ ...employeeForm, fullName: e.target.value })}
                                    placeholder="Employee name" required />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input type="email" value={employeeForm.email}
                                    onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                                    placeholder="employee@restaurant.com" required />
                            </div>
                            <div className="form-group">
                                <label>Password</label>
                                <input type="password" value={employeeForm.password}
                                    onChange={(e) => setEmployeeForm({ ...employeeForm, password: e.target.value })}
                                    placeholder="Temporary password" required />
                            </div>
                            <div className="form-group">
                                <label>Role</label>
                                <select value={employeeForm.role}
                                    onChange={(e) => setEmployeeForm({ ...employeeForm, role: e.target.value })}>
                                    {ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="role-note">
                            <strong>ADMIN</strong>
                            <span>has full system access through the ADMIN role.</span>
                        </div>
                        <div className="settings-actions">
                            <button type="submit" className="primary-button" disabled={loading}>Add Employee</button>
                        </div>
                    </form>

                    <div className="settings-card">
                        <div className="card-heading">
                            <h2>Employees</h2>
                            <p>Manage employee roles and account status.</p>
                        </div>
                        <div className="table-wrapper">
                            <table className="settings-table">
                                <thead>
                                    <tr>
                                        <th>ID</th><th>Employee ID</th><th>Name</th><th>Email</th>
                                        <th>Role</th><th>Status</th><th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {employees.length === 0 ? (
                                        <tr><td colSpan="7" className="empty-cell">No employees found.</td></tr>
                                    ) : (
                                        employees.map((employee) => {
                                            const editing = editingEmployeeId === employee.id;
                                            return (
                                                <tr key={employee.id}>
                                                    <td>{employee.id}</td>
                                                    <td>{employee.employeeId}</td>
                                                    <td>
                                                        {editing ? (
                                                            <input type="text" value={editEmployeeForm.fullName}
                                                                onChange={(e) => setEditEmployeeForm({ ...editEmployeeForm, fullName: e.target.value })} />
                                                        ) : employee.fullName}
                                                    </td>
                                                    <td>
                                                        {editing ? (
                                                            <input type="email" value={editEmployeeForm.email}
                                                                onChange={(e) => setEditEmployeeForm({ ...editEmployeeForm, email: e.target.value })} />
                                                        ) : employee.email}
                                                    </td>
                                                    <td>
                                                        {editing ? (
                                                            <select value={editEmployeeForm.role}
                                                                onChange={(e) => setEditEmployeeForm({ ...editEmployeeForm, role: e.target.value })}>
                                                                {ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
                                                            </select>
                                                        ) : <span className="role-badge">{employee.role}</span>}
                                                    </td>
                                                    <td>
                                                        {editing ? (
                                                            <select value={editEmployeeForm.active ? "true" : "false"}
                                                                onChange={(e) => setEditEmployeeForm({ ...editEmployeeForm, active: e.target.value === "true" })}>
                                                                <option value="true">ACTIVE</option>
                                                                <option value="false">INACTIVE</option>
                                                            </select>
                                                        ) : (
                                                            <span className={employee.active ? "status-badge active" : "status-badge inactive"}>
                                                                {employee.active ? "ACTIVE" : "INACTIVE"}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {editing ? (
                                                            <div className="table-actions">
                                                                <button type="button" className="small-button save" onClick={() => updateEmployee(employee.id)}>Save</button>
                                                                <button type="button" className="small-button cancel" onClick={cancelEditEmployee}>Cancel</button>
                                                            </div>
                                                        ) : (
                                                            <div className="table-actions">
                                                                <button type="button" className="small-button" onClick={() => startEditEmployee(employee)}>Edit</button>
                                                                {employee.active && (
                                                                    <button type="button" className="small-button danger" onClick={() => disableEmployee(employee.id)}>Disable</button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "reports" && (
                <div className="report-page">
                    <div className="settings-card report-control-card">
                        <div className="card-heading">
                            <h2>Reports</h2>
                            <p>Analyze sales and restaurant performance for different time periods.</p>
                        </div>
                        <div className="report-periods">
                            {REPORT_PERIODS.map((period) => (
                                <button key={period.key} type="button"
                                    className={reportPeriod === period.key ? "report-period active" : "report-period"}
                                    onClick={() => setReportPeriod(period.key)}>
                                    {period.label}
                                </button>
                            ))}
                        </div>
                        <div className="report-filters">
                            <div className="report-date-field">
                                <label>Select Date</label>
                                <input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} />
                            </div>
                            <button type="button" className="primary-button report-generate-button"
                                onClick={loadReport} disabled={reportLoading}>
                                {reportLoading ? "Loading..." : "Generate Report"}
                            </button>
                        </div>
                    </div>

                    {reportError && <div className="report-error">{reportError}</div>}
                    {reportLoading && !report && <div className="report-loading">Loading report...</div>}

                    {report && !reportLoading && (
                        <>
                            <div className="report-summary-grid">
                                <div className="report-summary-card">
                                    <span>Total Sales</span>
                                    <strong>{formatMoney(report.summary?.totalSales)}</strong>
                                </div>
                                <div className="report-summary-card">
                                    <span>Total Bills</span>
                                    <strong>{report.summary?.totalBills ?? 0}</strong>
                                </div>
                                <div className="report-summary-card">
                                    <span>Paid Bills</span>
                                    <strong>{report.summary?.paidBills ?? 0}</strong>
                                </div>
                                <div className="report-summary-card">
                                    <span>Total Orders</span>
                                    <strong>{report.summary?.totalOrders ?? 0}</strong>
                                </div>
                            </div>

                            <div className="settings-card chart-card">
                                <div className="chart-header">
                                    <div>
                                        <h2>{getPeriodTitle()}</h2>
                                        <p>
                                            {reportPeriod === "YEAR" ? `Sales for ${reportDate.slice(0, 4)}`
                                                : reportPeriod === "MONTH" ? `Sales for ${reportDate.slice(0, 7)}`
                                                : reportPeriod === "WEEK" ? "Sales from Monday to Sunday"
                                                : `Hourly sales for ${reportDate}`}
                                        </p>
                                    </div>
                                    <div className="chart-total">
                                        <span>Total</span>
                                        <strong>{formatMoney(report.summary?.totalSales)}</strong>
                                    </div>
                                </div>
                                <div className="bar-chart">
                                    <div className="chart-y-axis">
                                        <span>{formatMoney(getMaxChartValue())}</span>
                                        <span>{formatMoney(getMaxChartValue() / 2)}</span>
                                        <span>₹0</span>
                                    </div>
                                    <div className="chart-area">
                                        <div className="chart-grid-line line-top" />
                                        <div className="chart-grid-line line-middle" />
                                        <div className="chart-grid-line line-bottom" />
                                        <div className="bars">
                                            {(report.chart || []).map((point, index) => (
                                                <div key={index} className="bar-column">
                                                    <div className="bar-value">
                                                        {Number(point.value || 0) > 0 && formatMoney(point.value)}
                                                    </div>
                                                    <div className="bar-track">
                                                        <div className="bar" style={{ height: `${getBarHeight(point.value)}%` }} />
                                                    </div>
                                                    <span className="bar-label">{point.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="report-details-grid">
                                <div className="settings-card">
                                    <div className="card-heading">
                                        <h2>Bill Summary</h2>
                                        <p>Billing information for the selected period.</p>
                                    </div>
                                    <div className="detail-list">
                                        <div className="detail-row"><span>Total Bills</span><strong>{report.summary?.totalBills ?? 0}</strong></div>
                                        <div className="detail-row"><span>Paid Bills</span><strong>{report.summary?.paidBills ?? 0}</strong></div>
                                        <div className="detail-row"><span>Other Bills</span><strong>{report.summary?.generatedBills ?? 0}</strong></div>
                                        <div className="detail-row"><span>Tax</span><strong>{formatMoney(report.summary?.totalTax)}</strong></div>
                                        <div className="detail-row"><span>Discount</span><strong>{formatMoney(report.summary?.totalDiscount)}</strong></div>
                                    </div>
                                </div>
                                <div className="settings-card">
                                    <div className="card-heading">
                                        <h2>Order Summary</h2>
                                        <p>Orders grouped by status.</p>
                                    </div>
                                    <div className="detail-list">
                                        <div className="detail-row"><span>Placed</span><strong>{report.summary?.placedOrders ?? 0}</strong></div>
                                        <div className="detail-row"><span>Confirmed</span><strong>{report.summary?.confirmedOrders ?? 0}</strong></div>
                                        <div className="detail-row"><span>Preparing</span><strong>{report.summary?.preparingOrders ?? 0}</strong></div>
                                        <div className="detail-row"><span>Ready</span><strong>{report.summary?.readyOrders ?? 0}</strong></div>
                                        <div className="detail-row"><span>Served</span><strong>{report.summary?.servedOrders ?? 0}</strong></div>
                                        <div className="detail-row"><span>Cancelled</span><strong className="danger-number">{report.summary?.cancelledOrders ?? 0}</strong></div>
                                    </div>
                                </div>
                            </div>

                            <div className="settings-card">
                                <div className="card-heading">
                                    <h2>Top Selling Items</h2>
                                    <p>Menu items ranked by quantity sold.</p>
                                </div>
                                {(report.topSellingItems || []).length === 0 ? (
                                    <div className="report-empty">No item sales found for this period.</div>
                                ) : (
                                    <div className="top-items">
                                        {(report.topSellingItems || []).slice(0, 10).map((item, index) => (
                                            <div key={item.menuItemId || index} className="top-item-row">
                                                <span className="item-rank">{index + 1}</span>
                                                <div className="item-info">
                                                    <strong>{item.menuItemName}</strong>
                                                    <small>{item.quantitySold ?? 0} sold</small>
                                                </div>
                                                <div className="item-sales">{formatMoney(item.totalSales)}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}

            <style>{`
                .admin-settings-page {
    width: 100%;
    min-height: 100%;
    color: #2e211a;
}

.settings-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 20px;
    margin-bottom: 24px;
}

.settings-header-content {
    min-width: 0;
}

.settings-header h1 {
    margin: 0 0 8px;
    color: #f5e9df !important;
    font-size: 30px;
    line-height: 1.15;
    font-weight: 700;
    letter-spacing: -0.5px;
}

.settings-header p {
    margin: 0;
    color: #d2c0b3 !important;
    font-size: 14px;
    line-height: 1.5;
}

.settings-loading {
    color: #d8a074 !important;
    font-size: 13px;
    font-weight: 700;
    padding-top: 7px;
}

.settings-message {
    margin-bottom: 18px;
    padding: 12px 15px;
    border-radius: 9px;
    font-size: 13px;
    font-weight: 600;
}

.settings-message.success {
    color: #2c6b37 !important;
    background: #edf7ee !important;
    border: 1px solid #c7dfca;
}

.settings-message.error {
    color: #9e322b !important;
    background: #fbeceb !important;
    border: 1px solid #e6c0bc;
}

.settings-tabs-wrapper {
    display: inline-flex;
    align-items: center;
    padding: 7px;
    margin-bottom: 27px;
    background: #eee7df;
    border: 1px solid #d4c5b8;
    border-radius: 13px;
    box-shadow: 0 3px 8px rgba(50, 35, 25, 0.06);
}

.settings-tabs {
    display: flex;
    align-items: center;
    gap: 10px;
}

.settings-tab {
    min-width: 124px;
    height: 48px;
    padding: 0 20px;
    border: 1px solid #d5c5b7 !important;
    border-radius: 10px !important;
    background: #fbf7f2 !important;
    color: #654b3b !important;
    font-family: inherit;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition:
        background 0.2s ease,
        color 0.2s ease,
        border-color 0.2s ease,
        transform 0.15s ease;
}

.settings-tab:hover {
    background: #f2e8df !important;
    color: #4c3528 !important;
    border-color: #bda796 !important;
}

.settings-tab.active {
    background: #38271e !important;
    color: #ffffff !important;
    border-color: #38271e !important;
    box-shadow: 0 4px 9px rgba(40, 28, 21, 0.16);
}

.settings-card {
    width: 100%;
    box-sizing: border-box;
    padding: 28px;
    margin-bottom: 22px;
    background: #eee5dc !important;
    color: #30221a !important;
    border: 1px solid #d5c3b3 !important;
    border-radius: 15px;
    box-shadow: 0 7px 20px rgba(40, 28, 21, 0.09);
}

.card-heading {
    margin-bottom: 24px;
}

.card-heading h2 {
    margin: 0 0 7px;
    color: #432d20 !important;
    font-size: 21px;
    line-height: 1.3;
    font-weight: 700;
}

.card-heading p {
    margin: 0;
    color: #77675c !important;
    font-size: 13px;
    line-height: 1.5;
}

.settings-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 19px;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
}

.form-group.full {
    grid-column: 1 / -1;
}

.form-group label {
    color: #412c20 !important;
    font-size: 13px;
    font-weight: 700;
    line-height: 1.4;
}

.form-group input,
.form-group textarea,
.form-group select {
    width: 100%;
    box-sizing: border-box;
    padding: 12px 13px;
    background: #e2d6ca !important;
    color: #2d211a !important;
    border: 1px solid #cbb7a7 !important;
    border-radius: 9px;
    font-family: inherit;
    font-size: 14px;
    outline: none;
    transition:
        background 0.2s ease,
        border-color 0.2s ease,
        box-shadow 0.2s ease;
}

.form-group input::placeholder,
.form-group textarea::placeholder {
    color: #9c897b !important;
    opacity: 1 !important;
}

.form-group input:hover,
.form-group textarea:hover,
.form-group select:hover {
    border-color: #ae9581 !important;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
    background: #ebe0d6 !important;
    border-color: #95603b !important;
    box-shadow: 0 0 0 3px rgba(149, 96, 59, 0.12) !important;
}

.form-group input[readonly] {
    cursor: default;
    opacity: 0.85;
}

.form-group textarea {
    min-height: 100px;
    resize: vertical;
    line-height: 1.5;
}

.settings-actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    margin-top: 25px;
    padding-top: 20px;
    border-top: 1px solid #d9c9bc;
}

.primary-button {
    border: none !important;
    padding: 12px 20px;
    background: #81502f !important;
    color: #ffffff !important;
    border-radius: 9px;
    font-family: inherit;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 4px 10px rgba(129, 80, 47, 0.22);
    transition:
        background 0.2s ease,
        transform 0.15s ease;
}

.primary-button:hover {
    background: #6b4026 !important;
    transform: translateY(-1px);
}

.primary-button:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    transform: none;
}

.role-note {
    display: flex;
    align-items: center;
    gap: 7px;
    margin-top: 17px;
    padding: 11px 13px;
    background: #e4d8ce;
    border: 1px solid #d0beb0;
    border-radius: 8px;
    color: #725e51;
    font-size: 12px;
    line-height: 1.5;
}

.role-note strong {
    color: #4b3325;
}

.table-wrapper {
    width: 100%;
    overflow-x: auto;
    border: 1px solid #d6c6b9;
    border-radius: 10px;
}

.settings-table {
    width: 100%;
    min-width: 920px;
    border-collapse: collapse;
    background: #eee5dc !important;
}

.settings-table th,
.settings-table td {
    padding: 12px;
    text-align: left;
    vertical-align: middle;
    border-bottom: 1px solid #dccdc0;
    background: #eee5dc !important;
    color: #3d2d24 !important;
    font-size: 13px;
}

.settings-table th {
    background: #ded0c2 !important;
    color: #4d3527 !important;
    font-weight: 700;
    white-space: nowrap;
}

.settings-table tbody tr:hover td {
    background: #e7dcd2 !important;
}

.settings-table tbody tr:last-child td {
    border-bottom: none;
}

.settings-table input,
.settings-table select {
    width: 100%;
    max-width: 170px;
    padding: 8px 9px;
    background: #e3d7cc !important;
    color: #30221b !important;
    border: 1px solid #cbb7a7 !important;
    border-radius: 7px;
    outline: none;
}

.table-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
}

.small-button {
    padding: 7px 10px;
    border: 1px solid #c9b5a5 !important;
    border-radius: 7px;
    background: #e5d9ce !important;
    color: #513a2b !important;
    font-family: inherit;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
}

.small-button:hover {
    background: #d9cbbc !important;
}

.small-button.save {
    background: #e4f1e5 !important;
    border-color: #bfd5c2 !important;
    color: #286536 !important;
}

.small-button.cancel {
    background: #e6dfda !important;
    color: #6a594d !important;
}

.small-button.danger {
    background: #f8e8e6 !important;
    border-color: #e2bbb6 !important;
    color: #9e3029 !important;
}

.status-badge,
.role-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 800;
}

.status-badge {
    min-width: 68px;
    padding: 5px 9px;
}

.status-badge.active {
    background: #e2f0e4 !important;
    color: #2a6a35 !important;
}

.status-badge.inactive {
    background: #f7e6e4 !important;
    color: #a02f29 !important;
}

.role-badge {
    padding: 6px 10px;
    background: #e0d3c8 !important;
    color: #634635 !important;
}

.empty-cell {
    padding: 32px !important;
    text-align: center !important;
    color: #89786c !important;
}

.report-page {
    width: 100%;
}

.report-control-card {
    margin-bottom: 20px;
}

.report-periods {
    display: flex;
    gap: 8px;
    padding: 5px;
    width: fit-content;
    background: #e2d6ca;
    border: 1px solid #cdbbab;
    border-radius: 10px;
    margin-bottom: 20px;
}

.report-period {
    min-width: 82px;
    height: 39px;
    padding: 0 15px;
    border: none;
    border-radius: 7px;
    background: transparent;
    color: #675044;
    font-family: inherit;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    transition:
        background 0.2s ease,
        color 0.2s ease;
}

.report-period:hover {
    background: #eee5dc;
}

.report-period.active {
    background: #38271e;
    color: #ffffff;
}

.report-filters {
    display: flex;
    align-items: flex-end;
    gap: 14px;
    flex-wrap: wrap;
}

.report-date-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.report-date-field label {
    color: #412c20;
    font-size: 13px;
    font-weight: 700;
}

.report-date-field input {
    min-width: 190px;
    padding: 11px 12px;
    border: 1px solid #cbb7a7;
    border-radius: 9px;
    background: #e2d6ca;
    color: #2d211a;
    font-family: inherit;
    font-size: 14px;
    outline: none;
}

.report-date-field input:focus {
    border-color: #95603b;
    box-shadow: 0 0 0 3px rgba(149, 96, 59, 0.12);
}

.report-generate-button {
    height: 43px;
}

.report-error {
    margin-bottom: 20px;
    padding: 14px 16px;
    border-radius: 9px;
    background: #fbeceb;
    border: 1px solid #e6c0bc;
    color: #9e322b;
    font-size: 13px;
    font-weight: 600;
}

.report-loading {
    padding: 40px;
    text-align: center;
    color: #9a8679;
    font-size: 14px;
}

.report-summary-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 15px;
    margin-bottom: 20px;
}

.report-summary-card {
    padding: 19px;
    background: #e1d4c9;
    border: 1px solid #d0bdac;
    border-radius: 11px;
}

.report-summary-card span {
    display: block;
    margin-bottom: 8px;
    color: #78665a;
    font-size: 12px;
    font-weight: 600;
}

.report-summary-card strong {
    color: #412b20;
    font-size: 23px;
    font-weight: 800;
}

.chart-card {
    overflow: hidden;
}

.chart-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 20px;
    margin-bottom: 25px;
}

.chart-header h2 {
    margin: 0 0 6px;
    color: #432d20;
    font-size: 20px;
}

.chart-header p {
    margin: 0;
    color: #77675c;
    font-size: 13px;
}

.chart-total {
    min-width: 130px;
    text-align: right;
}

.chart-total span {
    display: block;
    color: #857367;
    font-size: 11px;
}

.chart-total strong {
    display: block;
    margin-top: 3px;
    color: #81502f;
    font-size: 18px;
}

.bar-chart {
    display: flex;
    width: 100%;
    min-height: 350px;
    padding-bottom: 5px;
}

.chart-y-axis {
    width: 78px;
    flex: 0 0 78px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 2px 10px 38px 0;
    text-align: right;
    color: #8a796e;
    font-size: 10px;
}

.chart-area {
    position: relative;
    flex: 1;
    min-width: 0;
    min-height: 350px;
    overflow-x: auto;
    overflow-y: hidden;
}

.chart-grid-line {
    position: absolute;
    left: 0;
    right: 0;
    border-top: 1px dashed #d2c1b4;
}

.line-top {
    top: 1px;
}

.line-middle {
    top: 50%;
}

.line-bottom {
    bottom: 38px;
}

.bars {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: flex-end;
    justify-content: space-around;
    gap: 10px;
    min-width: max-content;
    height: 100%;
    padding: 0 10px 0 10px;
}

.bar-column {
    width: 42px;
    flex: 0 0 42px;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
}

.bar-value {
    min-height: 19px;
    margin-bottom: 5px;
    color: #76523a;
    font-size: 9px;
    font-weight: 700;
    white-space: nowrap;
    transform: rotate(-45deg);
    transform-origin: bottom center;
}

.bar-track {
    position: relative;
    width: 28px;
    height: 245px;
    display: flex;
    align-items: flex-end;
    background: rgba(205, 190, 177, 0.28);
    border-radius: 6px 6px 0 0;
}

.bar {
    width: 100%;
    min-height: 4px;
    background: #8a5735;
    border-radius: 6px 6px 0 0;
    box-shadow: 0 3px 6px rgba(70, 45, 30, 0.15);
    transition: height 0.4s ease;
}

.bar-label {
    margin-top: 9px;
    color: #715f54;
    font-size: 10px;
    font-weight: 700;
    white-space: nowrap;
}

.report-details-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20px;
}

.detail-list {
    display: flex;
    flex-direction: column;
    gap: 0;
}

.detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 11px 0;
    border-bottom: 1px solid #dccdc0;
}

.detail-row:last-child {
    border-bottom: none;
}

.detail-row span {
    color: #756459;
    font-size: 13px;
}

.detail-row strong {
    color: #432d20;
    font-size: 13px;
}

.danger-number {
    color: #a02f29 !important;
}

.top-items {
    display: flex;
    flex-direction: column;
}

.top-item-row {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 13px 4px;
    border-bottom: 1px solid #dccdc0;
}

.top-item-row:last-child {
    border-bottom: none;
}

.item-rank {
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 30px;
    border-radius: 8px;
    background: #38271e;
    color: #f5e9df;
    font-size: 12px;
    font-weight: 800;
}

.item-info {
    flex: 1;
    min-width: 0;
}

.item-info strong {
    display: block;
    color: #432d20;
    font-size: 14px;
}

.item-info small {
    display: block;
    margin-top: 3px;
    color: #867468;
    font-size: 11px;
}

.item-sales {
    color: #81502f;
    font-size: 14px;
    font-weight: 800;
}

.report-empty {
    padding: 30px;
    text-align: center;
    color: #8a786c;
    font-size: 13px;
}

/* ===== Responsive ===== */

@media (max-width: 1050px) {
    .report-summary-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media (max-width: 950px) {
    .settings-grid {
        grid-template-columns: 1fr;
    }

    .form-group.full {
        grid-column: auto;
    }

    .report-details-grid {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 700px) {
    .settings-header {
        flex-direction: column;
    }

    .settings-header h1 {
        font-size: 26px;
    }

    .settings-tabs-wrapper {
        width: 100%;
        box-sizing: border-box;
    }

    .settings-tabs {
        width: 100%;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
    }

    .settings-tab {
        min-width: 0;
        width: 100%;
        padding: 0 10px;
    }

    .settings-card {
        padding: 20px;
    }

    .settings-actions {
        justify-content: stretch;
    }

    .primary-button {
        width: 100%;
    }

    .report-periods {
        width: 100%;
        display: grid;
        grid-template-columns: repeat(2, 1fr);
    }

    .report-period {
        width: 100%;
    }

    .report-summary-grid {
        grid-template-columns: 1fr;
    }

    .report-filters {
        flex-direction: column;
        align-items: stretch;
    }

    .report-date-field input {
        width: 100%;
    }

    .report-generate-button {
        width: 100%;
    }

    .chart-header {
        flex-direction: column;
    }

    .chart-total {
        text-align: left;
    }
}  `}</style>
        </div>
    );
}

export default AdminSettings;