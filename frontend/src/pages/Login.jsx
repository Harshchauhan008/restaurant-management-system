import { useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080/api";

function Login() {
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");

    if (!employeeId.trim() || !password.trim()) {
      setError("Please enter employee ID and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            employeeId: employeeId.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // =====================================================
      // SAVE COMMON LOGIN INFORMATION
      // =====================================================

      localStorage.setItem("token", data.token);
      localStorage.setItem("employeeId", data.employeeId);
      localStorage.setItem("fullName", data.fullName);
      localStorage.setItem("role", data.role);

      // =====================================================
      // SAVE ROLE-SPECIFIC TOKEN
      // This allows different employee sessions to coexist
      // in the same browser.
      // =====================================================

      switch (data.role) {
        case "ADMIN":
          localStorage.setItem("adminToken", data.token);
          break;

        case "KITCHEN":
          localStorage.setItem("kitchenToken", data.token);
          break;

        case "WAITER":
          localStorage.setItem("waiterToken", data.token);
          break;

        case "CASHIER":
          localStorage.setItem("cashierToken", data.token);
          break;

        case "RECEPTIONIST":
          localStorage.setItem(
            "receptionToken",
            data.token
          );
          break;

        default:
          setError("Unknown employee role.");
          return;
      }

      // =====================================================
      // REDIRECT ACCORDING TO ROLE
      // =====================================================

      switch (data.role) {
        case "ADMIN":
          window.location.href = "/admin";
          break;

        case "KITCHEN":
          window.location.href = "/kitchen";
          break;

        case "WAITER":
          window.location.href = "/waiter";
          break;

        case "CASHIER":
          window.location.href = "/cashier";
          break;

        case "RECEPTIONIST":
          window.location.href = "/reception";
          break;

        default:
          setError("Unknown employee role.");
      }
    } catch (err) {
      setError(err.message || "Unable to login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#1B1714",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "#25201C",
          borderRadius: "16px",
          padding: "40px",
          boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
        }}
      >
        <h1
          style={{
            margin: "0 0 8px",
            textAlign: "center",
            color: "#F3ECE2",
            fontFamily: "'Lora', Georgia, serif",
          }}
        >
          Restaurant
        </h1>

        <p
          style={{
            margin: "0 0 30px",
            textAlign: "center",
            color: "#B8AFA3",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          Employee Login
        </p>

        <form onSubmit={handleLogin}>
          {/* =================================================
              EMPLOYEE ID
          ================================================= */}

          <label
            style={{
              display: "block",
              marginBottom: "8px",
              color: "#F3ECE2",
            }}
          >
            Employee ID
          </label>

          <input
            type="text"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            placeholder="Enter employee ID"
            autoComplete="username"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "13px 14px",
              marginBottom: "20px",
              borderRadius: "8px",
              border: "1px solid rgba(201,123,74,0.25)",
              background: "#211C18",
              color: "#F3ECE2",
              outline: "none",
              fontSize: "15px",
            }}
          />

          {/* =================================================
              PASSWORD
          ================================================= */}

          <label
            style={{
              display: "block",
              marginBottom: "8px",
              color: "#F3ECE2",
            }}
          >
            Password
          </label>

          <div
            style={{
              position: "relative",
              width: "100%",
              marginBottom: "8px",
            }}
          >
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoComplete="current-password"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "13px 58px 13px 14px",
                borderRadius: "8px",
                border: "1px solid rgba(201,123,74,0.25)",
                background: "#211C18",
                color: "#F3ECE2",
                outline: "none",
                fontSize: "15px",
              }}
            />

            {/* SHOW / HIDE BUTTON */}

            <button
              type="button"
              onClick={() =>
                setShowPassword((current) => !current)
              }
              aria-label={
                showPassword
                  ? "Hide password"
                  : "Show password"
              }
              style={{
                position: "absolute",
                right: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                border: "none",
                background: "transparent",
                color: "#C97B4A",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                padding: "6px 8px",
              }}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {/* =================================================
              FORGOT PASSWORD
          ================================================= */}

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: "20px",
            }}
          >
            <button
              type="button"
              onClick={() => {
                window.location.href = "/forgot-password";
              }}
              style={{
                border: "none",
                background: "transparent",
                color: "#C97B4A",
                cursor: "pointer",
                fontSize: "13px",
                padding: "0",
              }}
            >
              Forgot Password?
            </button>
          </div>

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div
              style={{
                marginBottom: "20px",
                padding: "12px",
                borderRadius: "8px",
                background: "rgba(180, 60, 60, 0.15)",
                color: "#ff9b9b",
                fontSize: "14px",
              }}
            >
              {error}
            </div>
          )}

          {/* =================================================
              LOGIN BUTTON
          ================================================= */}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              border: "none",
              borderRadius: "8px",
              padding: "14px",
              background: "#C97B4A",
              color: "#fff",
              fontSize: "16px",
              fontWeight: "600",
              cursor: loading
                ? "not-allowed"
                : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* =================================================
            BACK TO WEBSITE
        ================================================= */}

        <button
          type="button"
          onClick={() => {
            window.location.href = "/";
          }}
          style={{
            width: "100%",
            marginTop: "15px",
            padding: "12px",
            border: "none",
            background: "transparent",
            color: "#B8AFA3",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          ← Back to website
        </button>
      </div>
    </div>
  );
}

export default Login;