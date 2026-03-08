import { useState } from "react";
import { ArrowLeft, Camera, Check } from "lucide-react";
import SquadAvatar from "@/components/squad/Avatar";
import GlowOrb from "@/components/squad/GlowOrb";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Props {
  currentUser: { id: string; name: string; phone: string; avatar: string };
  onBack: () => void;
}

export default function EditProfileScreen({ currentUser, onBack }: Props) {
  const { refreshProfile } = useAuth();
  const [name, setName] = useState(currentUser.name || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Name can't be empty");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ name: name.trim() })
      .eq("id", currentUser.id);

    if (error) {
      toast.error("Failed to update profile");
    } else {
      toast.success("Profile updated!");
      await refreshProfile();
      onBack();
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen flex flex-col pb-20 animate-fade-up">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-[52px] pb-4">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center active:scale-95 transition-transform"
        >
          <ArrowLeft size={18} />
        </button>
        <p className="font-display text-lg font-bold flex-1">Edit Profile</p>
        <button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 active:scale-95 transition-transform"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      <div className="px-6 pt-4 relative">
        <GlowOrb color="hsl(25 100% 50%)" size={200} top="-60px" right="-40px" />

        {/* Avatar */}
        <div className="flex justify-center mb-8 relative z-10">
          <div className="relative">
            <SquadAvatar name={name || "U"} size="lg" />
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center border-2 border-background">
              <Camera size={12} className="text-primary-foreground" />
            </div>
          </div>
        </div>

        {/* Fields */}
        <div className="flex flex-col gap-5 relative z-10">
          <div className="flex flex-col gap-2">
            <label className="text-[13px] text-muted-foreground font-medium tracking-wide">Display Name</label>
            <input
              className="bg-secondary border border-border rounded-[14px] px-4 py-3.5 text-foreground text-base outline-none transition-all focus:border-primary focus:shadow-[0_0_0_3px_hsl(25_100%_50%/0.25)] placeholder:text-muted-foreground"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSave()}
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[13px] text-muted-foreground font-medium tracking-wide">Phone Number</label>
            <div className="bg-secondary border border-border rounded-[14px] px-4 py-3.5 text-muted-foreground text-base">
              +91 {currentUser.phone}
            </div>
            <p className="text-[11px] text-muted-foreground">Phone number can't be changed</p>
          </div>
        </div>
      </div>
    </div>
  );
}
