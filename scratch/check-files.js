const { Client, Databases } = require('node-appwrite');

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const db = new Databases(client);

async function run() {
    try {
        const files = await db.listDocuments(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
            'files'
        );
        console.log(`Total files: ${files.total}`);
        files.documents.forEach(f => {
            console.log(`- ID: ${f.$id}, Chat: ${f.chat_id}, User: ${f.user_id}`);
        });
    } catch (e) {
        console.error(e);
    }
}
run();
