import { Form } from "react-bootstrap";
import { useState, useEffect } from "react";

function TableComponent({ columns, data, actions, selectable = false, onBulkSelect }) {
  const [selected, setSelected] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 576);

  // Listen for screen resizing
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 576);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // MOBILE → only show these columns
  const mobileColumns = ["id", "name"];

  const filteredColumns = isMobile
    ? columns.filter((c) => mobileColumns.includes(c.key))
    : columns;

  const handleSelect = (id) => {
    const newSelected = selected.includes(id)
      ? selected.filter((i) => i !== id)
      : [...selected, id];

    setSelected(newSelected);
    onBulkSelect?.(data.filter((d) => newSelected.includes(d.id)));
  };

  return (
    <div>
      <style>{`
        /* ================= FONT IMPORTS ================= */
        @import url('https://fonts.googleapis.com/css2?family=Salsa&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap');

        /* ===== FIGMA TABLE STYLING ===== */

        .figma-table-container {
          border: 2px solid #000;
          border-radius: 12px;
          overflow: hidden;
          width: 100%;
          font-family: "Instrument Sans", sans-serif !important;
        }

        table.figma-table {
          width: 100%;
          border-collapse: collapse;
        }

        .figma-table th {
          background: #136CED;
          color: white;
          padding: 12px;
          text-align: center;
          font-weight: 600;
          border: 1px solid #000;
          font-size: 15px;
          font-family: "Salsa", cursive !important;
        }

        .figma-table td {
          padding: 8px;
          text-align: center;
          border: 1px solid #000;
          font-size: 15px;
          vertical-align: middle;
          font-family: "Instrument Sans", sans-serif !important;
        }

        .figma-actions {
          display: flex;
          justify-content: center;
          gap: 8px;
          flex-wrap: wrap;
          font-family: "Instrument Sans", sans-serif !important;
        }

        /* MOBILE ACTION BUTTONS SMALLER */
        @media (max-width: 992px) {
          .figma-actions button {
            padding: 2px 8px !important;
            font-size: 12px !important;
          }
        }
      `}</style>

      {/* TABLE */}
      <div className="figma-table-container">
        <table className="figma-table">
          <thead>
            <tr>
              {selectable && <th>Select</th>}

              {filteredColumns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}

              {actions && <th>Actions</th>}
            </tr>
          </thead>

          <tbody>
            {data.length > 0 ? (
              data.map((row) => (
                <tr key={row.id}>
                  {selectable && (
                    <td>
                      <Form.Check
                        type="checkbox"
                        checked={selected.includes(row.id)}
                        onChange={() => handleSelect(row.id)}
                      />
                    </td>
                  )}

                  {filteredColumns.map((col) => (
                    <td key={col.key}>{row[col.key] ?? "—"}</td>
                  ))}

                  {actions && (
                    <td>
                      <div className="figma-actions">{actions(row)}</div>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={filteredColumns.length + (selectable ? 2 : 1)}
                  style={{ padding: "20px", textAlign: "center", color: "#777" }}
                >
                  No records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TableComponent;
