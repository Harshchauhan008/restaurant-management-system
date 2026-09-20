const galleryImages = [
  {
    id: 1,
    title: "Steamed Momos",
    image:
      "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=1000&q=85",
  },
  {
    id: 2,
    title: "Rooftop Dining",
    image:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1000&q=85",
  },
  {
    id: 3,
    title: "Thukpa",
    image:
      "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1000&q=85",
  },
  {
    id: 4,
    title: "Pasta",
    image:
      "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1000&q=85",
  },
  {
    id: 5,
    title: "Coffee",
    image:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1000&q=85",
  },
];

function Gallery() {
  return (
    <section id="gallery" className="gallery-section">

      <div className="container">

        <div className="section-heading">

          <span className="eyebrow">
            Our Gallery
          </span>

          <h2 className="section-title">
            A glimpse of Restaurant
          </h2>

          <p className="section-subtitle">
            Good food, cozy corners and a rooftop
            atmosphere made for long evenings.
          </p>

        </div>


        <div className="gallery-grid">

          {galleryImages.map((item) => (
            <div
              className="gallery-item"
              key={item.id}
            >

              <img
                src={item.image}
                alt={item.title}
              />

              <div className="gallery-overlay">
                <span>{item.title}</span>
              </div>

            </div>
          ))}

        </div>

      </div>

    </section>
  );
}

export default Gallery;