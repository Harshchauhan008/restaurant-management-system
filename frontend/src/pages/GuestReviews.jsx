import React, { useEffect, useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080/api";

const BACKEND_BASE_URL =
  API_BASE_URL.replace(/\/api\/?$/, "");

function GuestReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================================================
  // LOAD REVIEWS
  // =====================================================

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/reviews`
      );

      const text = await response.text();

      let data = [];

      if (text && text.trim()) {
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(
            "Invalid response received from server."
          );
        }
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "Failed to load reviews."
        );
      }

      setReviews(
        Array.isArray(data) ? data : []
      );
    } catch (err) {
      console.error(
        "Failed to load reviews:",
        err
      );

      setError(
        err.message ||
          "Unable to load reviews."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (date) => {
    if (!date) return "";

    try {
      return new Date(date).toLocaleDateString(
        "en-IN",
        {
          day: "numeric",
          month: "long",
          year: "numeric",
        }
      );
    } catch {
      return "";
    }
  };

  // =====================================================
  // RENDER STARS
  // =====================================================

  const renderStars = (rating) => {
    return (
      <div style={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            style={{
              ...styles.star,
              color:
                star <= rating
                  ? "#e8bd68"
                  : "#454545",
            }}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  // =====================================================
  // GO HOME
  // =====================================================

  const goHome = () => {
    window.location.href = "/";
  };

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div style={styles.page}>

      {/* ============================================= */}
      {/* HEADER */}
      {/* ============================================= */}

      <header style={styles.header}>

        <button
          type="button"
          onClick={goHome}
          style={styles.backButton}
        >
          ← Back to Home
        </button>

        <div style={styles.logo}>
          THE LOOKOUT
        </div>

        <div style={styles.divider}></div>

        <h1 style={styles.title}>
          Guest Experiences
        </h1>

        <p style={styles.subtitle}>
          Discover what our guests have to say
          about their experience with us.
        </p>

      </header>

      {/* ============================================= */}
      {/* MAIN CONTENT */}
      {/* ============================================= */}

      <main style={styles.container}>

        {/* =========================================== */}
        {/* LOADING */}
        {/* =========================================== */}

        {loading && (
          <div style={styles.centerMessage}>

            <div style={styles.loadingCircle}></div>

            <p style={styles.loadingText}>
              Loading guest reviews...
            </p>

          </div>
        )}

        {/* =========================================== */}
        {/* ERROR */}
        {/* =========================================== */}

        {!loading && error && (
          <div style={styles.centerMessage}>

            <div style={styles.error}>
              {error}
            </div>

            <button
              type="button"
              onClick={loadReviews}
              style={styles.retryButton}
            >
              Try Again
            </button>

          </div>
        )}

        {/* =========================================== */}
        {/* NO REVIEWS */}
        {/* =========================================== */}

        {!loading &&
          !error &&
          reviews.length === 0 && (
            <div style={styles.empty}>

              <div style={styles.emptyStars}>
                ★
              </div>

              <h2 style={styles.emptyTitle}>
                No Reviews Yet
              </h2>

              <p style={styles.emptyText}>
                Be the first guest to share
                your experience with us.
              </p>

            </div>
          )}

        {/* =========================================== */}
        {/* REVIEWS */}
        {/* =========================================== */}

        {!loading &&
          !error &&
          reviews.length > 0 && (
            <>

              <div style={styles.reviewHeader}>

                <div style={styles.reviewCount}>
                  {reviews.length}{" "}
                  {reviews.length === 1
                    ? "Guest Review"
                    : "Guest Reviews"}
                </div>

              </div>

              <div style={styles.reviewGrid}>

                {reviews.map((review) => (

                  <article
                    key={review.id}
                    style={styles.reviewCard}
                  >

                    {/* =========================== */}
                    {/* PHOTO */}
                    {/* =========================== */}

                    {review.photoUrl ? (
                      <div
                        style={
                          styles.imageWrapper
                        }
                      >

                        <img
                          src={
                            review.photoUrl.startsWith(
                              "http"
                            )
                              ? review.photoUrl
                              : `${BACKEND_BASE_URL}${review.photoUrl}`
                          }
                          alt={`${review.customerName}'s review`}
                          style={
                            styles.reviewImage
                          }
                        />

                      </div>
                    ) : (
                      <div
                        style={styles.noImage}
                      >
                        <span>
                          THE LOOKOUT
                        </span>
                      </div>
                    )}

                    {/* =========================== */}
                    {/* REVIEW CONTENT */}
                    {/* =========================== */}

                    <div
                      style={
                        styles.reviewContent
                      }
                    >

                      <h2
                        style={
                          styles.customerName
                        }
                      >
                        {review.customerName}
                      </h2>

                      {/* RATING */}

                      {renderStars(
                        review.rating
                      )}

                      {/* REVIEW TEXT */}

                      <p
                        style={
                          styles.reviewText
                        }
                      >
                        "{review.reviewText}"
                      </p>

                      {/* FOOTER */}

                      <div
                        style={
                          styles.reviewFooter
                        }
                      >

                        <span>
                          {formatDate(
                            review.createdAt
                          )}
                        </span>

                        {review.orderNumber && (
                          <span
                            style={
                              styles.verified
                            }
                          >
                            ✓ Verified Guest
                          </span>
                        )}

                      </div>

                    </div>

                  </article>

                ))}

              </div>

            </>
          )}

      </main>

      {/* ============================================= */}
      {/* FOOTER */}
      {/* ============================================= */}

      <footer style={styles.footer}>

        <div
          style={styles.footerDivider}
        ></div>

        <div style={styles.footerLogo}>
          THE LOOKOUT
        </div>

        <p>
          THANK YOU FOR YOUR SUPPORT
        </p>

      </footer>

    </div>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = {

  page: {
    minHeight: "100vh",
    width: "100%",
    background:
      "radial-gradient(circle at top left, #2b2117 0%, #141414 35%, #090909 100%)",
    color: "#f5f0e7",
    boxSizing: "border-box",
    fontFamily:
      "'Georgia', 'Times New Roman', serif",
  },

  header: {
    position: "relative",
    textAlign: "center",
    padding: "65px 20px 45px",
    boxSizing: "border-box",
  },

  backButton: {
    position: "absolute",
    top: "30px",
    left: "30px",
    border:
      "1px solid rgba(232,189,104,0.35)",
    background:
      "rgba(255,255,255,0.03)",
    color: "#d8cfc0",
    borderRadius: "8px",
    padding: "10px 17px",
    fontFamily:
      "Arial, Helvetica, sans-serif",
    fontSize: "14px",
    cursor: "pointer",
  },

  logo: {
    color: "#e8bd68",
    fontSize: "18px",
    letterSpacing: "7px",
    fontWeight: "500",
    marginBottom: "25px",
  },

  divider: {
    width: "45px",
    height: "2px",
    background: "#d9aa58",
    margin:
      "0 auto 28px",
  },

  title: {
    margin: "0 0 14px",
    fontSize: "42px",
    fontWeight: "500",
    color: "#f7f1e5",
  },

  subtitle: {
    margin: "0 auto",
    maxWidth: "620px",
    color: "#aaa",
    fontFamily:
      "Arial, Helvetica, sans-serif",
    fontSize: "17px",
    lineHeight: "1.7",
  },

  container: {
    width: "100%",
    maxWidth: "1200px",
    margin: "0 auto",
    padding:
      "10px 25px 70px",
    boxSizing: "border-box",
  },

  reviewHeader: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    marginBottom: "25px",
  },

  reviewCount: {
    color: "#a99f90",
    fontFamily:
      "Arial, Helvetica, sans-serif",
    fontSize: "13px",
    letterSpacing: "1.5px",
    textTransform: "uppercase",
  },

  reviewGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(330px, 1fr))",
    gap: "26px",
  },

  reviewCard: {
    background:
      "linear-gradient(145deg, #1b1b1b, #111111)",
    border:
      "1px solid rgba(255,255,255,0.10)",
    borderRadius: "15px",
    overflow: "hidden",
    boxShadow:
      "0 15px 40px rgba(0,0,0,0.38)",
    transition:
      "transform 0.2s ease, box-shadow 0.2s ease",
  },

  imageWrapper: {
    width: "100%",
    height: "260px",
    overflow: "hidden",
    background: "#151515",
  },

  reviewImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },

  noImage: {
    width: "100%",
    height: "165px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background:
      "linear-gradient(135deg, #241d15, #111111)",
    color: "#a47d43",
    fontSize: "13px",
    letterSpacing: "4px",
  },

  reviewContent: {
    padding: "26px",
  },

  customerName: {
    margin:
      "0 0 7px",
    color: "#f2e8d6",
    fontSize: "22px",
    fontWeight: "500",
  },

  stars: {
    display: "flex",
    gap: "2px",
  },

  star: {
    fontSize: "20px",
    lineHeight: "1",
  },

  reviewText: {
    margin:
      "22px 0 25px",
    color: "#c1bbb1",
    fontFamily:
      "Arial, Helvetica, sans-serif",
    fontSize: "15px",
    lineHeight: "1.8",
  },

  reviewFooter: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    gap: "10px",
    paddingTop: "15px",
    borderTop:
      "1px solid rgba(255,255,255,0.08)",
    color: "#777",
    fontFamily:
      "Arial, Helvetica, sans-serif",
    fontSize: "11px",
  },

  verified: {
    color: "#a88a59",
    whiteSpace: "nowrap",
  },

  centerMessage: {
    minHeight: "350px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    color: "#888",
    fontFamily:
      "Arial, Helvetica, sans-serif",
  },

  loadingCircle: {
    width: "35px",
    height: "35px",
    border:
      "3px solid rgba(232,189,104,0.2)",
    borderTop:
      "3px solid #e8bd68",
    borderRadius: "50%",
    marginBottom: "15px",
    animation:
      "spin 1s linear infinite",
  },

  loadingText: {
    color: "#888",
  },

  error: {
    padding: "15px 20px",
    background:
      "rgba(180,40,40,0.12)",
    border:
      "1px solid rgba(220,80,80,0.3)",
    borderRadius: "8px",
    color: "#ff9b9b",
    marginBottom: "15px",
  },

  retryButton: {
    padding: "10px 20px",
    border:
      "1px solid #b58b4d",
    borderRadius: "7px",
    background: "transparent",
    color: "#d9aa58",
    cursor: "pointer",
    fontSize: "14px",
  },

  empty: {
    minHeight: "350px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    fontFamily:
      "Arial, Helvetica, sans-serif",
  },

  emptyStars: {
    fontSize: "50px",
    color: "#8d6b37",
    marginBottom: "10px",
  },

  emptyTitle: {
    color: "#eee3d0",
    fontFamily:
      "Georgia, serif",
    fontSize: "26px",
    fontWeight: "500",
    margin:
      "0 0 10px",
  },

  emptyText: {
    color: "#888",
    fontSize: "15px",
  },

  footer: {
    textAlign: "center",
    padding:
      "35px 20px 45px",
    color: "#666",
    fontFamily:
      "Arial, Helvetica, sans-serif",
    fontSize: "10px",
    letterSpacing: "3px",
  },

  footerDivider: {
    width: "40px",
    height: "1px",
    background: "#8d6b37",
    margin:
      "0 auto 18px",
  },

  footerLogo: {
    color: "#a78a5a",
    fontFamily:
      "Georgia, serif",
    fontSize: "14px",
    letterSpacing: "5px",
    marginBottom: "12px",
  },
};

export default GuestReviews;