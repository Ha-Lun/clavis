import { getUser, createSessionClient } from "@/lib/appwrite/server";
import { HomePrompt } from "@/components/home-prompt";

export default async function DashboardPage() {
  const user = await getUser();
  const client = await createSessionClient();

  if (!user || !client) {
    return null;
  }

  let displayName = user.name || user.email.split("@")[0] || "User";
  try {
    const prefs = await client.account.getPrefs() as any;
    if (prefs?.preferredName) {
      displayName = prefs.preferredName;
    }
  } catch (error) {
    console.error("Failed to fetch prefs", error);
  }

  const tier = (user.prefs as any)?.subscriptionTier || "free";

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-6 lg:p-8 flex items-center justify-center relative">
      <HomePrompt userName={displayName} userTier={tier} />
    </div>
  );
}
