import { useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080/api";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/auth/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
          }),
        }
      );

      const data = await response.text();

      if (!response.ok) {
        throw new Error(data || "Unable to process request.");
      }

      setMessage(
        data ||
          "If the email is registered, a password reset link has been sent."
      );
    } catch (err) {
      setError(err.message || "Unable to process request.");
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
          Forgot Password
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
          Enter your registered email address and we will
          send you a password reset link.
        </p>

        <form onSubmit={handleSubmit}>
          {/* =================================================
              EMAIL
          ================================================= */}

          <label
            style={{
              display: "block",
              marginBottom: "8px",
              color: "#F3ECE2",
            }}
          >
            Email Address
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your registered email"
            autoComplete="email"
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
                lineHeight: "1.5",
              }}
            >
              {error}
            </div>
          )}

          {/* =================================================
              SUCCESS MESSAGE
          ================================================= */}

          {message && (
            <div
              style={{
                marginBottom: "20px",
                padding: "12px",
                borderRadius: "8px",
                background: "rgba(70, 150, 90, 0.15)",
                color: "#9be7a8",
                fontSize: "14px",
                lineHeight: "1.5",
              }}
            >
              {message}
            </div>
          )}

          {/* =================================================
              SEND RESET LINK
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
            {loading ? "Sending..." : "Send Reset Link"}
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

export default ForgotPassword;