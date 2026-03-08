import { useState, useEffect } from "react";
import { ChevronLeft, Plus, UserPlus, Search, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import SquadAvatar from "@/components/squad/Avatar";
import GlowOrb from "@/components/squad/GlowOrb";
import { toast } from "sonner";

export interface Contact {
  id: string;
  owner_id: string;
  name: string;
  phone: string;
  created_at: string;
}

interface Props {
  onBack: () => void;
}

export default function ContactsScreen({ onBack }: Props) {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (user) fetchContacts();
  }, [user]);

  const fetchContacts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("contacts")
      .select("*")
      .order("name", { ascending: true });
    setContacts((data as Contact[]) || []);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newName.trim() || newPhone.length !== 10 || !user) return;
    setAdding(true);
    const { data, error } = await supabase
      .from("contacts")
      .insert({ owner_id: user.id, name: newName.trim(), phone: newPhone })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        toast.error("This number is already in your contacts");
      } else {
        toast.error(error.message);
      }
    } else {
      setContacts((prev) => [...prev, data as Contact].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName("");
      setNewPhone("");
      setShowAdd(false);
      toast.success(`${newName.trim()} added!`);
    }
    setAdding(false);
  };

  const handleDelete = async (id: string, name: string) => {
    const { error } = await supabase.from("contacts").delete().eq("id", id);
    if (!error) {
      setContacts((prev) => prev.filter((c) => c.id !== id));
      toast.success(`${name} removed`);
    }
  };

  const filtered = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  return (
    <div className="min-h-screen flex flex-col pb-20 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between pt-14 px-6 pb-5 relative">
        <GlowOrb color="hsl(25 100% 50%)" size={200} top="-60px" right="-80px" />
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-xl bg-squad-bg3 border border-border flex items-center justify-center text-foreground active:bg-card transition-colors relative z-10"
        >
          <ChevronLeft size={22} />
        </button>
        <p className="font-display text-[17px] font-bold relative z-10">My Contacts</p>
        <button
          onClick={() => setShowAdd(true)}
          className="w-10 h-10 rounded-xl bg-squad-saffron flex items-center justify-center text-primary-foreground active:scale-95 transition-transform relative z-10"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Search */}
      <div className="px-6 pb-4">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-squad-text3" />
          <input
            className="w-full bg-squad-bg3 border border-border rounded-[14px] pl-10 pr-4 py-3 text-foreground text-sm outline-none transition-all focus:border-squad-saffron focus:shadow-[0_0_0_3px_hsl(25_100%_50%/0.25)] placeholder:text-squad-text3"
            placeholder="Search by name or number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Add contact modal */}
      {showAdd && (
        <div className="px-6 pb-4 animate-fade-up">
          <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-3.5">
            <div className="flex justify-between items-center">
              <p className="font-display text-base font-bold flex items-center gap-2">
                <UserPlus size={18} className="text-squad-saffron" /> Add Contact
              </p>
              <button onClick={() => setShowAdd(false)} className="text-squad-text3">
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[13px] text-squad-text2 font-medium">Name</label>
              <input
                className="bg-squad-bg3 border border-border rounded-[14px] px-4 py-3 text-foreground text-sm outline-none transition-all focus:border-squad-saffron focus:shadow-[0_0_0_3px_hsl(25_100%_50%/0.25)] placeholder:text-squad-text3"
                placeholder="e.g. Arjun Mehta"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                maxLength={100}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[13px] text-squad-text2 font-medium">Phone Number</label>
              <div className="flex gap-2.5">
                <div className="px-3 py-3 bg-squad-bg3 border border-border rounded-[14px] text-squad-text2 text-sm flex items-center gap-1.5 whitespace-nowrap">
                  🇮🇳 +91
                </div>
                <input
                  className="flex-1 bg-squad-bg3 border border-border rounded-[14px] px-4 py-3 text-foreground text-sm outline-none transition-all focus:border-squad-saffron focus:shadow-[0_0_0_3px_hsl(25_100%_50%/0.25)] placeholder:text-squad-text3"
                  type="tel"
                  maxLength={10}
                  placeholder="98765 43210"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, ""))}
                />
              </div>
            </div>

            <button
              onClick={handleAdd}
              disabled={adding || !newName.trim() || newPhone.length !== 10}
              className="flex items-center justify-center gap-2 py-3 px-6 rounded-[14px] bg-squad-saffron text-primary-foreground font-medium shadow-saffron active:scale-[0.97] transition-all disabled:opacity-50"
            >
              {adding ? "Adding…" : "Add Contact"}
            </button>
          </div>
        </div>
      )}

      {/* Contact list */}
      <div className="px-6 flex flex-col gap-2">
        {loading ? (
          <div className="text-center py-10 text-squad-text3 animate-pulse-soft">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-squad-text3">
            <div className="text-[40px] mb-2.5">📱</div>
            <p>
              {contacts.length === 0
                ? "No contacts yet. Add your squad!"
                : "No contacts match your search"}
            </p>
          </div>
        ) : (
          filtered.map((contact) => (
            <div
              key={contact.id}
              className="flex items-center gap-3 p-3 px-3.5 bg-card border border-border rounded-[14px]"
            >
              <SquadAvatar name={contact.name} size="sm" />
              <div className="flex-1">
                <p className="text-sm font-medium">{contact.name}</p>
                <p className="text-xs text-squad-text3">+91 {contact.phone}</p>
              </div>
              <button
                onClick={() => handleDelete(contact.id, contact.name)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-squad-text3 hover:text-squad-red hover:bg-squad-red/10 transition-colors"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Total count */}
      {contacts.length > 0 && (
        <div className="px-6 pt-4">
          <p className="text-xs text-squad-text3 text-center">
            {contacts.length} contact{contacts.length !== 1 ? "s" : ""} saved
          </p>
        </div>
      )}
    </div>
  );
}
