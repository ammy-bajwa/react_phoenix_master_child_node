import { openDB } from "idb";
import { v4 as uuidv4 } from "uuid";

export async function setIdIfRequired() {
  const db = await openDB("machineIdentification", 1, {
    upgrade(db) {
      db.createObjectStore("idStore");
    },
  });

  const machineId = await db.get("idStore", "id");
  if (!machineId) {
    await db.put("idStore", uuidv4(), "id");
  }

  db.close();
}

export async function getMachineId() {
  const db = await openDB("machineIdentification", 1, {
    upgrade(db) {
      db.createObjectStore("idStore");
    },
  });

  return await db.get("idStore", "id");
}

// async function initialiseIdb() {
//   const dbPromise = await openDB("machineIdentification", 1, {
//     upgrade(db) {
//       db.createObjectStore("idStore");
//     },
//   });

//   const idbUtils = {
//     async get(key) {
//       return (await dbPromise).get("idStore", key);
//     },
//     async set(key, val) {
//       return (await dbPromise).put("idStore", val, key);
//     },
//     async delete(key) {
//       return (await dbPromise).delete("idStore", key);
//     },
//     async clear() {
//       return (await dbPromise).clear("idStore");
//     },
//     async keys() {
//       return (await dbPromise).getAllKeys("idStore");
//     },
//   };
// }
