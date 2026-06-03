import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center animate-fade-in">
        <h1 className="text-7xl font-bold text-primary/20 mb-4">404</h1>
        <h2 className="text-xl font-semibold mb-2">Page not found</h2>
        <p className="text-muted-foreground text-sm mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/dashboard">
          <Button className="gap-2">
            <Home className="size-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
