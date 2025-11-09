import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  query,
  updateDoc,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../firebase/firebase";

export const addClaim = async (claimData) => {
  try {
    // ==============================
    // 🧾 Step 1: Add claim record
    // ==============================
    const claimsRef = collection(db, "claims");
    const claimToSave = {
      ...claimData,
      createdAt: Timestamp.now(),
    };

    const claimRef = await addDoc(claimsRef, claimToSave);
    console.log("✅ Claim added:", claimRef.id);

    // ==============================
    // 📦 Step 2: Update related items
    // ==============================
    if (Array.isArray(claimData.items) && claimData.items.length > 0) {
      for (const item of claimData.items) {
        const itemQuery = query(
          collection(db, "items"),
          where("name", "==", item.name),
          limit(1)
        );

        const itemSnap = await getDocs(itemQuery);

        if (!itemSnap.empty) {
          const itemDoc = itemSnap.docs[0];
          const itemRef = doc(db, "items", itemDoc.id);
          const data = itemDoc.data();

          const newClaimed = (data.claimed || 0) + Number(item.qty);
          const newRemaining =
            (data.stock || 0) - (data.sold || 0) - newClaimed;

          await updateDoc(itemRef, {
            claimed: newClaimed,
            remaining: newRemaining < 0 ? 0 : newRemaining,
          });

          console.log(`📦 Updated claim count for ${item.name}:`, {
            claimed: newClaimed,
            remaining: newRemaining,
          });
        } else {
          console.warn(`⚠️ Item "${item.name}" not found in database.`);
        }
      }
    }

    // ==============================
    // ✅ Done
    // ==============================
    return claimRef.id;
  } catch (error) {
    console.error("❌ Error adding claim:", error);
    throw error;
  }
};
