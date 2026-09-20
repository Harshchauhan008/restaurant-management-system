function About() {
  return (
    <section id="about" className="about-section">

      <div className="container about-grid">

        {/* LEFT SIDE */}
        <div className="about-content">

          <span className="eyebrow">
            About Us
          </span>

          <h2 className="section-title">
            A little rooftop
            <br />
            tucked into
            <br />
            Majnu ka Tila
          </h2>

          <p>
            Restaurant is a cozy rooftop cafe in the heart
            of Majnu ka Tila, serving comfort food with a
            view and a vibe worth staying for.
          </p>

          <p>
            From steaming momos and thukpa to pasta,
            noodles and refreshing beverages, our menu
            brings together flavors from across Asia and
            beyond.
          </p>

          <div className="about-features">

            <div className="about-feature">
              <span>✓</span>
              <span>Momos & Thukpa</span>
            </div>

            <div className="about-feature">
              <span>✓</span>
              <span>Rooftop + Lounge</span>
            </div>

            <div className="about-feature">
              <span>✓</span>
              <span>No-Rush Vibe</span>
            </div>

          </div>

          <a
            href="#menu"
            className="btn btn-primary"
          >
            See Full Menu
          </a>

        </div>


        {/* RIGHT SIDE */}
        <div className="about-image-wrapper">

          <img
            src="https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1000&q=85"
            alt="Thukpa at Restaurant"
            className="about-image"
          />

          <div className="about-image-label">
            <span>Restaurant</span>
            <strong>Comfort on a plate.</strong>
          </div>

        </div>

      </div>

    </section>
  );
}

export default About;