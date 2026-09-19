function Hero() {
  const openReservation = () => {
    window.dispatchEvent(
      new Event("openReservation")
    );
  };

  return (
    <section className="hero-section">

      <img
        src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=2200&q=90"
        alt="The Lookout Rooftop"
        className="hero-bg"
      />

      <div className="hero-overlay"></div>

      <div className="container hero-content">

        <div className="hero-est">
          EST. 2019 · MAJNU KA TILA, DELHI
        </div>

        <h1 className="hero-title">
          The Lookout
        </h1>

        <p className="hero-tagline">
          Cozy rooftop cafe serving authentic Tibetan,
          North Indian, Chinese & Continental comfort
          food in the heart of the colony.
        </p>

        <div className="hero-buttons">

          <a
            href="#menu"
            className="btn btn-primary"
          >
            🍴 View Menu
          </a>

          <button
            type="button"
            className="btn btn-outline"
            style={{ color: "#000" }}
            onClick={openReservation}
          >
            📅 Reserve a Table
          </button>

        </div>

      </div>

    </section>
  );
}

export default Hero;