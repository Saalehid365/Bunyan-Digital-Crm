import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";

const ERROR_MESSAGES: Record<string, string> = {
  AccessDenied: "That email isn't registered. Ask an admin to add you as a team member first.",
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
