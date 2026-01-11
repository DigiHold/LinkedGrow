import { generateSecret, generateSync, verifySync, generateURI } from "otplib";

/**
 * Generate a new TOTP secret
 */
export function generateTOTPSecret(): string {
  return generateSecret();
}

/**
 * Generate TOTP token from secret
 */
export function generateTOTPToken(secret: string): string {
  return generateSync({ secret });
}

/**
 * Verify a TOTP token against a secret
 */
export function verifyTOTP(token: string, secret: string): boolean {
  const result = verifySync({ token, secret });
  return result.valid;
}

/**
 * Generate an otpauth URI for QR codes
 */
export function generateTOTPUri(
  email: string,
  secret: string,
  issuer: string = "LinkedGrow"
): string {
  return generateURI({
    issuer,
    label: email,
    secret,
    algorithm: "sha1",
    digits: 6,
    period: 30,
  });
}
