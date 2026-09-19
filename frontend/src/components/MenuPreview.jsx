import { useState } from "react";

const categories = [
  {
    key: "all",
    label: "All Dishes",
  },
  {
    key: "tibetan",
    label: "Tibetan Specials",
  },
  {
    key: "chinese",
    label: "Pan-Asian & Chinese",
  },
  {
    key: "northindian",
    label: "North Indian Comfort",
  },
  {
    key: "continental",
    label: "Continental & Pasta",
  },
  {
    key: "beverages",
    label: "Tea & Beverages",
  },
];


const menuItems = [
  {
    id: 1,
    category: "tibetan",

    name: "Steamed Pork / Veg Momos (8 pcs)",

    price: "₹210",

    description:
      "Juicy handmade dumplings served with fiery garlic-chilli chutney and clear soup.",

    image:
      "https://images.unsplash.com/photo-1626804475297-41608ea09aeb?auto=format&fit=crop&w=900&q=80",
  },

  {
    id: 2,
    category: "tibetan",

    name: "Chicken Thukpa Noodle Soup",

    price: "₹240",

    description:
      "Traditional Tibetan noodle soup with tender chicken strips, bok choy, and ginger broth.",

    image:
      "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=900&q=80",
  },

  {
    id: 3,
    category: "chinese",

    name: "Crispy Chilli Chicken (Dry / Gravy)",

    price: "₹290",

    description:
      "Wok-tossed chicken chunks with bell peppers, green chillies, and dark soy sauce.",

    image:
      "https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=900&q=80",
  },

  {
    id: 4,
    category: "chinese",

    name: "Schezwan Hakka Noodles",

    price: "₹220",

    description:
      "Spicy stir-fried thin noodles tossed with crunchy scallions and house Schezwan paste.",

    image:
      "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=900&q=80",
  },

  {
    id: 5,
    category: "northindian",

    name: "Butter Chicken + Garlic Naan Combo",

    price: "₹340",

    description:
      "Rich velvety tomato-butter gravy with tandoori chicken tikka and crisp butter garlic naan.",

    image:
      "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=900&q=80",
  },

  {
    id: 6,
    category: "continental",

    name: "Creamy White Sauce Alfredo Pasta",

    price: "₹280",

    description:
      "Penne pasta tossed in garlic parmesan white cream sauce with grilled mushrooms and basil.",

    image:
      "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=900&q=80",
  },

  {
    id: 7,
    category: "beverages",

    name: "Traditional Tibetan Butter Tea (Po Cha)",

    price: "₹120",

    description:
      "Warming churned tea brewed with yak butter, brick tea leaves, and sea salt.",

    image:
      "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=900&q=80",
  },
];


function MenuPreview() {

  const [activeCategory, setActiveCategory] =
    useState("all");


  const [previewImage, setPreviewImage] =
    useState(menuItems[0].image);


  const filteredItems =
    activeCategory === "all"
      ? menuItems
      : menuItems.filter(
          (item) =>
            item.category === activeCategory
        );


  const handleCategoryChange = (category) => {

    setActiveCategory(category);

    const firstItem =
      category === "all"
        ? menuItems[0]
        : menuItems.find(
            (item) =>
              item.category === category
          );

    if (firstItem) {
      setPreviewImage(firstItem.image);
    }
  };


  return (

    <section
      className="menu-section"
      id="menu"
    >

      <div className="container">


        {/* =========================
            HEADER
        ========================= */}

        <span className="eyebrow">
          FROM THE KITCHEN
        </span>


        <h2 className="section-title">
          Our Menu
        </h2>


        <p className="section-subtitle">
          Comforting dishes cooked fresh on
          order. Click any tab or hover an item
          to preview.
        </p>


        {/* =========================
            CATEGORY TABS
        ========================= */}

        <div className="menu-tabs">

          {categories.map((category) => (

            <button
              key={category.key}
              className={
                activeCategory === category.key
                  ? "tab-btn active"
                  : "tab-btn"
              }
              onClick={() =>
                handleCategoryChange(
                  category.key
                )
              }
            >
              {category.label}
            </button>

          ))}

        </div>


        {/* =========================
            MENU DISPLAY
        ========================= */}

        <div className="menu-display">


          {/* LEFT — IMAGE */}

          <div className="menu-preview">

            <img
              src={previewImage}
              alt="Dish Preview"
              className="menu-preview-img"
            />

            <div className="menu-preview-hint">
              <span>☝</span>

              Hover over menu items
              to change preview
            </div>

          </div>


          {/* RIGHT — MENU LIST */}

          <div className="menu-list">

            {filteredItems.map((item) => (

              <div
                className="menu-item"
                key={item.id}

                onMouseEnter={() =>
                  setPreviewImage(
                    item.image
                  )
                }
              >

                <div className="menu-item-header">

                  <span className="item-name">
                    {item.name}
                  </span>


                  <span className="item-dots"></span>


                  <span className="item-price">
                    {item.price}
                  </span>

                </div>


                <div className="item-desc">
                  {item.description}
                </div>

              </div>

            ))}

          </div>

        </div>

      </div>

    </section>

  );
}


export default MenuPreview;