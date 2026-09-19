function Footer() {
  return (
    <footer className="footer">

      <div className="container footer-grid">

        {/* CONTACT */}
        <div className="footer-column">

          <h3>
            Contact & Location
          </h3>

          <p>
            Majnu ka Tila,
            New Delhi, India
          </p>

          <p>
            +91 XXXXX XXXXX
          </p>

        </div>


        {/* BRAND */}
        <div className="footer-brand">

          <h2>
            THE LOOKOUT
          </h2>

          <p>
            Rooftop food, good views
            and memorable evenings.
          </p>

          <div className="social-links">

            <a href="#">
              Instagram
            </a>

            <a href="#">
              Facebook
            </a>

          </div>

        </div>


        {/* HOURS */}
        <div className="footer-column">

          <h3>
            Cafe Hours
          </h3>

          <p>
            Monday – Sunday
          </p>

          <p>
            11:30 AM – 11:00 PM
          </p>

        </div>

      </div>


      <div className="footer-bottom">

        <div className="container">

          <span>
            © 2026 The Lookout. All rights reserved.
          </span>

          <a href="#top">
            Back to top ↑
          </a>

        </div>

      </div>

    </footer>
  );
}

export default Footer;