function CTA() {
  return (
    <section className="cta-section">

      <div className="container cta-grid">

        <div className="cta-card">

          <div className="cta-icon">
            ◷
          </div>

          <span className="eyebrow">
            We're Open
          </span>

          <h2>
            Open Daily
          </h2>

          <p>
            11:30 AM – 11:00 PM
          </p>

          <a
            href="#menu"
            className="btn btn-outline"
          >
            View Full Menu
          </a>

        </div>


        <div className="cta-card">

          <div className="cta-icon">
            ☎
          </div>

          <span className="eyebrow">
            Planning a Visit?
          </span>

          <h2>
            Reserve Your Table
          </h2>

          <p>
            Call us at +91 XXXXX XXXXX
          </p>

          <button className="btn btn-primary">
            Reserve a Table
          </button>

        </div>

      </div>

    </section>
  );
}

export default CTA;