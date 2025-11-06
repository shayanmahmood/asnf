import { doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "../../firebase/firebase";

export const updateItem = async (id, updatedData) => {
  try {
    const ref = doc(db, "items", id);
    await updateDoc(ref, {
      ...updatedData,
      updatedAt: Timestamp.now(),
    });
    console.log("✅ Item updated:", id);
    return id;
  } catch (err) {
    console.error("❌ Error updating item:", err);
    throw err;
  }
};
