import { KeyRound, TerminalSquare } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SetupRequired() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center px-6 py-16">
      <Card className="w-full border-primary/20 bg-card/85 shadow-2xl shadow-black/20">
        <CardHeader>
          <div className="mb-2 grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
            <KeyRound className="size-5" />
          </div>
          <CardTitle>Connect your Supabase project</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm leading-6 text-muted-foreground">
            The app is built and ready, but this environment does not have Supabase credentials yet.
            Copy the example file, add your project values, and apply the migration.
          </p>
          <Alert>
            <TerminalSquare className="size-4" />
            <AlertTitle>Local setup</AlertTitle>
            <AlertDescription className="mt-2 space-y-1 font-mono text-xs">
              <div>copy .env.example .env.local</div>
              <div>npm run db:start</div>
              <div>npm run db:reset</div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
