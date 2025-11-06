import { addDoc, collection, Timestamp } from "firebase/firestore";
import { db } from "../../firebase/firebase";

export const addItem = async (itemData) => {
  try {
    const ref = collection(db, "items");
    const newItem = {
      ...itemData,
      stock: Number(itemData.stock || 0),
      sold: 0,
      claimed: 0,
      remaining: Number(itemData.stock || 0),
      schemeActive: itemData.schemeActive || false,
      schemeDiscount: Number(itemData.schemeDiscount || 0),
      createdAt: Timestamp.now(),
    };
    const res = await addDoc(ref, newItem);
    console.log("✅ Item added:", res.id);
    return res.id;
  } catch (err) {
    console.error("❌ Error adding item:", err);
    throw err;
  }
};
