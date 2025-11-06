import { addDoc, collection, Timestamp } from "firebase/firestore";
import { db } from "../../firebase/firebase";
export const addClaim = async (claimData) => {
  try {
    const claimsRef = collection(db, "claims");
    const claimToSave = {
      ...claimData,
      createdAt: Timestamp.now(),
    };

    const claimRef = await addDoc(claimsRef, claimToSave);
    console.log("✅ Claim added:", claimRef.id);
    return claimRef.id;
  } catch (error) {
    console.error("❌ Error adding claim:", error);
    throw error;
  }
};
