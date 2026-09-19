function Navbar() {
  const openReservation = () => {
    window.dispatchEvent(
      new CustomEvent("openReservation")
    );
  };

  return (
    <header className="main-header">
      <div className="container nav-wrapper">

        <a href="#top" className="nav-logo">
          THE LOOKOUT
        </a>

        <nav className="nav-links">

          <a href="#top" className="active">
            Home
          </a>

          <a href="#about">
            About
          </a>

          <a href="#menu">
            Menu
          </a>

          <a href="#gallery">
            Gallery
          </a>

          <a href="#reviews">
            Reviews
          </a>

          <a href="#contact">
            Contact
          </a>

        </nav>

        <div className="nav-actions">

          {/* SEARCH */}
          <button
            className="icon-btn"
            id="openSearchBtn"
            title="Search Menu"
            type="button"
          >
            🔍
          </button>

          {/* LOGIN */}
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => {
              window.location.href = "/login";
            }}
          >
            Login
          </button>

          {/* RESERVE A TABLE */}
          <button
            className="btn btn-primary"
            type="button"
            onClick={openReservation}
          >
            Reserve a Table
          </button>

        </div>

      </div>
    </header>
  );
}

export default Navbar;