
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy,
  setDoc
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { DispatchEntry, ChallanEntry } from "../types";

// --- Dispatch/Job Entries ---

export const subscribeToDispatch = (callback: (data: DispatchEntry[]) => void) => {
  const q = query(collection(db, "dispatch"), orderBy("timestamp", "desc"));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as DispatchEntry[];
    callback(data);
  }, (error) => {
    console.error("Dispatch subscription error:", error);
  });
};

export const addDispatchToFire = async (entry: Omit<DispatchEntry, 'id'>) => {
  // Errors will bubble up to the caller
  await addDoc(collection(db, "dispatch"), entry);
};

export const updateDispatchInFire = async (id: string, updates: Partial<DispatchEntry>) => {
  const ref = doc(db, "dispatch", id);
  await updateDoc(ref, updates);
};

export const deleteDispatchFromFire = async (id: string) => {
  await deleteDoc(doc(db, "dispatch", id));
};

// --- Challan Entries ---

export const subscribeToChallan = (callback: (data: ChallanEntry[]) => void) => {
  const q = query(collection(db, "challans"), orderBy("timestamp", "desc"));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ChallanEntry[];
    callback(data);
  }, (error) => {
    console.error("Challan subscription error:", error);
  });
};

export const addChallanToFire = async (entry: Omit<ChallanEntry, 'id'>) => {
  await addDoc(collection(db, "challans"), entry);
};

export const updateChallanInFire = async (id: string, updates: Partial<ChallanEntry>) => {
  const ref = doc(db, "challans", id);
  await updateDoc(ref, updates);
};

export const deleteChallanFromFire = async (id: string) => {
  await deleteDoc(doc(db, "challans", id));
};
