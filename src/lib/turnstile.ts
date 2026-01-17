// Cloudflare Turnstile server-side verification

const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY!;
const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

interface TurnstileVerifyResponse {
  success: boolean;
  "error-codes"?: string[];
  challenge_ts?: string;
  hostname?: string;
}

export async function verifyTurnstileToken(token: string, ip?: string): Promise<boolean> {
  // Skip verification in development if no token provided (for testing)
  if (process.env.NODE_ENV === "development" && !token) {
    console.warn("Turnstile: Skipping verification in development (no token)");
    return true;
  }

  if (!token) {
    console.error("Turnstile: No token provided");
    return false;
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", TURNSTILE_SECRET_KEY);
    formData.append("response", token);
    if (ip) {
      formData.append("remoteip", ip);
    }

    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const data: TurnstileVerifyResponse = await response.json();

    if (!data.success) {
      console.error("Turnstile verification failed:", data["error-codes"]);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Turnstile verification error:", error);
    return false;
  }
}
