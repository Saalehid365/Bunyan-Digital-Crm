import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";

const ERROR_MESSAGES: Record<string, string> = {
  // Auth.js only forwards a fixed allowlist of error codes to this page via the
  // redirect (see @auth/core's clientErrors), so a stale/pending magic link from an
  // account that's since been disabled lands on this same generic code as a genuinely
  // unregistered email — this copy is written to stay accurate for either cause. A
  // *fresh* sign-in attempt (password, or requesting a new link) gets a precise
  // "account disabled" message instead, from src/server/actions/auth.ts.
  AccessDenied: "This account isn't able to sign in — it may not be registered yet, or it's been disabled. Ask an admin to check your access.",
  CredentialsSignin: "Incorrect email or password.",
  Verification: "That sign-in link has expired or was already used. Request a new one.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const message = error ? ERROR_MESSAGES[error] ?? "Something went wrong signing you in. Please try again." : null;

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-xl">Sign in</CardTitle>
        <CardDescription>
          Access is by invitation only. Sign in with a password, or use a one-time email link.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {message ? (
          <p className="rounded-[var(--radius-sm)] border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {message}
          </p>
        ) : null}
        <LoginForm />
      </CardContent>
    </Card>
  );
}
