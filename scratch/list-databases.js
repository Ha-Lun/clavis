const { Client, Databases } = require('node-appwrite');

async function listDatabases() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);

  try {
    console.log("Fetching databases for project:", process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);
    const result = await databases.list();
    console.log("\nAvailable Databases:");
    result.databases.forEach(db => {
      console.log(`- Name: ${db.name}`);
      console.log(`  ID:   ${db.$id}`);
      console.log('---');
    });
    
    if (result.databases.length === 0) {
      console.log("No databases found in this project.");
    }
  } catch (err) {
    console.error("Error fetching databases:", err.message);
  }
}

listDatabases();
