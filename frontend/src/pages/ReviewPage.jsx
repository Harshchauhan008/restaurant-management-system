import React, { useRef, useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080/api";

function ReviewPage() {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fileInputRef = useRef(null);

  const params = new URLSearchParams(window.location.search);
  const reviewToken = params.get("token");

  // =====================================================
  // PHOTO SELECTION
  // =====================================================

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB.");
      return;
    }

    setError("");
    setMessage("");

    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }

    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  // =====================================================
  // REMOVE PHOTO
  // =====================================================

  const removePhoto = () => {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }

    setPhoto(null);
    setPhotoPreview("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // =====================================================
  // UPLOAD PHOTO
  // =====================================================

  const uploadPhoto = async () => {
    if (!photo) {
      return null;
    }

    const formData = new FormData();

    formData.append("image", photo);

    const response = await fetch(
      `${API_BASE_URL}/reviews/upload-image`,
      {
        method: "POST",
        body: formData,
      }
    );

    const text = await response.text();

    let data = {};

    if (text && text.trim()) {
      try {
        data = JSON.parse(text);
      } catch {
        data = {
          rawResponse: text,
        };
      }
    }

    if (!response.ok) {
      throw new Error(
        data.message ||
          data.error ||
          data.rawResponse ||
          "Failed to upload image."
      );
    }

    if (!data.photoUrl) {
      throw new Error(
        "Image uploaded but photo URL was not returned."
      );
    }

    return data.photoUrl;
  };

  // =====================================================
  // SUBMIT REVIEW
  // =====================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!reviewToken) {
      setError("Invalid review link.");
      return;
    }

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (rating < 1 || rating > 5) {
      setError("Please select a rating.");
      return;
    }

    if (!reviewText.trim()) {
      setError("Please write your review.");
      return;
    }

    setLoading(true);

    try {
      // -------------------------------------------------
      // STEP 1: UPLOAD IMAGE
      // -------------------------------------------------

      let photoUrl = null;

      if (photo) {
        photoUrl = await uploadPhoto();
      }

      // -------------------------------------------------
      // STEP 2: CREATE REVIEW
      // -------------------------------------------------

      const response = await fetch(
        `${API_BASE_URL}/reviews`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reviewToken: reviewToken,
            customerName: name.trim(),
            rating: rating,
            reviewText: reviewText.trim(),
            photoUrl: photoUrl,
          }),
        }
      );

      const text = await response.text();

      let data = {};

      if (text && text.trim()) {
        try {
          data = JSON.parse(text);
        } catch {
          data = {
            rawResponse: text,
          };
        }
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            data.rawResponse ||
            "Failed to submit review."
        );
      }

      // -------------------------------------------------
      // SUCCESS
      // -------------------------------------------------

      setMessage(
        "Thank you! Your review has been submitted successfully."
      );

      setName("");
      setRating(5);
      setReviewText("");

      removePhoto();
    } catch (err) {
      console.error("Review submission error:", err);

      setError(
        err.message ||
          "Something went wrong while submitting your review."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // INVALID TOKEN
  // =====================================================

  if (!reviewToken) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.header}>
            <h1 style={styles.logo}>THE LOOKOUT</h1>

            <div style={styles.divider}></div>

            <h2 style={styles.title}>
              Invalid Review Link
            </h2>

            <p style={styles.text}>
              This review link is missing or invalid.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* ============================================= */}
        {/* HEADER */}
        {/* ============================================= */}

        <div style={styles.header}>

          <h1 style={styles.logo}>
            THE LOOKOUT
          </h1>

          <div style={styles.divider}></div>

          <h2 style={styles.title}>
            Share Your Experience
          </h2>

          <p style={styles.text}>
            We would love to hear about your
            experience with us.
          </p>

        </div>

        {/* ============================================= */}
        {/* FORM */}
        {/* ============================================= */}

        <form onSubmit={handleSubmit}>

          {/* NAME */}

          <div style={styles.formGroup}>
            <label style={styles.label}>
              Your Name
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              placeholder="Enter your name"
              style={styles.input}
              disabled={loading}
            />
          </div>

          {/* RATING */}

          <div style={styles.formGroup}>
            <label style={styles.label}>
              Your Rating
            </label>

            <div style={styles.stars}>
              {[1, 2, 3, 4, 5].map(
                (star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() =>
                      setRating(star)
                    }
                    disabled={loading}
                    style={{
                      ...styles.starButton,
                      color:
                        star <= rating
                          ? "#e8bd68"
                          : "#555",
                      opacity:
                        star <= rating
                          ? 1
                          : 0.55,
                    }}
                  >
                    ★
                  </button>
                )
              )}
            </div>
          </div>

          {/* REVIEW */}

          <div style={styles.formGroup}>
            <label style={styles.label}>
              Your Review
            </label>

            <textarea
              value={reviewText}
              onChange={(e) =>
                setReviewText(e.target.value)
              }
              placeholder="Tell us about your experience..."
              rows="6"
              style={styles.textarea}
              disabled={loading}
            />
          </div>

          {/* PHOTO */}

          <div style={styles.formGroup}>
            <label style={styles.label}>
              Add a Photo{" "}
              <span style={styles.optional}>
                (optional)
              </span>
            </label>

            <div style={styles.fileWrapper}>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="environment"
                onChange={handlePhotoChange}
                style={styles.fileInput}
                disabled={loading}
              />

            </div>
          </div>

          {/* PHOTO PREVIEW */}

          <div
            style={{
              ...styles.previewContainer,
              display: photoPreview
                ? "block"
                : "flex",
            }}
          >

            {photoPreview ? (
              <>
                <img
                  src={photoPreview}
                  alt="Review preview"
                  style={styles.preview}
                />

                <button
                  type="button"
                  onClick={removePhoto}
                  disabled={loading}
                  style={styles.removeButton}
                >
                  Remove Photo
                </button>
              </>
            ) : (
              <>
                <div style={styles.photoIcon}>
                  ♧
                </div>

                <div style={styles.previewText}>
                  Your photo will appear here
                </div>
              </>
            )}

          </div>

          {/* ERROR */}

          {error && (
            <div style={styles.error}>
              {error}
            </div>
          )}

          {/* SUCCESS */}

          {message && (
            <div style={styles.success}>
              {message}
            </div>
          )}

          {/* SUBMIT */}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.submitButton,
              opacity: loading ? 0.7 : 1,
              cursor: loading
                ? "not-allowed"
                : "pointer",
            }}
          >
            {loading
              ? photo
                ? "Uploading & Submitting..."
                : "Submitting..."
              : "Submit Review"}
          </button>

        </form>

        {/* ============================================= */}
        {/* FOOTER */}
        {/* ============================================= */}

        <div style={styles.footer}>

          <div style={styles.footerDivider}></div>

          <span>
            THANK YOU FOR YOUR SUPPORT
          </span>

        </div>

      </div>
    </div>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = {

  // ================================================
  // PAGE
  // ================================================

  page: {
    minHeight: "100vh",
    width: "100%",
    background:
      "radial-gradient(circle at top left, #2b2117 0%, #141414 35%, #090909 100%)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "40px 15px",
    boxSizing: "border-box",
    position: "relative",
    overflow: "hidden",
    fontFamily:
      "'Georgia', 'Times New Roman', serif",
  },

  // ================================================
  // CARD
  // ================================================

  card: {
    width: "100%",
    maxWidth: "850px",
    background:
      "linear-gradient(145deg, #171717, #101010)",
    border:
      "1px solid rgba(232, 189, 104, 0.22)",
    borderRadius: "20px",
    padding: "48px",
    boxSizing: "border-box",
    boxShadow:
      "0 30px 80px rgba(0,0,0,0.65)",
    position: "relative",
  },

  // ================================================
  // HEADER
  // ================================================

  header: {
    textAlign: "center",
    marginBottom: "42px",
  },

  logo: {
    margin: "0 0 25px",
    color: "#e8bd68",
    fontSize: "18px",
    fontWeight: "500",
    letterSpacing: "7px",
    textTransform: "uppercase",
  },

  divider: {
    width: "45px",
    height: "2px",
    background: "#d9aa58",
    margin: "0 auto 28px",
  },

  title: {
    margin: "0 0 14px",
    color: "#f7f1e5",
    fontSize: "38px",
    lineHeight: "1.2",
    fontWeight: "500",
  },

  text: {
    margin: "0",
    color: "#aaa",
    fontFamily:
      "Arial, Helvetica, sans-serif",
    fontSize: "17px",
    lineHeight: "1.7",
  },

  // ================================================
  // FORM
  // ================================================

  formGroup: {
    marginBottom: "28px",
  },

  label: {
    display: "block",
    marginBottom: "10px",
    color: "#eee0c4",
    fontFamily:
      "Arial, Helvetica, sans-serif",
    fontSize: "16px",
    fontWeight: "600",
  },

  optional: {
    color: "#888",
    fontWeight: "400",
  },

  // ================================================
  // INPUT
  // ================================================

  input: {
    width: "100%",
    height: "58px",
    padding: "0 18px",
    boxSizing: "border-box",
    background: "#191919",
    border:
      "1px solid rgba(255,255,255,0.18)",
    borderRadius: "10px",
    outline: "none",
    color: "#f4f4f4",
    fontFamily:
      "Arial, Helvetica, sans-serif",
    fontSize: "16px",
  },

  // ================================================
  // TEXTAREA
  // ================================================

  textarea: {
    width: "100%",
    minHeight: "160px",
    padding: "17px 18px",
    boxSizing: "border-box",
    background: "#191919",
    border:
      "1px solid rgba(255,255,255,0.18)",
    borderRadius: "10px",
    outline: "none",
    color: "#f4f4f4",
    fontFamily:
      "Arial, Helvetica, sans-serif",
    fontSize: "16px",
    lineHeight: "1.6",
    resize: "vertical",
  },

  // ================================================
  // STARS
  // ================================================

  stars: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    minHeight: "50px",
  },

  starButton: {
    border: "none",
    background: "transparent",
    padding: "0",
    margin: "0",
    fontSize: "40px",
    lineHeight: "1",
    cursor: "pointer",
    transition:
      "transform 0.2s ease, color 0.2s ease",
  },

  // ================================================
  // FILE INPUT
  // ================================================

  fileWrapper: {
    width: "100%",
    boxSizing: "border-box",
  },

  fileInput: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px",
    background: "#191919",
    border:
      "1px solid rgba(232,189,104,0.35)",
    borderRadius: "10px",
    color: "#aaa",
    fontFamily:
      "Arial, Helvetica, sans-serif",
    fontSize: "15px",
    cursor: "pointer",
  },

  // ================================================
  // PREVIEW
  // ================================================

  previewContainer: {
    width: "100%",
    minHeight: "115px",
    marginTop: "-5px",
    marginBottom: "28px",
    border:
      "1px dashed rgba(255,255,255,0.28)",
    borderRadius: "10px",
    boxSizing: "border-box",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: "12px",
  },

  preview: {
    display: "block",
    width: "100%",
    maxHeight: "330px",
    objectFit: "cover",
    borderRadius: "8px",
  },

  photoIcon: {
    fontFamily: "Arial, sans-serif",
    fontSize: "28px",
    color: "#777",
    marginBottom: "8px",
  },

  previewText: {
    color: "#777",
    fontFamily:
      "Arial, Helvetica, sans-serif",
    fontSize: "14px",
  },

  removeButton: {
    display: "block",
    margin: "10px auto 2px",
    border: "none",
    background: "transparent",
    color: "#d9aa58",
    fontFamily:
      "Arial, Helvetica, sans-serif",
    fontSize: "14px",
    cursor: "pointer",
    textDecoration: "underline",
  },

  // ================================================
  // ERROR
  // ================================================

  error: {
    marginBottom: "20px",
    padding: "14px 16px",
    background: "rgba(180, 35, 35, 0.15)",
    border:
      "1px solid rgba(220, 80, 80, 0.35)",
    borderRadius: "8px",
    color: "#ff9999",
    fontFamily:
      "Arial, Helvetica, sans-serif",
    fontSize: "14px",
  },

  // ================================================
  // SUCCESS
  // ================================================

  success: {
    marginBottom: "20px",
    padding: "14px 16px",
    background: "rgba(70, 140, 80, 0.12)",
    border:
      "1px solid rgba(100, 180, 110, 0.3)",
    borderRadius: "8px",
    color: "#a8dda9",
    fontFamily:
      "Arial, Helvetica, sans-serif",
    fontSize: "14px",
  },

  // ================================================
  // SUBMIT BUTTON
  // ================================================

  submitButton: {
    width: "100%",
    height: "58px",
    marginTop: "5px",
    border: "none",
    borderRadius: "9px",
    background:
      "linear-gradient(135deg, #e5b967, #c99543)",
    color: "#111",
    fontFamily:
      "Arial, Helvetica, sans-serif",
    fontSize: "16px",
    fontWeight: "700",
    letterSpacing: "0.2px",
    boxShadow:
      "0 8px 25px rgba(0,0,0,0.3)",
    transition:
      "transform 0.2s ease, opacity 0.2s ease",
  },

  // ================================================
  // FOOTER
  // ================================================

  footer: {
    marginTop: "38px",
    textAlign: "center",
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
    margin: "0 auto 16px",
  },
};

export default ReviewPage;