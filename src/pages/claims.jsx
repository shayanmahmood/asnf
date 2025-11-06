import { useState } from "react";
import { addClaim } from "../api/claim/addClaim";
import { getBillsByCustomer } from "../api/Bills/getBills";

export default function ClaimPage() {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [bills, setBills] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalClaim, setTotalClaim] = useState(0);

  // Fetch bills by name + phone
  const handleShowHistory = async () => {
    if (!customerName.trim() || !phone.trim()) {
      alert("Please enter both customer name and phone number");
      return;
    }
    setLoading(true);
    const data = await getBillsByCustomer(customerName.trim(), phone.trim());
    setBills(data);
    setLoading(false);
  };

  // Toggle select item for claim
  const toggleItem = (billId, item) => {
    const key = `${billId}-${item.name}`;
    const alreadySelected = selectedItems.find((it) => it.key === key);

    let newSelection;
    if (alreadySelected) {
      newSelection = selectedItems.filter((it) => it.key !== key);
    } else {
      newSelection = [
        ...selectedItems,
        {
          ...item,
          billId,
          key,
          claimQty: 1,
          total: item.price,
          note: "", // 🆕 individual note
        },
      ];
    }

    updateTotals(newSelection);
  };

  // Handle quantity change
  const handleQtyChange = (key, newQty) => {
    const updatedItems = selectedItems.map((i) =>
      i.key === key
        ? {
            ...i,
            claimQty: Number(newQty) || 1,
            total: i.price * (Number(newQty) || 1),
          }
        : i
    );
    updateTotals(updatedItems);
  };

  // 🆕 Handle per-item note
  const handleItemNoteChange = (key, newNote) => {
    const updatedItems = selectedItems.map((i) =>
      i.key === key ? { ...i, note: newNote } : i
    );
    setSelectedItems(updatedItems);
  };

  const updateTotals = (newSelection) => {
    setSelectedItems(newSelection);
    setTotalClaim(newSelection.reduce((sum, i) => sum + i.total, 0));
  };

  // Save claim
  const handleConfirmClaim = async () => {
    if (selectedItems.length === 0) {
      alert("No items selected for claim!");
      return;
    }

    const claimData = {
      customerName,
      phone,
      items: selectedItems.map((i) => ({
        name: i.name,
        qty: i.claimQty,
        price: i.price,
        billId: i.billId,
        note: i.note || "",
      })),
      billRefs: [...new Set(selectedItems.map((i) => i.billId))],
      totalClaim,
      createdAt: new Date(),
    };

    try {
      await addClaim(claimData);
      alert("✅ Claim saved successfully!");
      setSelectedItems([]);
      setTotalClaim(0);
    } catch (err) {
      console.error(err);
      alert("❌ Error saving claim. See console for details.");
    }
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
        Customer Claim / Return
      </h1>

      {/* Customer Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-white p-4 rounded-xl shadow">
        <input
          type="text"
          placeholder="Customer Name"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          className="p-3 border rounded-lg w-full"
        />
        <input
          type="text"
          placeholder="Phone Number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="p-3 border rounded-lg w-full"
        />
        <button
          onClick={handleShowHistory}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-3 rounded-lg"
          disabled={loading}
        >
          {loading ? "Loading..." : "Show History"}
        </button>
      </div>

      {/* Bills History */}
      {bills.length > 0 ? (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            Purchase History ({bills.length} Bills)
          </h2>

          {bills.map((bill) => (
            <div
              key={bill.id}
              className="border-b py-3 last:border-none bg-gray-50 rounded-md mb-3 p-3"
            >
              <div className="flex justify-between font-medium text-gray-700 mb-2">
                <span>
                  🧾 Bill: {bill.id}
                  <br />
                  <span className="text-sm text-gray-500">
                    {bill.createdAt?.toDate
                      ? bill.createdAt.toDate().toLocaleString("en-PK", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "No Date"}
                  </span>
                </span>
                <span>Total: Rs. {bill.total}</span>
              </div>

              <div className="pl-4">
                {bill.items.map((item, idx) => {
                  const key = `${bill.id}-${item.name}`;
                  const selected = selectedItems.find((it) => it.key === key);

                  return (
                    <div
                      key={idx}
                      onClick={() => toggleItem(bill.id, item)}
                      className={`cursor-pointer flex justify-between items-start py-2 px-3 rounded-md mb-1 ${
                        selected
                          ? "bg-green-100 border-l-4 border-green-600"
                          : "bg-white hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex-1">
                        <span className="font-medium">{item.name}</span>{" "}
                        <span className="text-sm text-gray-500">
                          (Original: x{item.qty})
                        </span>
                        {selected && (
                          <div className="mt-2 flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <label className="text-sm text-gray-700">
                                Return Qty:
                              </label>
                              <input
                                type="number"
                                min="1"
                                max={item.qty}
                                value={selected.claimQty}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) =>
                                  handleQtyChange(key, e.target.value)
                                }
                                className="w-16 border rounded px-2 py-1 text-center"
                              />
                            </div>

                            {/* 🆕 Note field for item */}
                            <textarea
                              placeholder="Item note (optional)"
                              value={selected.note}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) =>
                                handleItemNoteChange(key, e.target.value)
                              }
                              className="border rounded p-2 text-sm w-full"
                            />
                          </div>
                        )}
                      </div>

                      <span className="text-gray-700 whitespace-nowrap ml-2">
                        Rs. {item.price * item.qty}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        !loading && (
          <p className="text-center text-gray-500 mt-8">
            No history found. Enter correct name & phone to view past bills.
          </p>
        )
      )}

      {/* Claim Summary */}
      {selectedItems.length > 0 && (
        <div className="mt-8 bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">
            Selected Claim Items
          </h2>

          <ul className="mb-4">
            {selectedItems.map((i, idx) => (
              <li key={idx} className="border-b py-2">
                <div className="flex justify-between">
                  <span>
                    {i.name} (x{i.claimQty})
                  </span>
                  <span>Rs. {i.price * i.claimQty}</span>
                </div>
                {i.note && (
                  <p className="text-sm text-gray-500 mt-1">📝 {i.note}</p>
                )}
              </li>
            ))}
          </ul>

          <div className="flex justify-between items-center font-bold text-lg">
            <span>Total Claim:</span>
            <span className="text-green-600">Rs. {totalClaim}</span>
          </div>

          <button
            onClick={handleConfirmClaim}
            className="mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold w-full"
          >
            Confirm Claim
          </button>
        </div>
      )}
    </div>
  );
}
