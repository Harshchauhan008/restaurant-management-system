const stats = [
  {
    number: "6+",
    label: "Years",
  },
  {
    number: "4",
    label: "Cuisines",
  },
  {
    number: "45+",
    label: "Seats",
  },
  {
    number: "100%",
    label: "Fresh",
  },
];

function Stats() {
  return (
    <section className="stats-section">

      <div className="container stats-grid">

        {stats.map((stat) => (
          <div
            className="stat-item"
            key={stat.label}
          >

            <strong>
              {stat.number}
            </strong>

            <span>
              {stat.label}
            </span>

          </div>
        ))}

      </div>

    </section>
  );
}

export default Stats;