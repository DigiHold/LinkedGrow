import { isGoogleConfigured } from "@/lib/google";
import { SignUpContent } from "./sign-up-content";

/* Rendered on every request so the Google credentials are read when the
   container starts rather than baked in when the image is built. A browser
   flag would be inlined at build time, and a published image could never
   show the button on an instance that configured Google afterwards. */
export const dynamic = "force-dynamic";

export default function SignUpPage() {
  return <SignUpContent googleEnabled={isGoogleConfigured()} />;
}
