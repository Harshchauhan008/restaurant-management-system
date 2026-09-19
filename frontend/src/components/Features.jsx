import { useState } from "react";

const features = [
  {
    icon: "🌙",
    title: "Rooftop Seating",
    description:
      "Open-air terrace with fairy string lights and a panoramic evening view over the vibrant Tibetan Colony streets.",
    link: "Learn more →",

    details: {
      title: "Rooftop Seating",
      description:
        "Enjoy our open-air rooftop seating with fairy lights and a beautiful evening atmosphere in Majnu ka Tila.",
      points: [
        "Open-air rooftop seating",
        "Fairy string lights",
        "Evening view",
        "Comfortable seating",
        "Perfect for groups and friends",
      ],
    },
  },

  {
    icon: "🥢",
    title: "All-Day Comfort Menu",
    description:
      "Fresh steamed momos, steaming thukpa, chilli chicken, pasta, and iced beverages served daily from 11:30 AM.",
    link: "View details & dishes →",

    details: {
      title: "All-Day Comfort Menu",
      description:
        "Our menu brings together Tibetan, Asian and continental comfort food served throughout the day.",

      dishes: [
        {
          name: "Steamed Momos",
          price: "₹210",
        },
        {
          name: "Thukpa",
          price: "₹240",
        },
        {
          name: "Chilli Chicken",
          price: "₹320",
        },
        {
          name: "Hakka Noodles",
          price: "₹220",
        },
        {
          name: "Pasta",
          price: "₹280",
        },
        {
          name: "Iced Coffee",
          price: "₹160",
        },
      ],
    },
  },

  {
    icon: "💰",
    title: "Easy on the Wallet",
    description:
      "Generous portions crafted for students and regulars. Enjoy a full meal for two around ₹1,200.",
    link: "Learn more →",

    details: {
      title: "Easy on the Wallet",
      description:
        "We keep our portions generous and our pricing comfortable for students, regulars and groups.",

      points: [
        "Student-friendly pricing",
        "Generous portions",
        "Meal for two around ₹1,200",
        "Weekday offers",
        "Freshly prepared food",
      ],
    },
  },
];

function Features() {

  const [selectedFeature, setSelectedFeature] = useState(null);

  return (
    <section className="features-section">

      <div className="container">

        <div className="features-grid">

          {features.map((feature) => (

            <div
              className="card-3d feature-card"
              key={feature.title}
            >

              <div className="feature-icon">
                {feature.icon}
              </div>

              <h3>
                {feature.title}
              </h3>

              <p>
                {feature.description}
              </p>

              {/* ONLY THIS PART IS MADE CLICKABLE */}
              <button
                className="feature-link"
                onClick={() => setSelectedFeature(feature)}
              >
                {feature.link}
              </button>

            </div>

          ))}

        </div>

      </div>


      {/* =========================
          DETAIL POPUP
      ========================= */}

      {selectedFeature && (

        <div
          className="feature-modal-overlay"
          onClick={() => setSelectedFeature(null)}
        >

          <div
            className="feature-modal"
            onClick={(event) => event.stopPropagation()}
          >

            <button
              className="modal-close"
              onClick={() => setSelectedFeature(null)}
            >
              ×
            </button>


            <div className="modal-icon">
              {selectedFeature.icon}
            </div>


            <h2>
              {selectedFeature.details.title}
            </h2>


            <p className="modal-description">
              {selectedFeature.details.description}
            </p>


            {/* FOR ROOFTOP / WALLET */}

            {selectedFeature.details.points && (

              <div className="modal-points">

                {selectedFeature.details.points.map(
                  (point) => (

                    <div
                      className="modal-point"
                      key={point}
                    >

                      <span>✓</span>

                      <span>
                        {point}
                      </span>

                    </div>

                  )
                )}

              </div>

            )}


            {/* FOR MENU */}

            {selectedFeature.details.dishes && (

              <div className="modal-dishes">

                {selectedFeature.details.dishes.map(
                  (dish) => (

                    <div
                      className="modal-dish"
                      key={dish.name}
                    >

                      <span>
                        {dish.name}
                      </span>

                      <strong>
                        {dish.price}
                      </strong>

                    </div>

                  )
                )}

              </div>

            )}


            <button
              className="btn btn-primary modal-button"
              onClick={() => setSelectedFeature(null)}
            >
              Close
            </button>

          </div>

        </div>

      )}

    </section>
  );
}

export default Features;