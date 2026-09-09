import { AuthError } from "next-auth";

/** Thrown for a registered-but-disabled account, so callers can distinguish this from
 * "never registered" and show an accurate message instead of the generic AccessDenied
 * copy. Note: Auth.js only forwards an allowlisted set of error types to the client via
 * the /login?error= redirect (the magic-link callback route), so this precise message
 * is only guaranteed for the paths our own server actions catch directly — signing in
 * with a password, or requesting a fresh magic link. A disabled user clicking a link
 * they'd already been sent still falls back to the generic (but accurate-for-both-cases)
 * AccessDenied copy in src/app/(auth)/login/page.tsx.
 */
export class AccountDisabledError extends AuthError {
  static type = "AccountDisabled";
}
