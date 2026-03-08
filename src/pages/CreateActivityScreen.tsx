import { useState } from "react";
import { ChevronLeft, Check } from "lucide-react";
import { User, MOCK_USERS, ACTIVITY_CATEGORIES, Activity } from "@/lib/mock-data";
import SquadAvatar from "@/components/squad/Avatar";

interface Props {
  currentUser: User;
  onBack: () => void;
  onCreate: (activity: Activity) => void;
}

export default function CreateActivityScreen({ currentUser, onBack, onCreate }: Props) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    title: "", category: "", date: "", time: "", location: "", deposit: 99,
    description: "", maxPeople: 10,
  });
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

  const otherUsers = MOCK_USERS.filter(u => u.id !== currentUser.id);
  const toggleUser = (id: number) => setSelectedUsers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const set = (key: string, val: string | number) => setForm(f => ({ ...f, [key]: val }));

  const handleCreate = () => {
    const newActivity: Activity = {
      id: Date.now(),
      ...form,
      creatorId: currentUser.id,
      invitees: selectedUsers.map(uid => ({ userId: uid, status: "pending" as const, paid: false, attended: false })),
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
        {[1, 2, 3].map(s => (
          <div key={s} className={`flex-1 h-[3px] rounded-full transition-colors duration-300 ${s <= step ? "bg-squad-saffron" : "bg-squad-bg3"}`} />
        ))}
      </div>

      <div className="px-6 flex flex-col gap-[18px]">
        {step === 1 && (
          <>
            <div className="flex flex-col gap-2">
              <label className="text-[13px] text-squad-text2 font-medium tracking-wide">Activity Name</label>
              <input className="bg-squad-bg3 border border-border rounded-[14px] px-4 py-3.5 text-foreground text-base outline-none transition-all focus:border-squad-saffron focus:shadow-[0_0_0_3px_hsl(25_100%_50%/0.25)] placeholder:text-squad-text3" placeholder="e.g. Sunrise Hike to Nandi Hills" value={form.title} onChange={e => set("title", e.target.value)} />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[13px] text-squad-text2 font-medium tracking-wide">Category</label>
              <div className="flex gap-2 flex-wrap">
                {ACTIVITY_CATEGORIES.map(cat => (
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
                <input type="date" className="bg-squad-bg3 border border-border rounded-[14px] px-4 py-3.5 text-foreground text-base outline-none transition-all focus:border-squad-saffron focus:shadow-[0_0_0_3px_hsl(25_100%_50%/0.25)]" value={form.date} onChange={e => set("date", e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[13px] text-squad-text2 font-medium tracking-wide">Time</label>
                <input type="time" className="bg-squad-bg3 border border-border rounded-[14px] px-4 py-3.5 text-foreground text-base outline-none transition-all focus:border-squad-saffron focus:shadow-[0_0_0_3px_hsl(25_100%_50%/0.25)]" value={form.time} onChange={e => set("time", e.target.value)} />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[13px] text-squad-text2 font-medium tracking-wide">Location</label>
              <input className="bg-squad-bg3 border border-border rounded-[14px] px-4 py-3.5 text-foreground text-base outline-none transition-all focus:border-squad-saffron focus:shadow-[0_0_0_3px_hsl(25_100%_50%/0.25)] placeholder:text-squad-text3" placeholder="e.g. Cubbon Park, Bengaluru" value={form.location} onChange={e => set("location", e.target.value)} />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[13px] text-squad-text2 font-medium tracking-wide flex justify-between">
                <span>Commitment Deposit (₹)</span>
                <span className="text-squad-saffron font-semibold">₹{form.deposit}</span>
              </label>
              <input type="range" min={49} max={999} step={50} value={form.deposit} onChange={e => set("deposit", Number(e.target.value))} className="w-full" />
              <div className="flex justify-between text-[11px] text-squad-text3">
                <span>₹49</span><span>₹999</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[13px] text-squad-text2 font-medium tracking-wide">Description (optional)</label>
              <textarea rows={3} className="bg-squad-bg3 border border-border rounded-[14px] px-4 py-3.5 text-foreground text-base outline-none transition-all focus:border-squad-saffron focus:shadow-[0_0_0_3px_hsl(25_100%_50%/0.25)] placeholder:text-squad-text3 resize-none" placeholder="What to bring, what to expect…" value={form.description} onChange={e => set("description", e.target.value)} />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[13px] text-squad-text2 font-medium tracking-wide flex justify-between">
                <span>Max People</span>
                <span className="text-squad-text2">{form.maxPeople}</span>
              </label>
              <input type="number" min={2} max={100} className="bg-squad-bg3 border border-border rounded-[14px] px-4 py-3.5 text-foreground text-base outline-none transition-all focus:border-squad-saffron focus:shadow-[0_0_0_3px_hsl(25_100%_50%/0.25)]" value={form.maxPeople} onChange={e => set("maxPeople", Number(e.target.value))} />
            </div>

            <button onClick={() => setStep(2)} disabled={!form.title || !form.category || !form.date}
              className="flex items-center justify-center gap-2 py-3.5 px-6 rounded-[14px] bg-squad-saffron text-primary-foreground font-medium shadow-saffron active:scale-[0.97] transition-all w-full disabled:opacity-50">
              Next: Invite People →
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <p className="text-squad-text2 text-sm mb-2">Select who you want to invite. They'll get a notification and can choose to join.</p>
            <div className="flex flex-col gap-2">
              {otherUsers.map(user => (
                <div key={user.id} onClick={() => toggleUser(user.id)}
                  className={`flex items-center gap-3 p-3 rounded-[14px] border-[1.5px] cursor-pointer transition-all ${
                    selectedUsers.includes(user.id) ? "border-squad-saffron bg-squad-saffron/[0.06]" : "border-transparent bg-squad-bg3"
                  }`}>
                  <SquadAvatar name={user.name} size="sm" />
                  <div>
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-squad-text3">{user.phone}</p>
                  </div>
                  <div className={`ml-auto w-[22px] h-[22px] rounded-md border-[1.5px] flex items-center justify-center transition-all ${
                    selectedUsers.includes(user.id) ? "bg-squad-saffron border-squad-saffron text-primary-foreground" : "bg-card border-border"
                  }`}>
                    {selectedUsers.includes(user.id) && <Check size={14} />}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2.5">
              <button onClick={() => setStep(1)} className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-[14px] bg-transparent text-foreground border border-foreground/10 font-medium active:bg-squad-bg3 transition-all">
                ← Back
              </button>
              <button onClick={() => setStep(3)} disabled={selectedUsers.length === 0}
                className="flex-[2] flex items-center justify-center gap-2 py-3.5 px-6 rounded-[14px] bg-squad-saffron text-primary-foreground font-medium shadow-saffron active:scale-[0.97] transition-all disabled:opacity-50">
                Review ({selectedUsers.length} invited) →
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-3.5">
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex gap-3.5 items-center mb-4">
                <div className="w-[52px] h-[52px] rounded-[14px] bg-squad-saffron/10 border border-squad-saffron/20 flex items-center justify-center text-[26px]">
                  {ACTIVITY_CATEGORIES.find(c => c.id === form.category)?.icon}
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
              <p className="text-[13px] text-squad-text2 mb-3">INVITING {selectedUsers.length} PEOPLE</p>
              <div className="flex">
                {selectedUsers.map(uid => {
                  const u = MOCK_USERS.find(u => u.id === uid)!;
                  return <div key={uid} className="-mr-2"><SquadAvatar name={u.name} size="sm" /></div>;
                })}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {selectedUsers.map(uid => {
                  const u = MOCK_USERS.find(u => u.id === uid)!;
                  return <span key={uid} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-foreground/5 text-squad-text2 border border-border">{u.name.split(" ")[0]}</span>;
                })}
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
