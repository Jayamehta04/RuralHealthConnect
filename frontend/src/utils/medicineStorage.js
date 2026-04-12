import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@medicine_vault';

export const getMedicines = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error fetching medicines', error);
    return [];
  }
};

export const saveMedicines = async (medicines) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(medicines));
  } catch (error) {
    console.error('Error saving medicines', error);
  }
};

export const addMedicineLocal = async (medicine) => {
  const current = await getMedicines();
  const newMedicine = { 
    ...medicine, 
    _id: Date.now().toString() + Math.random().toString(36).substr(2, 9), 
    lastTakenDate: null 
  };
  await saveMedicines([newMedicine, ...current]);
  return newMedicine;
};

export const deleteMedicineLocal = async (id) => {
  const current = await getMedicines();
  const updated = current.filter(m => m._id !== id);
  await saveMedicines(updated);
};

export const toggleMedicineLocal = async (id) => {
  const current = await getMedicines();
  const today = new Date().toDateString();
  
  const updated = current.map(m => {
    if (m._id === id) {
      return { 
        ...m, 
        lastTakenDate: m.lastTakenDate === today ? null : today 
      };
    }
    return m;
  });
  
  await saveMedicines(updated);
};
