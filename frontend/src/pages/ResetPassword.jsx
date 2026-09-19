import { useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080/api";

function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // =====================================================
  // GET RESET TOKEN FROM URL
  // Example:
  // /reset-password?token=abc123
  // =====================================================

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    // =====================================================
    // CHECK TOKEN
    // =====================================================

    if (!token) {
      setError(
        "Invalid or missing password reset link."
      );
      return;
    }

    // =====================================================
    // CHECK PASSWORD
    // =====================================================

    if (!newPassword.trim()) {
      setError("Please enter a new password.");
      return;
    }

    if (newPassword.length < 6) {
      setError(
        "Password must be at least 6 characters long."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/auth/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: token,
            newPassword: newPassword,
          }),
        }
      );

      const data = await response.text();

      if (!response.ok) {
        throw new Error(
          data || "Unable to reset password."
        );
      }

      setMessage(
        data ||
          "Password reset successfully. Please login with your new password."
      );

      // Clear password fields
      setNewPassword("");
      setConfirmPassword("");

    } catch (err) {
      setError(
        err.message || "Unable to reset password."
      );
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
        {/* =================================================
            TITLE
        ================================================= */}

        <h1
          style={{
            margin: "0 0 8px",
            textAlign: "center",
            color: "#F3ECE2",
            fontFamily: "'Lora', Georgia, serif",
          }}
        >
          THE LOOKOUT
        </h1>

        <p
          style={{
            margin: "0 0 30px",
            textAlign: "center",
            color: "#B8AFA3",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          Reset Password
        </p>

        {/* =================================================
            DESCRIPTION
        ================================================= */}

        <p
          style={{
            margin: "0 0 25px",
            textAlign: "center",
            color: "#B8AFA3",
            fontSize: "14px",
            lineHeight: "1.5",
          }}
        >
          Enter your new password below.
        </p>

        <form onSubmit={handleSubmit}>

          {/* =================================================
              NEW PASSWORD
          ================================================= */}

          <label
            style={{
              display: "block",
              marginBottom: "8px",
              color: "#F3ECE2",
            }}
          >
            New Password
          </label>

          <div
            style={{
              position: "relative",
              width: "100%",
              marginBottom: "20px",
            }}
          >
            <input
              type={
                showNewPassword
                  ? "text"
                  : "password"
              }
              value={newPassword}
              onChange={(e) =>
                setNewPassword(e.target.value)
              }
              placeholder="Enter new password"
              autoComplete="new-password"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "13px 58px 13px 14px",
                borderRadius: "8px",
                border:
                  "1px solid rgba(201,123,74,0.25)",
                background: "#211C18",
                color: "#F3ECE2",
                outline: "none",
                fontSize: "15px",
              }}
            />

            <button
              type="button"
              onClick={() =>
                setShowNewPassword(
                  (current) => !current
                )
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
              {showNewPassword ? "Hide" : "Show"}
            </button>
          </div>

          {/* =================================================
              CONFIRM PASSWORD
          ================================================= */}

          <label
            style={{
              display: "block",
              marginBottom: "8px",
              color: "#F3ECE2",
            }}
          >
            Confirm Password
          </label>

          <div
            style={{
              position: "relative",
              width: "100%",
              marginBottom: "20px",
            }}
          >
            <input
              type={
                showConfirmPassword
                  ? "text"
                  : "password"
              }
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(e.target.value)
              }
              placeholder="Confirm new password"
              autoComplete="new-password"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "13px 58px 13px 14px",
                borderRadius: "8px",
                border:
                  "1px solid rgba(201,123,74,0.25)",
                background: "#211C18",
                color: "#F3ECE2",
                outline: "none",
                fontSize: "15px",
              }}
            />

            <button
              type="button"
              onClick={() =>
                setShowConfirmPassword(
                  (current) => !current
                )
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
              {showConfirmPassword
                ? "Hide"
                : "Show"}
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
                background:
                  "rgba(180, 60, 60, 0.15)",
                color: "#ff9b9b",
                fontSize: "14px",
                lineHeight: "1.5",
              }}
            >
              {error}
            </div>
          )}

          {/* =================================================
              SUCCESS
          ================================================= */}

          {message && (
            <div
              style={{
                marginBottom: "20px",
                padding: "12px",
                borderRadius: "8px",
                background:
                  "rgba(70, 150, 90, 0.15)",
                color: "#9be7a8",
                fontSize: "14px",
                lineHeight: "1.5",
              }}
            >
              {message}
            </div>
          )}

          {/* =================================================
              RESET PASSWORD
          ================================================= */}

          <button
            type="submit"
            disabled={loading || !!message}
            style={{
              width: "100%",
              border: "none",
              borderRadius: "8px",
              padding: "14px",
              background: "#C97B4A",
              color: "#fff",
              fontSize: "16px",
              fontWeight: "600",
              cursor:
                loading || message
                  ? "not-allowed"
                  : "pointer",
              opacity:
                loading || message
                  ? 0.7
                  : 1,
            }}
          >
            {loading
              ? "Resetting..."
              : "Reset Password"}
          </button>
        </form>

        {/* =================================================
            BACK TO LOGIN
        ================================================= */}

        <button
          type="button"
          onClick={() => {
            window.location.href = "/login";
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
          ← Back to Login
        </button>
      </div>
    </div>
  );
}

export default ResetPassword;