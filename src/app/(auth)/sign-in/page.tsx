import { isGoogleConfigured } from "@/lib/google";
import { isCloud } from "@/lib/edition";
import { SignInContent } from "./sign-in-content";

/* Google sign in belongs to the hosted service. A self hosted instance signs
   people in with an email and a password, so the button is never rendered
   there, and the hosted build reads its credentials when the server starts
   rather than when the image is built. */
export const dynamic = "force-dynamic";

export default function SignInPage() {
  return <SignInContent googleEnabled={isCloud() && isGoogleConfigured()} />;
}
