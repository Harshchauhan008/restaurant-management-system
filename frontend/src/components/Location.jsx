function Location() {
  return (
    <section
      id="contact"
      className="location-section"
    >

      <div className="container location-grid">

        {/* MAP */}
        <div className="map-wrapper">

          <iframe
            title="The Lookout Location"
            src="https://www.google.com/maps?q=Majnu+ka+Tila+Delhi&output=embed"
            loading="lazy"
          />

        </div>


        {/* INFORMATION */}
        <div className="location-content">

          <span className="eyebrow">
            Find Us
          </span>

          <h2 className="section-title">
            Come visit The Lookout
          </h2>

          <p>
            Located in the heart of Majnu ka Tila,
            our rooftop is easy to find and even easier
            to stay at.
          </p>


          <div className="contact-details">

            <div className="contact-item">

              <span>📍</span>

              <div>
                <strong>Address</strong>

                <p>
                  Majnu ka Tila,
                  New Delhi, India
                </p>
              </div>

            </div>


            <div className="contact-item">

              <span>☎</span>

              <div>
                <strong>Phone</strong>

                <p>
                  +91 XXXXX XXXXX
                </p>
              </div>

            </div>


            <div className="contact-item">

              <span>◷</span>

              <div>
                <strong>Opening Hours</strong>

                <p>
                  Daily · 11:30 AM – 11:00 PM
                </p>
              </div>

            </div>

          </div>


          <a
            href="https://www.google.com/maps/search/?api=1&query=Majnu+ka+Tila+Delhi"
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary"
          >
            Get Directions ↗
          </a>

        </div>

      </div>

    </section>
  );
}

export default Location;