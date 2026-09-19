import { Link } from "react-router-dom";

import UtilityBar from "../components/UtilityBar";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Features from "../components/Features";
import About from "../components/About";
import Gallery from "../components/Gallery";
import Promo from "../components/Promo";
import MenuPreview from "../components/MenuPreview";
import Stats from "../components/Stats";
import Review from "../components/Review";
import Location from "../components/Location";
import Reservation from "../components/Reservation";
import CTA from "../components/CTA";
import Footer from "../components/Footer";

function Home() {
  return (
    <div id="top">

      <UtilityBar />

      <Navbar />

      <main>

        <Hero />

        <Features />

        <About />

        <Gallery />

        <Promo />

        <MenuPreview />

        <Stats />

        {/* =====================================================
            HOME REVIEW PREVIEW
        ===================================================== */}

        <Review />

        {/* =====================================================
            VIEW ALL GUEST REVIEWS
        ===================================================== */}

        <div
          className="feedback-button"
          style={{
            textAlign: "center",
            marginTop: "-30px",
            marginBottom: "60px",
          }}
        >
          <Link
            to="/guest-reviews"
            className="btn btn-primary"
          >
            View All Guest Reviews
          </Link>
        </div>

        <Location />

        <Reservation />

        <CTA />

      </main>

      <Footer />

    </div>
  );
}

export default Home;