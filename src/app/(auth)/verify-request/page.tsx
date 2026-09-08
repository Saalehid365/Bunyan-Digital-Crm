import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";

export default function VerifyRequestPage() {
  return (
    <Card className="border-border">
      <CardHeader>
        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] border border-border bg-muted text-primary">
          <Mail className="h-5 w-5" />
        </div>
        <CardTitle className="text-xl">Check your inbox</CardTitle>
        <CardDescription>
          We&apos;ve sent a sign-in link to your email address. It expires in 24 hours and can only be used once.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Didn&apos;t get it? Check spam, or ask your admin to confirm your account is set up.
        </p>
      </CardContent>
    </Card>
  );
}
