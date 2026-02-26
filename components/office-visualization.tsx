interface OfficeVisualizationProps {
  engineers: number;
  sales: number;
}

const FLOOR_CAPACITY = 50;
const MAX_RENDER_CAPACITY = 500;

type DeskRole = 'eng' | 'sales' | 'empty';

export default function OfficeVisualization({
  engineers,
  sales,
}: OfficeVisualizationProps) {
  const total = engineers + sales;
  const capacity = Math.max(
    FLOOR_CAPACITY,
    Math.ceil(total / FLOOR_CAPACITY) * FLOOR_CAPACITY,
  );

  if (capacity > MAX_RENDER_CAPACITY) {
    return (
      <section className="card">
        <h3>Office</h3>
        <p>
          Headcount {total}/{capacity} desks
        </p>
        <p>
          Visualization simplified for large teams ({MAX_RENDER_CAPACITY}+ desks).
        </p>
        <div className="line-legend">
          <span>
            <i className="dot eng" /> Engineering ({engineers})
          </span>
          <span>
            <i className="dot sales" /> Sales ({sales})
          </span>
          <span>
            <i className="dot empty" /> Empty ({capacity - total})
          </span>
        </div>
      </section>
    );
  }

  const floorCount = Math.max(1, Math.ceil(capacity / FLOOR_CAPACITY));
  const emptyCount = capacity - total;

  const deskRoles: DeskRole[] = [
    ...Array.from({ length: emptyCount }, () => 'empty' as const),
    ...Array.from({ length: engineers }, () => 'eng' as const),
    ...Array.from({ length: sales }, () => 'sales' as const),
  ];

  return (
    <section className="card">
      <h3>Office</h3>
      <p>
        Headcount {total}/{capacity} desks
      </p>
      <div className="line-legend">
        <span>
          <i className="dot eng" /> Engineering ({engineers})
        </span>
        <span>
          <i className="dot sales" /> Sales ({sales})
        </span>
        <span>
          <i className="dot empty" /> Empty ({capacity - total})
        </span>
      </div>

      <div
        className="stacked-building"
        role="img"
        aria-label="Stacked isometric office floors"
      >
        {Array.from({ length: floorCount }).map((_, floorIdx) => {
          const start = floorIdx * FLOOR_CAPACITY;
          const floorDesks = deskRoles.slice(start, start + FLOOR_CAPACITY);
          const floorNumber = floorCount - floorIdx;
          return (
            <section
              key={floorIdx}
              className="floor-layer"
              style={{ zIndex: floorCount - floorIdx }}
            >
              <div className="floor-head">Floor {floorNumber}</div>
              <div className="iso-floor">
                {floorDesks.map((role, idx) => (
                  <div
                    key={`${floorIdx}-${idx}`}
                    className={`iso-desk ${role}`}
                  >
                    <span className="top" />
                    <span className="left" />
                    <span className="right" />
                    {role !== 'empty' ? (
                      <span className={`worker ${role}`} />
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}
