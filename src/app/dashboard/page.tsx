import { getUser, createSessionClient } from "@/lib/appwrite/server";
import { HomePrompt } from "@/components/home-prompt";

export default async function DashboardPage() {
  const user = await getUser();
  const client = await createSessionClient();

  if (!user || !client) {
    return null;
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-6 lg:p-8 flex items-center justify-center relative">
      <HomePrompt />
    </div>
  );
}
