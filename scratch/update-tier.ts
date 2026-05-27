import { Client, Users, Query } from "node-appwrite";

async function main() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const users = new Users(client);
  
  console.log("Searching for user hannes.e.lundstrom@gmail.com...");
  const userList = await users.list([Query.equal("email", "hannes.e.lundstrom@gmail.com")]);
  
  if (userList.users.length === 0) {
    console.error("User not found!");
    process.exit(1);
  }

  const user = userList.users[0];
  console.log(`Found user: ${user.$id}. Current prefs:`, user.prefs);

  const newPrefs = { ...user.prefs, subscriptionTier: "pro" };
  await users.updatePrefs(user.$id, newPrefs);
  
  console.log("Successfully updated user to pro tier!");
}

main().catch(console.error);
