import { useState, useEffect } from "react";
import { X, Plus } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("squad-pwa-dismissed")) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferredPrompt || dismissed) return null;

  const handleInstall = async () => {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setDeferredPrompt(null);
    setDismissed(true);
  };

  const handleDismiss = () => {
    localStorage.setItem("squad-pwa-dismissed", "1");
    setDismissed(true);
  };

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[400px] z-50 animate-in slide-in-from-bottom-4">
      <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 shadow-xl">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Plus size={20} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Add Squad to Home Screen</p>
          <p className="text-xs text-muted-foreground">Get the full app experience</p>
        </div>
        <button
          onClick={handleInstall}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shrink-0 active:scale-95 transition-transform"
        >
          Install
        </button>
        <button onClick={handleDismiss} className="text-muted-foreground p-1">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
