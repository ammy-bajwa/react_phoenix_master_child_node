import { openDB } from "idb";

export const saveChunkInIndexedDB = async (
  materPeerId,
  fileName,
  startIndex,
  endIndex,
  fileChunk
) => {
  const saveChunkPromise = new Promise(async (resolve, reject) => {
    const dbName = `${materPeerId}_${fileName}`;
    const storeName = `${fileName}`;
    const fileChunkIndex = `${startIndex}_${endIndex}`;

    const db = await openDB(dbName, 1, {
      async upgrade(db) {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName);
        }
      },
    });

    await db.put(
      storeName,
      { fileChunk, createdAt: new Date() },
      fileChunkIndex
    );

    db.close();
    resolve(true);
  });
  return await saveChunkPromise;
};
