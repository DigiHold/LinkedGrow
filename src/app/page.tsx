import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * The root of a self hosted instance is the product: signed in goes to the
 * dashboard, everyone else to the sign in page. The cloud restores its
 * marketing home on merge.
 */
export default async function HomePage() {
  const session = await auth();
  redirect(session?.user?.id ? "/dashboard" : "/sign-in");
}
