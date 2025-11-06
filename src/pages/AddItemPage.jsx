import { useState, useEffect } from "react";
import { addItem } from "../api/item/addItem";
import { getAllItems } from "../api/item/getAllItem";
import { updateItem } from "../api/item/updateItem";
import { deleteItem } from "../api/item/deleteItem";

export default function AddItemPage() {
  const [form, setForm] = useState({
    name: "",
    price: "",
    stock: "",
    schemeActive: false,
    schemeQty: "",
    schemeDiscount: "",
  });

  const [items, setItems] = useState([]);
  const [editingItem, setEditingItem] = useState(null);

  // Fetch all items
  const fetchItems = async () => {
    try {
      const data = await getAllItems();
      setItems(data);
    } catch (err) {
      console.error("❌ Error fetching items:", err);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Add new item
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.stock) {
      alert("⚠️ Please fill in all required fields");
      return;
    }

    try {
      await addItem({
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
        remaining: Number(form.stock),
        schemeActive: form.schemeActive,
        schemeQty: form.schemeActive ? Number(form.schemeQty || 0) : 0,
        schemeDiscount: form.schemeActive
          ? Number(form.schemeDiscount || 0)
          : 0,
        createdAt: new Date(),
      });

      alert("✅ Item added successfully!");
      setForm({
        name: "",
        price: "",
        stock: "",
        schemeActive: false,
        schemeQty: "",
        schemeDiscount: "",
      });
      fetchItems();
    } catch (err) {
      console.error("❌ Error adding item:", err);
      alert("Error adding item!");
    }
  };

  // Update existing item
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      await updateItem(editingItem.id, {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
        schemeQty: form.schemeActive ? Number(form.schemeQty || 0) : 0,
        schemeDiscount: form.schemeActive
          ? Number(form.schemeDiscount || 0)
          : 0,
      });
      alert("✅ Item updated!");
      setEditingItem(null);
      setForm({
        name: "",
        price: "",
        stock: "",
        schemeActive: false,
        schemeQty: "",
        schemeDiscount: "",
      });
      fetchItems();
    } catch (err) {
      console.error("❌ Error updating item:", err);
    }
  };

  // Delete item
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      await deleteItem(id);
      fetchItems();
      alert("🗑️ Item deleted");
    } catch (err) {
      console.error("❌ Error deleting item:", err);
    }
  };

  // Fill form for edit
  const startEdit = (item) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      price: item.price,
      stock: item.stock,
      schemeActive: item.schemeActive,
      schemeQty: item.schemeQty,
      schemeDiscount: item.schemeDiscount,
    });
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
        🧩 {editingItem ? "Edit Item" : "Add New Item"}
      </h1>

      {/* Add/Edit Item Form */}
      <form
        onSubmit={editingItem ? handleUpdate : handleAdd}
        className="bg-white rounded-xl shadow p-6 mb-8 grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <input
          type="text"
          placeholder="Item Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="p-3 border rounded-lg w-full"
          required
        />

        <input
          type="number"
          placeholder="Price"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          className="p-3 border rounded-lg w-full"
          required
        />

        <input
          type="number"
          placeholder="Stock Quantity"
          value={form.stock}
          onChange={(e) => setForm({ ...form, stock: e.target.value })}
          className="p-3 border rounded-lg w-full"
          required
        />

        {/* Scheme Section */}
        <div className="flex items-center gap-3 col-span-full">
          <label className="text-gray-700 font-medium">Scheme Active:</label>
          <input
            type="checkbox"
            checked={form.schemeActive}
            onChange={(e) =>
              setForm({ ...form, schemeActive: e.target.checked })
            }
            className="w-5 h-5"
          />
        </div>

        {form.schemeActive && (
          <>
            <input
              type="number"
              placeholder="Scheme Qty"
              value={form.schemeQty}
              onChange={(e) => setForm({ ...form, schemeQty: e.target.value })}
              className="p-3 border rounded-lg w-full"
              required
            />
            <input
              type="number"
              placeholder="Scheme Discount (Rs.)"
              value={form.schemeDiscount}
              onChange={(e) =>
                setForm({ ...form, schemeDiscount: e.target.value })
              }
              className="p-3 border rounded-lg w-full"
              required
            />
          </>
        )}

        <div className="col-span-full flex justify-between">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg"
          >
            {editingItem ? "💾 Update Item" : "➕ Add Item"}
          </button>

          {editingItem && (
            <button
              type="button"
              onClick={() => {
                setEditingItem(null);
                setForm({
                  name: "",
                  price: "",
                  stock: "",
                  schemeActive: false,
                  schemeQty: "",
                  schemeDiscount: "",
                });
              }}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-6 rounded-lg"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Item Table */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold mb-4">📦 Item List</h2>
        {items.length === 0 ? (
          <p className="text-gray-500 text-center">No items yet</p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-3">Name</th>
                <th className="p-3">Price</th>
                <th className="p-3">Stock</th>
                <th className="p-3">Scheme</th>
                <th className="p-3">Created</th>
                <th className="p-3">Updated</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{i.name}</td>
                  <td className="p-3">Rs. {i.price}</td>
                  <td className="p-3">{i.stock}</td>
                  <td className="p-3 text-sm">
                    {i.schemeActive ? (
                      <>
                        ✅ {i.schemeQty}+ pcs → −Rs {i.schemeDiscount}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="p-3 text-sm text-gray-500">
                    {i.createdAt?.seconds
                      ? new Date(i.createdAt.seconds * 1000).toLocaleString()
                      : "—"}
                  </td>
                  <td className="p-3 text-sm text-gray-500">
                    {i.updatedAt?.seconds
                      ? new Date(i.updatedAt.seconds * 1000).toLocaleString()
                      : "—"}
                  </td>
                  <td className="p-3 flex gap-3 justify-center">
                    <button
                      onClick={() => startEdit(i)}
                      className="text-blue-600 hover:underline"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(i.id)}
                      className="text-red-600 hover:underline"
                    >
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
