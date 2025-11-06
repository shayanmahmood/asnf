import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../../firebase/firebase";

export async function addBill(billData) {
  try {
    const { customerName, phone } = billData;

    if (!customerName || !phone) {
      throw new Error("Customer name and phone number are required.");
    }

    // ==========================
    // 🧾 Step 1: Find or create customer
    // ==========================
    const customerRef = collection(db, "customers");
    const customerQuery = query(
      customerRef,
      where("name", "==", customerName),
      where("phone", "==", phone),
      limit(1)
    );

    const customerSnap = await getDocs(customerQuery);
    let customerId;

    if (!customerSnap.empty) {
      customerId = customerSnap.docs[0].id;
    } else {
      const newCustomerRef = await addDoc(customerRef, {
        name: customerName,
        phone,
        createdAt: new Date(),
      });
      customerId = newCustomerRef.id;
    }

    // ==========================
    // 📦 Step 2: Process each item
    // ==========================
    let totalDiscount = 0;
    const updatedItems = [];

    for (const item of billData.items) {
      const itemQuery = query(
        collection(db, "items"),
        where("name", "==", item.name),
        limit(1)
      );
      const itemSnap = await getDocs(itemQuery);

      if (itemSnap.empty) {
        console.warn(`⚠️ Item "${item.name}" not found in Firestore`);
        updatedItems.push(item);
        continue;
      }

      const itemDoc = itemSnap.docs[0];
      const itemRef = doc(db, "items", itemDoc.id);
      const data = itemDoc.data();

      // ---- Calculate new stock ----
      const qty = Number(item.qty);
      const currentStock = Number(data.stock || 0);
      const newStock = Math.max(currentStock - qty, 0);
      const newSold = Number(data.sold || 0) + qty;

      // ---- Check scheme ----
      let schemeApplied = false;
      let schemeAmount = 0;

      if (data.schemeActive && qty >= (data.schemeQty || 0)) {
        schemeApplied = true;
        schemeAmount = Number(data.schemeDiscount || 0);
        totalDiscount += schemeAmount;
      }

      // ---- Update item stock in Firestore ----
      await updateDoc(itemRef, {
        sold: newSold,
        stock: newStock,
        updatedAt: new Date(),
      });

      updatedItems.push({
        ...item,
        originalStock: currentStock,
        remainingStock: newStock,
        schemeApplied,
        schemeAmount,
      });
    }

    // ==========================
    // 🧾 Step 3: Save the Bill
    // ==========================
    const billRef = collection(db, "bills");
    await addDoc(billRef, {
      ...billData,
      customerId,
      customerName,
      phone,
      items: updatedItems,
      totalDiscount,
      finalTotal: Number(billData.grandTotal || 0) - Number(totalDiscount || 0),
      createdAt: new Date(),
    });

    console.log("✅ Bill added and stock updated successfully!");
    return { success: true };
  } catch (err) {
    console.error("❌ Error adding bill:", err);
    throw err;
  }
}
