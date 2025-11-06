import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase/firebase";

export async function getBillsByCustomer(customerName, phone) {
  console.log("Fetching bills for:", customerName, phone);
  try {
    // Step 1: Find customer by name + phone
    const customersRef = collection(db, "customers");
    const q1 = query(
      customersRef,
      where("name", "==", customerName),
      where("phone", "==", phone)
    );

    const querySnap = await getDocs(q1);

    if (querySnap.empty) {
      console.log("No customer found for", customerName, phone);
      return [];
    }

    const customerDoc = querySnap.docs[0];
    const customerId = customerDoc.id;

    // Step 2: Get all bills for that customer
    const billsRef = collection(db, "bills");
    const q2 = query(billsRef, where("customerId", "==", customerId));
    const billsSnap = await getDocs(q2);

    const bills = billsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log("Fetched bills:", bills);
    return bills;
  } catch (error) {
    console.error("Error fetching bills:", error);
    return [];
  }
}
