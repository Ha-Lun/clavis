const { Client, Databases, Storage } = require('node-appwrite');

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const db = new Databases(client);
const storage = new Storage(client);
const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const bucketId = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID || "clavis-uploads";

async function run() {
    try {
        const files = await db.listDocuments(dbId, 'files');
        console.log(`Checking ${files.total} files...`);

        let deletedCount = 0;
        for (const file of files.documents) {
            let shouldDelete = false;

            if (file.chat_id === 'new-chat' || (!file.chat_id && !file.project_id)) {
                shouldDelete = true;
            } else if (file.chat_id) {
                try {
                    await db.getDocument(dbId, 'chats', file.chat_id);
                } catch (e) {
                    if (e.code === 404) shouldDelete = true;
                }
            } else if (file.project_id) {
                try {
                    await db.getDocument(dbId, 'projects', file.project_id);
                } catch (e) {
                    if (e.code === 404) shouldDelete = true;
                }
            }

            if (shouldDelete) {
                console.log(`Deleting file ${file.$id} (file_id: ${file.file_id})...`);
                try {
                    await storage.deleteFile(bucketId, file.file_id);
                } catch (e) {
                    console.log(`Storage delete failed or file missing: ${e.message}`);
                }
                await db.deleteDocument(dbId, 'files', file.$id);
                deletedCount++;
            }
        }
        console.log(`Finished. Deleted ${deletedCount} orphaned files.`);
    } catch (e) {
        console.error(e);
    }
}
run();
