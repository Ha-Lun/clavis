import { getUser } from "@/lib/appwrite/server";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const user = await getUser();

  if (user) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
