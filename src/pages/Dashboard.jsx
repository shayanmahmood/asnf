import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebase";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalDiscount: 0,
    totalClaims: 0,
    profit: 0,
    customers: 0,
  });

  const [items, setItems] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      let totalSales = 0,
        totalDiscount = 0,
        totalClaims = 0,
        customers = 0;

      // 🧾 Bills
      const billsSnap = await getDocs(collection(db, "bills"));
      billsSnap.forEach((doc) => {
        const bill = doc.data();
        totalSales += Number(bill.total || 0);
        totalDiscount += Number(
          bill.schemeApplied ? bill.totalDiscount || 0 : 0
        );
      });

      // 💸 Claims
      const claimsSnap = await getDocs(collection(db, "claims"));
      claimsSnap.forEach((doc) => {
        const claim = doc.data();
        if (Array.isArray(claim.items)) {
          claim.items.forEach((i) => {
            totalClaims += Number(i.price || 0) * Number(i.qty || 0);
          });
        }
      });

      // 👥 Customers
      const customersSnap = await getDocs(collection(db, "customers"));
      customers = customersSnap.size;

      // 📦 Items
      const itemsSnap = await getDocs(collection(db, "items"));
      const itemList = itemsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const profit = totalSales - totalClaims - totalDiscount;

      setStats({
        totalSales,
        totalDiscount,
        totalClaims,
        profit,
        customers,
      });

      setItems(itemList);
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">
        📊 Business Dashboard
      </h1>

      {/* ==== TOP CARDS ==== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Card
          title="Total Sales"
          value={`Rs. ${stats.totalSales}`}
          color="green"
        />
        <Card
          title="Total Discount"
          value={`Rs. ${stats.totalDiscount}`}
          color="yellow"
        />
        <Card
          title="Total Claims"
          value={`Rs. ${stats.totalClaims}`}
          color="red"
        />
        <Card
          title="Profit / Loss"
          value={`Rs. ${stats.profit}`}
          color={stats.profit >= 0 ? "green" : "red"}
        />
        <Card title="Total Customers" value={stats.customers} color="blue" />
      </div>

      {/* ==== ITEM STOCK TABLE ==== */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">
          📦 Stock Overview (Per Item)
        </h2>

        {items.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No items found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="p-3 text-left">Item Name</th>
                  <th className="p-3 text-left">Price (Rs.)</th>
                  <th className="p-3 text-left">Remaining</th>
                  <th className="p-3 text-left">Sold</th>
                  <th className="p-3 text-left">Claimed</th>
                  <th className="p-3 text-left">Stock</th>
                  <th className="p-3 text-left">Scheme</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b hover:bg-gray-50 text-gray-800"
                  >
                    <td className="p-3 font-medium">{item.name}</td>
                    <td className="p-3">{item.price}</td>
                    <td className="p-3">{item.stock ?? "—"}</td>
                    <td className="p-3">{item.sold ?? 0}</td>
                    <td className="p-3">{item.claimed ?? 0}</td>
                    <td
                      className={`p-3 font-semibold ${
                        item.remaining <= 5 ? "text-red-600" : "text-green-700"
                      }`}
                    >
                      {item.remaining ?? 0}
                    </td>
                    <td className="p-3 text-sm">
                      {item.schemeActive ? (
                        <>
                          ✅ On {item.schemeQty}+ → −Rs {item.schemeDiscount}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ title, value, color }) {
  const colorClass = {
    green: "bg-green-100 text-green-800 border-green-300",
    red: "bg-red-100 text-red-800 border-red-300",
    yellow: "bg-yellow-100 text-yellow-800 border-yellow-300",
    blue: "bg-blue-100 text-blue-800 border-blue-300",
    purple: "bg-purple-100 text-purple-800 border-purple-300",
  }[color];

  return (
    <div className={`border rounded-xl p-6 shadow-sm ${colorClass}`}>
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
