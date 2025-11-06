import { doc, getDocs, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase";

export const updateItemStock = async (itemId, soldQty = 0, claimedQty = 0) => {
  try {
    const ref = doc(db, "items", itemId);
    const snap = await getDocs(collection(db, "items"));
    const current = snap.docs.find((d) => d.id === itemId)?.data();
    if (!current) throw new Error("Item not found!");

    const newSold = (current.sold || 0) + soldQty;
    const newClaimed = (current.claimed || 0) + claimedQty;
    const remaining = (current.stock || 0) - newSold + newClaimed;

    await updateDoc(ref, {
      sold: newSold,
      claimed: newClaimed,
      remaining,
    });

    console.log(`📦 Stock updated for ${itemId}`);
  } catch (err) {
    console.error("❌ Error updating item stock:", err);
  }
};
