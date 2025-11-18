import { Table, Form } from "react-bootstrap";
import { useState } from "react";

function TableComponent({ columns, data, actions, selectable = false, onBulkSelect }) {
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");

  const handleSelect = (id) => {
    const newSelected = selected.includes(id)
      ? selected.filter((i) => i !== id)
      : [...selected, id];
    setSelected(newSelected);
    onBulkSelect?.(data.filter((d) => newSelected.includes(d.id)));
  };

  const filteredData = data.filter((d) =>
    Object.values(d).some((val) => val?.toString().toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <Form.Control
        type="text"
        placeholder="Search..."
        className="mb-3"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <Table bordered hover responsive className="shadow-sm">
        <thead className="table-dark">
          <tr>
            {selectable && <th>Select</th>}
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
            {actions && <th>Actions</th>}
          </tr>
        </thead>

        <tbody>
          {filteredData.length > 0 ? (
            filteredData.map((row) => (
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
                {columns.map((col) => (
                  <td key={col.key}>{row[col.key] ?? "—"}</td>
                ))}
                {actions && <td>{actions(row)}</td>}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length + (selectable ? 2 : 1)} className="text-center text-muted">
                No records found
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );
}

export default TableComponent;
