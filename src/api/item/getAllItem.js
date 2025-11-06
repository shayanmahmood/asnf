import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase/firebase";

export const getAllItems = async () => {
  try {
    const ref = collection(db, "items");
    const snap = await getDocs(ref);
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.error("❌ Error fetching items:", err);
    return [];
  }
};
