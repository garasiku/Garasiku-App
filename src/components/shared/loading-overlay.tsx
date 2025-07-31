import { Loader2 } from "lucide-react";

type LoadingOverlayProps = {
  loading: boolean;
};

export function LoadingOverlay({ loading }: LoadingOverlayProps) {
  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-500 flex items-center justify-center bg-foreground/50 backdrop-blur-xs">
      <div className="flex flex-col items-center gap-3 rounded-lg bg-background p-8 shadow-lg">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="font-medium">Loading...</p>
      </div>
    </div>
  );
}
