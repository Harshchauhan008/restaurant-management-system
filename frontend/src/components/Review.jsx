import { useEffect, useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080/api";

const BACKEND_BASE_URL =
  API_BASE_URL.replace(/\/api\/?$/, "");

function Review() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState({});
  const [startIndex, setStartIndex] = useState(0);

  // =====================================================
  // FETCH REVIEWS
  // =====================================================

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/reviews`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch reviews");
        }

        const data = await response.json();

        setReviews(
          Array.isArray(data) ? data : []
        );
      } catch (error) {
        console.error(
          "Error fetching reviews:",
          error
        );

        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);


  // =====================================================
  // REVIEW QUEUE
  // =====================================================
  //
  // Show 3 reviews at a time.
  //
  // Example:
  //
  // 1 2 3
  // 2 3 4
  // 3 4 5
  // 4 5 6
  //
  // One review moves out and the next one comes in.
  // =====================================================

  useEffect(() => {
    if (loading || reviews.length <= 3) {
      return;
    }

    const interval = setInterval(() => {
      setStartIndex((previousIndex) => {
        return (previousIndex + 1) % reviews.length;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [loading, reviews.length]);


  // =====================================================
  // RESET QUEUE WHEN REVIEWS CHANGE
  // =====================================================

  useEffect(() => {
    setStartIndex(0);
  }, [reviews.length]);


  // =====================================================
  // IMAGE URL
  // =====================================================

  const getImageUrl = (photoUrl) => {
    if (!photoUrl) {
      return "";
    }

    if (
      photoUrl.startsWith("http://") ||
      photoUrl.startsWith("https://")
    ) {
      return photoUrl;
    }

    return `${BACKEND_BASE_URL}${photoUrl}`;
  };


  // =====================================================
  // IMAGE ERROR
  // =====================================================

  const handleImageError = (reviewId) => {
    setImageErrors((previous) => ({
      ...previous,
      [reviewId]: true,
    }));
  };


  // =====================================================
  // DIFFERENT COLORS FOR NO-IMAGE REVIEWS
  // =====================================================

  const getNoImageColorClass = (index) => {
    const colors = [
      "review-color-0",
      "review-color-1",
      "review-color-2",
      "review-color-3",
      "review-color-4",
    ];

    return colors[index % colors.length];
  };


  // =====================================================
  // LOADING REVIEWS
  // =====================================================

  const loadingReviews = [
    {
      id: "loading-1",
      customerName: "Loading...",
      reviewText: "Loading guest experience...",
    },
    {
      id: "loading-2",
      customerName: "Loading...",
      reviewText: "Loading guest experience...",
    },
    {
      id: "loading-3",
      customerName: "Loading...",
      reviewText: "Loading guest experience...",
    },
  ];


  // =====================================================
  // GET 3 REVIEWS FROM QUEUE
  // =====================================================

  const getDisplayedReviews = () => {
    if (loading) {
      return loadingReviews;
    }

    if (reviews.length <= 3) {
      return reviews;
    }

    const displayed = [];

    for (let i = 0; i < 3; i++) {
      const index =
        (startIndex + i) % reviews.length;

      displayed.push(reviews[index]);
    }

    return displayed;
  };


  const displayedReviews =
    getDisplayedReviews();


  return (
    <section
      className="reviews-section"
      id="reviews"
    >
      <div className="container">

        {/* =================================================
            HEADING
        ================================================= */}

        <span className="eyebrow">
          GUEST EXPERIENCES
        </span>

        <h2 className="section-title">
          What Our Guests Say
        </h2>

        <p className="section-subtitle">
          Real experiences, favourite dishes and memorable
          evenings at Restaurant.
        </p>


        {/* =================================================
            REVIEWS
        ================================================= */}

        {!loading && reviews.length === 0 ? (

          <div
            style={{
              textAlign: "center",
              padding: "50px 20px",
              color: "#aaa",
              fontFamily: "var(--font-serif)",
            }}
          >
            No guest reviews yet.
          </div>

        ) : (

          <div className="reviews-grid">

            {displayedReviews.map(
              (review, index) => {

                const imageUrl =
                  getImageUrl(
                    review.photoUrl
                  );

                const hasImage =
                  Boolean(imageUrl) &&
                  !imageErrors[review.id];

                const noImageClass =
                  !hasImage
                    ? `review-card-no-image ${getNoImageColorClass(
                        index
                      )}`
                    : "";

                return (
                  <article
                    className={`review-card ${noImageClass}`}
                    key={review.id}
                  >

                    {/* =====================================
                        IMAGE / TESTIMONIAL
                    ===================================== */}

                    <div className="review-image-wrapper">

                      {loading ? (

                        <div
                          className="review-testimonial"
                          style={{
                            opacity: 0.55,
                          }}
                        >

                          <div className="review-brand">
                            Restaurant
                          </div>

                          <div className="review-brand-line"></div>

                          <p className="review-no-image-text">
                            "Loading guest experience..."
                          </p>

                          <div className="review-quote-mark">
                            ”
                          </div>

                        </div>

                      ) : hasImage ? (

                        <img
                          src={imageUrl}
                          alt={`${review.customerName || "Guest"}'s experience`}
                          className="review-image"
                          onError={() =>
                            handleImageError(
                              review.id
                            )
                          }
                        />

                      ) : (

                        <div className="review-testimonial">

                          {/* RESTAURANT NAME */}

                          <div className="review-brand">
                            Restaurant
                          </div>

                          {/* DECORATIVE LINE */}

                          <div className="review-brand-line"></div>

                          {/* REVIEW */}

                          <p className="review-no-image-text">
                            "{review.reviewText}"
                          </p>

                          {/* DECORATIVE QUOTE */}

                          <div className="review-quote-mark">
                            ”
                          </div>

                        </div>

                      )}

                    </div>


                    {/* =====================================
                        REVIEW CONTENT
                    ===================================== */}

                    <div className="review-content">

                      {!loading &&
                        hasImage && (

                          <p className="review-text">
                            "{review.reviewText}"
                          </p>

                        )}


                      {/* EMPTY ITEM SPACE */}

                      <div className="review-item"></div>


                      {/* CUSTOMER */}

                      <div className="review-author">

                        <strong>
                          {loading
                            ? "Loading..."
                            : review.customerName ||
                              "Guest"}
                        </strong>

                        <span>
                          Guest
                        </span>

                      </div>

                    </div>

                  </article>
                );
              }
            )}

          </div>

        )}

      </div>
    </section>
  );
}

export default Review;