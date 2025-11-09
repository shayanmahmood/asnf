import { useEffect, useState } from "react";
import { getAllItems } from "../api/item/getAllItem";
import { addBill } from "../api/Bills/addBill";
import { getBillsByCustomer } from "../api/Bills/getBills";
export default function Bills() {
  const [formData, setFormData] = useState({
    customerName: "",
    phone: "",
    paymentType: "credit",
    paidAmount: "",
  });

  const [items, setItems] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);
  const [bills, setBills] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [totalDue, setTotalDue] = useState(0);

  // ✅ Fetch available items
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const data = await getAllItems();
        setAvailableItems(data);
      } catch (err) {
        console.error("❌ Error fetching available items:", err);
      }
    };
    fetchItems();
  }, []);

  // ➕ Add / Remove item
  const addItem = () =>
    setItems([
      ...items,
      {
        name: "",
        qty: 1,
        price: 0,
        total: 0,
        schemeAvailable: false,
        applyScheme: false,
        schemeDiscount: 0,
      },
    ]);

  const removeItem = (index) => {
    const updated = [...items];
    updated.splice(index, 1);
    setItems(updated);
  };

  // 🎯 Handle item change + scheme detection
  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;

    if (field === "name") {
      const selected = availableItems.find((i) => i.name === value);
      if (selected) {
        updated[index].price = selected.price;
        updated[index].schemeActive = selected.schemeActive;
        updated[index].schemeQty = selected.schemeQty || 0;
        updated[index].schemeDiscount = selected.schemeDiscount || 0;
      }
    }

    const qty = Number(updated[index].qty) || 1;
    const price = Number(updated[index].price) || 0;
    updated[index].total = qty * price;

    // Detect scheme eligibility
    const itemData = availableItems.find((i) => i.name === updated[index].name);
    if (itemData?.schemeActive && qty >= itemData.schemeQty) {
      updated[index].schemeAvailable = true;
    } else {
      updated[index].schemeAvailable = false;
      updated[index].applyScheme = false;
    }

    setItems(updated);
  };

  const toggleScheme = (index) => {
    const updated = [...items];
    updated[index].applyScheme = !updated[index].applyScheme;
    setItems(updated);
  };

  // 💰 Calculate totals
  const grossTotal = items.reduce((sum, i) => sum + i.total, 0);
  const totalSchemeDiscount = items
    .filter((i) => i.applyScheme)
    .reduce((sum, i) => sum + (i.schemeDiscount || 0), 0);
  const grandTotal = Math.max(grossTotal - totalSchemeDiscount, 0);

  // 🧾 Fetch customer history
  const fetchHistory = async () => {
    try {
      if (!formData.customerName || !formData.phone) return;
      setLoading(true);
      const data = await getBillsByCustomer(
        formData.customerName.trim(),
        formData.phone.trim()
      );
      setBills(data);
      const due = data.reduce((sum, b) => sum + (b.total - b.paidAmount), 0);
      setTotalDue(due);
    } catch (err) {
      console.error("History fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  // 💾 Submit new bill
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    // 🛑 Validation
    if (!formData.customerName.trim() || !formData.phone.trim()) {
      setMessage("❌ Please enter customer name and phone.");
      return;
    }

    if (items.length === 0) {
      setMessage("❌ Please add at least one item before saving the bill.");
      return;
    }

    if (formData.paymentType === "debit") {
      if (!formData.paidAmount || Number(formData.paidAmount) <= 0) {
        setMessage("❌ Please enter the amount paid for debit payment.");
        return;
      }
    }

    setLoading(true);
    try {
      await addBill({
        ...formData,
        total: grandTotal,
        paidAmount:
          formData.paymentType === "credit"
            ? grandTotal
            : Number(formData.paidAmount || 0),
        items,
        schemeApplied: totalSchemeDiscount > 0,
        schemeAmount: totalSchemeDiscount,
      });
      setMessage("✅ Bill added successfully!");
      setItems([]);
      setBills([]); // <--- clear history section
    setTotalDue(0);
      setFormData({
        customerName: "",
        phone: "",
        paymentType: "credit",
        paidAmount: "",
      });
      await fetchHistory();
    } catch (err) {
      console.error(err);
      setMessage("❌ Error adding bill!");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  // 🔄 Auto-fetch history when name + phone both filled
  useEffect(() => {
    if (formData.customerName && formData.phone) {
      fetchHistory();
    }
  }, [formData.customerName, formData.phone]);

  return (
    <div className="min-h-screen bg-gray-100 flex gap-6 p-10">
      {/* LEFT SIDE - ADD BILL FORM */}
      <div className="flex-1 bg-white rounded-2xl p-8 shadow-lg space-y-6">
        <h1 className="text-3xl font-bold text-center text-gray-800">
          🧾 Add New Bill
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Customer Info */}
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              name="customerName"
              value={formData.customerName}
              onChange={handleChange}
              placeholder="Customer Name"
              required
              className="border px-3 py-2 rounded-md border-gray-300"
            />
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Phone Number"
              required
              className="border px-3 py-2 rounded-md border-gray-300"
            />
          </div>

          {/* Payment Type */}
          <div className="grid grid-cols-2 gap-4">
            <select
              name="paymentType"
              value={formData.paymentType}
              onChange={handleChange}
              className="border px-3 py-2 rounded-md border-gray-300"
            >
              <option value="credit">Credit (Full Paid)</option>
              <option value="debit">Debit (Partial Paid)</option>
            </select>
            {formData.paymentType === "debit" && (
              <input
                type="number"
                name="paidAmount"
                value={formData.paidAmount}
                onChange={handleChange}
                placeholder="Amount Paid"
                className="border px-3 py-2 rounded-md border-gray-300"
              />
            )}
          </div>

          {/* ITEMS SECTION */}
          <div className="bg-gray-50 rounded-xl p-4 shadow-inner">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-semibold text-gray-800">Items</h2>
              <button
                type="button"
                onClick={addItem}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md"
              >
                + Add Item
              </button>
            </div>

            {items.length === 0 && (
              <p className="text-sm text-gray-500 italic">No items yet</p>
            )}

            {items.map((item, index) => (
              <div
                key={index}
                className="border bg-white p-3 rounded-lg mb-3 shadow-sm space-y-1"
              >
                <div className="flex items-center gap-2">
                  <select
                    value={item.name}
                    onChange={(e) =>
                      handleItemChange(index, "name", e.target.value)
                    }
                    className="flex-1 border rounded px-2 py-1"
                  >
                    <option value="">Select Item</option>
                    {availableItems.map((i) => (
                      <option key={i.id} value={i.name}>
                        {i.name} — Rs {i.price}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="1"
                    value={item.qty}
                    onChange={(e) =>
                      handleItemChange(index, "qty", e.target.value)
                    }
                    className="w-20 border rounded px-2 py-1 text-center"
                  />
                  <span className="text-gray-600 w-20 text-right">
                    Rs {item.price}
                  </span>
                  <span className="font-medium w-24 text-right text-green-700">
                    Rs {item.total.toLocaleString()}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="text-red-500 hover:text-red-700 ml-2"
                  >
                    🗑
                  </button>
                </div>

                {item.schemeAvailable && (
                  <div className="bg-green-50 text-sm text-green-700 rounded-md px-3 py-2 flex justify-between items-center">
                    <span>
                      ⚡ Scheme available! Buy {item.schemeQty}+ → −Rs{" "}
                      {item.schemeDiscount}
                    </span>
                    <label className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={item.applyScheme}
                        onChange={() => toggleScheme(index)}
                      />
                      <span>Apply</span>
                    </label>
                  </div>
                )}
              </div>
            ))}

            {items.length > 0 && (
              <div className="mt-4 border-t pt-3 text-lg font-semibold space-y-1">
                <div className="flex justify-between">
                  <span>Gross Total:</span>
                  <span>Rs {grossTotal.toLocaleString()}</span>
                </div>
                {totalSchemeDiscount > 0 && (
                  <div className="flex justify-between text-yellow-700">
                    <span>Scheme Discount:</span>
                    <span>−Rs {totalSchemeDiscount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-green-600">
                  <span>Grand Total:</span>
                  <span>Rs {grandTotal.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-md font-semibold"
            >
              {loading ? "Saving..." : "Save Bill"}
            </button>
            <button
              type="button"
              onClick={() => setShowHistory((p) => !p)}
              className="flex-1 bg-gray-700 hover:bg-gray-800 text-white py-3 rounded-md font-semibold"
            >
              {showHistory ? "Hide History" : "Show History"}
            </button>
          </div>

          {message && (
            <p
              className={`text-center ${
                message.includes("Error") ? "text-red-600" : "text-green-600"
              }`}
            >
              {message}
            </p>
          )}
        </form>
      </div>

      {/* RIGHT SIDE - HISTORY */}
      {showHistory && (
        <div className="w-[350px] bg-white rounded-2xl p-6 shadow-lg overflow-y-auto space-y-3">
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            📜 Customer History
          </h2>

          {bills.length === 0 ? (
            <p className="text-gray-500 text-sm">No previous bills.</p>
          ) : (
            bills.map((bill) => (
              <details
                key={bill.id}
                className="border rounded-lg p-2 bg-gray-50 open:bg-gray-100"
              >
                <summary className="cursor-pointer font-semibold flex justify-between">
                  <span>
                    {bill.createdAt?.seconds
                      ? new Date(bill.createdAt.seconds * 1000).toLocaleString()
                      : "Unknown date"}
                  </span>
                  <span>Total: Rs {bill.total.toLocaleString()}</span>
                </summary>
                <div className="mt-2 space-y-1 text-sm text-gray-700">
                  {bill.items?.map((it, i) => (
                    <div key={i} className="flex justify-between">
                      <span>
                        {it.name} × {it.qty}
                      </span>
                      <span>Rs {(it.qty * it.price).toLocaleString()}</span>
                    </div>
                  ))}
                  {bill.schemeApplied && (
                    <div className="flex justify-between text-yellow-700 font-medium border-t pt-1">
                      <span>Scheme (−)</span>
                      <span>Rs {bill.schemeAmount?.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="border-t mt-2 pt-1 flex justify-between font-medium">
                    <span>Paid:</span>
                    <span>Rs {bill.paidAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Remaining:</span>
                    <span>
                      Rs {(bill.total - bill.paidAmount).toLocaleString()}
                    </span>
                  </div>
                </div>
              </details>
            ))
          )}

          {bills.length > 0 && (
            <>
              <hr className="my-2" />
              <div className="flex justify-between font-semibold text-lg">
                <span>Grand Total:</span>
                <span>
                  Rs{" "}
                  {bills.reduce((sum, b) => sum + b.total, 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-red-600 font-semibold">
                <span>Total Due:</span>
                <span>Rs {totalDue.toLocaleString()}</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
