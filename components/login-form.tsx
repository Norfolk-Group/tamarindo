import { AlertCircle } from "lucide-react";
import Image from "next/image";
import { AvatarOrb } from "@/components/nico/avatar-orb";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Shown only when WorkOS is not configured. The live path is `/login`.
 */
export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <div className="p-6 md:p-8">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center gap-2 text-center">
                <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground">
                  TAMARINDO
                </p>
                <h1 className="text-2xl font-semibold">Log in to Tamarindo</h1>
              </div>
              <Alert>
                <AlertCircle />
                <AlertTitle>Sign-in is paused here</AlertTitle>
                <AlertDescription>
                  This environment cannot start a session. Ask an admin to
                  finish setup, then try again.
                </AlertDescription>
              </Alert>
              <div className="flex flex-col items-center gap-2">
                <Image
                  src="/norfolk-mark.svg"
                  alt=""
                  width={22}
                  height={23}
                  unoptimized
                  className="opacity-80"
                />
                <p className="text-center text-xs text-muted-foreground">
                  Presented by Nico · Powered by Norfolk AI
                </p>
              </div>
            </div>
          </div>
          <div className="relative hidden min-h-[22rem] flex-col items-center justify-center gap-4 bg-muted p-8 md:flex">
            <AvatarOrb state="idle" className="size-16" />
            <div className="text-center">
              <p className="text-lg font-semibold">Nico</p>
              <p className="mt-1 max-w-[16rem] text-sm text-muted-foreground">
                Tamarindo&apos;s resident mind. He&apos;ll take you into the
                project from here.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
