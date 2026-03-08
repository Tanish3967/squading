import { useState, useEffect } from "react";
import { ChevronLeft, Check, UserPlus, X } from "lucide-react";
import { User, ACTIVITY_CATEGORIES, Activity } from "@/lib/mock-data";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import SquadAvatar from "@/components/squad/Avatar";
import { toast } from "sonner";

interface Contact {
  id: string;
  name: string;
  phone: string;
}

interface Props {
  currentUser: User;
  onBack: () => void;
  onCreate: (activity: Activity) => void;
}

export default function CreateActivityScreen({ currentUser, onBack, onCreate }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    title: "", category: "", date: "", time: "", location: "", deposit: 99,
    description: "", maxPeople: 10,
  });
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickName, setQuickName] = useState("");
  const [quickPhone, setQuickPhone] = useState("");

  useEffect(() => {
    if (user) {
      supabase
        .from("contacts")
        .select("id, name, phone")
        .order("name")
        .then(({ data }) => {
          setContacts((data as Contact[]) || []);
          setLoadingContacts(false);
        });
    }
  }, [user]);

  const toggleContact = (c: Contact) =>
    setSelectedContacts((prev) =>
      prev.some((x) => x.id === c.id)
        ? prev.filter((x) => x.id !== c.id)
        : [...prev, c]
    );

  const set = (key: string, val: string | number) => setForm((f) => ({ ...f, [key]: val }));

  const handleQuickAdd = async () => {
    if (!quickName.trim() || quickPhone.length !== 10 || !user) return;
    const { data, error } = await supabase
      .from("contacts")
      .insert({ owner_id: user.id, name: quickName.trim(), phone: quickPhone })
      .select("id, name, phone")
      .single();

    if (error) {
      toast.error(error.code === "23505" ? "Already in contacts" : error.message);
    } else {
      const contact = data as Contact;
      setContacts((prev) => [...prev, contact].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedContacts((prev) => [...prev, contact]);
      setQuickName("");
      setQuickPhone("");
      setShowQuickAdd(false);
      toast.success(`${contact.name} added & selected!`);
    }
  };

  const handleCreate = () => {
    const newActivity: Activity = {
      id: crypto.randomUUID(),
      ...form,
      creatorId: currentUser.id,
      invitees: selectedContacts.map((c) => ({
        userId: c.id, // We'll map this to the contact's phone-based profile if they register
        status: "pending" as const,
        paid: false,
        attended: false,
      })),
      status: "upcoming",
    };
    onCreate(newActivity);
  };

  return (
    <div className="min-h-screen flex flex-col pb-20 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between pt-14 px-6 pb-5">
        <button onClick={onBack} className="w-10 h-10 rounded-xl bg-squad-bg3 border border-border flex items-center justify-center text-foreground active:bg-card transition-colors">
          <ChevronLeft size={22} />
        </button>
        <p className="font-display text-[17px] font-bold">
          {step === 1 ? "Activity Details" : step === 2 ? "Invite Squad" : "Review & Create"}
        </p>
        <div className="w-10" />
      </div>

      {/* Progress */}
      <div className="flex gap-1.5 px-6 pb-6">
        {[1, 2, 3].map((s) => (
          <div key={s} className={`flex-1 h-[3px] rounded-full transition-colors duration-300 ${s <= step ? "bg-squad-saffron" : "bg-squad-bg3"}`} />
        ))}
      </div>

      <div className="px-6 flex flex-col gap-[18px]">
        {step === 1 && (
          <>
            <div className="flex flex-col gap-2">
              <label className="text-[13px] text-squad-text2 font-medium tracking-wide">Activity Name</label>
              <input className="bg-squad-bg3 border border-border rounded-[14px] px-4 py-3.5 text-foreground text-base outline-none transition-all focus:border-squad-saffron focus:shadow-[0_0_0_3px_hsl(25_100%_50%/0.25)] placeholder:text-squad-text3" placeholder="e.g. Sunrise Hike to Nandi Hills" value={form.title} onChange={(e) => set("title", e.target.value)} />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[13px] text-squad-text2 font-medium tracking-wide">Category</label>
              <div className="flex gap-2 flex-wrap">
                {ACTIVITY_CATEGORIES.map((cat) => (
                  <div key={cat.id} onClick={() => set("category", cat.id)}
                    className={`flex flex-col items-center gap-1.5 px-3 py-3.5 rounded-2xl border-[1.5px] cursor-pointer transition-all min-w-[70px] text-xs ${
                      form.category === cat.id
                        ? "bg-squad-saffron/10 border-squad-saffron text-squad-saffron"
                        : "bg-squad-bg3 border-border text-squad-text2"
                    }`}>
                    <span className="text-[22px]">{cat.icon}</span>
                    <span>{cat.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <label className="text-[13px] text-squad-text2 font-medium tracking-wide">Date</label>
                <input type="date" className="bg-squad-bg3 border border-border rounded-[14px] px-4 py-3.5 text-foreground text-base outline-none transition-all focus:border-squad-saffron focus:shadow-[0_0_0_3px_hsl(25_100%_50%/0.25)]" value={form.date} onChange={(e) => set("date", e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[13px] text-squad-text2 font-medium tracking-wide">Time</label>
                <input type="time" className="bg-squad-bg3 border border-border rounded-[14px] px-4 py-3.5 text-foreground text-base outline-none transition-all focus:border-squad-saffron focus:shadow-[0_0_0_3px_hsl(25_100%_50%/0.25)]" value={form.time} onChange={(e) => set("time", e.target.value)} />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[13px] text-squad-text2 font-medium tracking-wide">Location</label>
              <input className="bg-squad-bg3 border border-border rounded-[14px] px-4 py-3.5 text-foreground text-base outline-none transition-all focus:border-squad-saffron focus:shadow-[0_0_0_3px_hsl(25_100%_50%/0.25)] placeholder:text-squad-text3" placeholder="e.g. Cubbon Park, Bengaluru" value={form.location} onChange={(e) => set("location", e.target.value)} />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[13px] text-squad-text2 font-medium tracking-wide flex justify-between">
                <span>Commitment Deposit (₹)</span>
                <span className="text-squad-saffron font-semibold">₹{form.deposit}</span>
              </label>
              <input type="range" min={99} max={999} step={50} value={form.deposit} onChange={(e) => set("deposit", Number(e.target.value))} className="w-full" />
              <div className="flex justify-between text-[11px] text-squad-text3">
                <span>₹99</span><span>₹999</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[13px] text-squad-text2 font-medium tracking-wide">Description (optional)</label>
              <textarea rows={3} className="bg-squad-bg3 border border-border rounded-[14px] px-4 py-3.5 text-foreground text-base outline-none transition-all focus:border-squad-saffron focus:shadow-[0_0_0_3px_hsl(25_100%_50%/0.25)] placeholder:text-squad-text3 resize-none" placeholder="What to bring, what to expect…" value={form.description} onChange={(e) => set("description", e.target.value)} />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[13px] text-squad-text2 font-medium tracking-wide flex justify-between">
                <span>Max People</span>
                <span className="text-squad-text2">{form.maxPeople}</span>
              </label>
              <input type="number" min={2} max={100} className="bg-squad-bg3 border border-border rounded-[14px] px-4 py-3.5 text-foreground text-base outline-none transition-all focus:border-squad-saffron focus:shadow-[0_0_0_3px_hsl(25_100%_50%/0.25)]" value={form.maxPeople} onChange={(e) => set("maxPeople", Number(e.target.value))} />
            </div>

            <button onClick={() => setStep(2)} disabled={!form.title || !form.category || !form.date}
              className="flex items-center justify-center gap-2 py-3.5 px-6 rounded-[14px] bg-squad-saffron text-primary-foreground font-medium shadow-saffron active:scale-[0.97] transition-all w-full disabled:opacity-50">
              Next: Invite People →
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <p className="text-squad-text2 text-sm mb-1">Select contacts to invite, or add new ones.</p>

            {/* Quick add button */}
            {!showQuickAdd && (
              <button
                onClick={() => setShowQuickAdd(true)}
                className="flex items-center gap-2.5 p-3 rounded-[14px] border-[1.5px] border-dashed border-squad-saffron/40 text-squad-saffron text-sm cursor-pointer hover:bg-squad-saffron/5 transition-colors"
              >
                <UserPlus size={18} /> Add new contact
              </button>
            )}

            {/* Quick add form */}
            {showQuickAdd && (
              <div className="bg-card border border-border rounded-[14px] p-4 flex flex-col gap-3 animate-fade-up">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium flex items-center gap-1.5">
                    <UserPlus size={16} className="text-squad-saffron" /> Quick Add
                  </p>
                  <button onClick={() => setShowQuickAdd(false)} className="text-squad-text3"><X size={16} /></button>
                </div>
                <input
                  className="bg-squad-bg3 border border-border rounded-[12px] px-3.5 py-2.5 text-foreground text-sm outline-none focus:border-squad-saffron placeholder:text-squad-text3"
                  placeholder="Name"
                  value={quickName}
                  onChange={(e) => setQuickName(e.target.value)}
                  maxLength={100}
                />
                <div className="flex gap-2">
                  <div className="px-2.5 py-2.5 bg-squad-bg3 border border-border rounded-[12px] text-squad-text2 text-xs flex items-center">+91</div>
                  <input
                    className="flex-1 bg-squad-bg3 border border-border rounded-[12px] px-3.5 py-2.5 text-foreground text-sm outline-none focus:border-squad-saffron placeholder:text-squad-text3"
                    type="tel"
                    maxLength={10}
                    placeholder="Phone number"
                    value={quickPhone}
                    onChange={(e) => setQuickPhone(e.target.value.replace(/\D/g, ""))}
                  />
                </div>
                <button
                  onClick={handleQuickAdd}
                  disabled={!quickName.trim() || quickPhone.length !== 10}
                  className="py-2.5 rounded-[12px] bg-squad-saffron text-primary-foreground text-sm font-medium disabled:opacity-50"
                >
                  Add & Select
                </button>
              </div>
            )}

            {/* Contact list */}
            <div className="flex flex-col gap-2">
              {loadingContacts ? (
                <div className="text-center py-6 text-squad-text3 animate-pulse-soft">Loading contacts…</div>
              ) : contacts.length === 0 ? (
                <div className="text-center py-6 text-squad-text3">
                  <p className="text-sm">No contacts yet. Add someone above!</p>
                </div>
              ) : (
                contacts.map((contact) => (
                  <div key={contact.id} onClick={() => toggleContact(contact)}
                    className={`flex items-center gap-3 p-3 rounded-[14px] border-[1.5px] cursor-pointer transition-all ${
                      selectedContacts.some((x) => x.id === contact.id) ? "border-squad-saffron bg-squad-saffron/[0.06]" : "border-transparent bg-squad-bg3"
                    }`}>
                    <SquadAvatar name={contact.name} size="sm" />
                    <div>
                      <p className="text-sm font-medium">{contact.name}</p>
                      <p className="text-xs text-squad-text3">+91 {contact.phone}</p>
                    </div>
                    <div className={`ml-auto w-[22px] h-[22px] rounded-md border-[1.5px] flex items-center justify-center transition-all ${
                      selectedContacts.some((x) => x.id === contact.id) ? "bg-squad-saffron border-squad-saffron text-primary-foreground" : "bg-card border-border"
                    }`}>
                      {selectedContacts.some((x) => x.id === contact.id) && <Check size={14} />}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2.5">
              <button onClick={() => setStep(1)} className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-[14px] bg-transparent text-foreground border border-foreground/10 font-medium active:bg-squad-bg3 transition-all">
                ← Back
              </button>
              <button onClick={() => setStep(3)} disabled={selectedContacts.length === 0}
                className="flex-[2] flex items-center justify-center gap-2 py-3.5 px-6 rounded-[14px] bg-squad-saffron text-primary-foreground font-medium shadow-saffron active:scale-[0.97] transition-all disabled:opacity-50">
                Review ({selectedContacts.length} invited) →
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-3.5">
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex gap-3.5 items-center mb-4">
                <div className="w-[52px] h-[52px] rounded-[14px] bg-squad-saffron/10 border border-squad-saffron/20 flex items-center justify-center text-[26px]">
                  {ACTIVITY_CATEGORIES.find((c) => c.id === form.category)?.icon}
                </div>
                <div>
                  <p className="font-display text-[17px] font-bold">{form.title}</p>
                  <p className="text-[13px] text-squad-text2">{form.location}</p>
                </div>
              </div>
              <div className="h-px bg-border my-2" />
              {[
                ["📅 Date & Time", `${form.date ? new Date(form.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long" }) : ""} at ${form.time}`],
                ["👥 Max Capacity", `${form.maxPeople} people`],
                ["💰 Commitment Deposit", `₹${form.deposit} per person`],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between py-2.5 border-b border-border text-sm">
                  <span className="text-squad-text2">{label}</span>
                  <span className="font-medium">{val}</span>
                </div>
              ))}
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <p className="text-[13px] text-squad-text2 mb-3">INVITING {selectedContacts.length} PEOPLE</p>
              <div className="flex">
                {selectedContacts.map((c) => (
                  <div key={c.id} className="-mr-2"><SquadAvatar name={c.name} size="sm" /></div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {selectedContacts.map((c) => (
                  <span key={c.id} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-foreground/5 text-squad-text2 border border-border">{c.name.split(" ")[0]}</span>
                ))}
              </div>
            </div>

            <div className="p-4 bg-squad-green/[0.06] border border-squad-green/15 rounded-[14px]">
              <p className="text-[13px] text-squad-green font-semibold mb-1">🔐 How deposits work</p>
              <p className="text-[13px] text-squad-text2 leading-relaxed">
                Each person who joins pays ₹{form.deposit}. If they actually show up (marked by you), they get it back. No-shows forfeit the deposit.
              </p>
            </div>

            <div className="flex gap-2.5">
              <button onClick={() => setStep(2)} className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-[14px] bg-transparent text-foreground border border-foreground/10 font-medium active:bg-squad-bg3 transition-all">
                ← Back
              </button>
              <button onClick={handleCreate}
                className="flex-[2] flex items-center justify-center gap-2 py-3.5 px-6 rounded-[14px] bg-squad-saffron text-primary-foreground font-medium shadow-saffron active:scale-[0.97] transition-all">
                🎯 Create Activity
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
