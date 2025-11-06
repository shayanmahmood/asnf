import { doc, deleteDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase";

export const deleteItem = async (id) => {
  try {
    const ref = doc(db, "items", id);
    await deleteDoc(ref);
    console.log("🗑️ Item deleted:", id);
    return true;
  } catch (err) {
    console.error("❌ Error deleting item:", err);
    throw err;
  }
};
