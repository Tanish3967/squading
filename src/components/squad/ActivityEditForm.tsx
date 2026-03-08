import { ChevronLeft } from "lucide-react";

interface EditFormData {
  title: string;
  date: string;
  time: string;
  location: string;
  deposit: number;
  description: string;
  maxPeople: number;
}

interface Props {
  editForm: EditFormData;
  onUpdate: (key: string, val: string | number) => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function ActivityEditForm({ editForm, onUpdate, onSave, onCancel }: Props) {
  return (
    <div className="min-h-screen flex flex-col pb-20 animate-fade-up">
      <div className="flex items-center justify-between pt-14 px-6 pb-5">
        <button onClick={onCancel} className="w-10 h-10 rounded-xl bg-secondary border border-border flex items-center justify-center text-foreground">
          <ChevronLeft size={22} />
        </button>
        <p className="font-display text-[17px] font-bold">Edit Activity</p>
        <div className="w-10" />
      </div>

      <div className="px-6 flex flex-col gap-[18px]">
        <div className="flex flex-col gap-2">
          <label className="text-[13px] text-muted-foreground font-medium tracking-wide">Activity Name</label>
          <input className="bg-secondary border border-border rounded-[14px] px-4 py-3.5 text-foreground text-base outline-none transition-all focus:border-primary focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.25)]"
            value={editForm.title} onChange={e => onUpdate("title", e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <label className="text-[13px] text-muted-foreground font-medium tracking-wide">Date</label>
            <input type="date" className="bg-secondary border border-border rounded-[14px] px-4 py-3.5 text-foreground text-base outline-none transition-all focus:border-primary focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.25)]"
              value={editForm.date} onChange={e => onUpdate("date", e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[13px] text-muted-foreground font-medium tracking-wide">Time</label>
            <input type="time" className="bg-secondary border border-border rounded-[14px] px-4 py-3.5 text-foreground text-base outline-none transition-all focus:border-primary focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.25)]"
              value={editForm.time} onChange={e => onUpdate("time", e.target.value)} />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[13px] text-muted-foreground font-medium tracking-wide">Location</label>
          <input className="bg-secondary border border-border rounded-[14px] px-4 py-3.5 text-foreground text-base outline-none transition-all focus:border-primary focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.25)]"
            value={editForm.location} onChange={e => onUpdate("location", e.target.value)} />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[13px] text-muted-foreground font-medium tracking-wide flex justify-between">
            <span>Commitment Deposit (₹)</span>
            <span className="text-primary font-semibold">₹{editForm.deposit}</span>
          </label>
          <input type="range" min={99} max={999} step={50} value={editForm.deposit} onChange={e => onUpdate("deposit", Number(e.target.value))} className="w-full" />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[13px] text-muted-foreground font-medium tracking-wide">Description</label>
          <textarea rows={3} className="bg-secondary border border-border rounded-[14px] px-4 py-3.5 text-foreground text-base outline-none transition-all focus:border-primary focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.25)] resize-none"
            value={editForm.description} onChange={e => onUpdate("description", e.target.value)} />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[13px] text-muted-foreground font-medium tracking-wide">Max People</label>
          <input type="number" min={2} max={100} className="bg-secondary border border-border rounded-[14px] px-4 py-3.5 text-foreground text-base outline-none transition-all focus:border-primary focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.25)]"
            value={editForm.maxPeople} onChange={e => onUpdate("maxPeople", Number(e.target.value))} />
        </div>

        <button onClick={onSave} disabled={!editForm.title || !editForm.date}
          className="flex items-center justify-center gap-2 py-3.5 px-6 rounded-[14px] bg-primary text-primary-foreground font-medium shadow-saffron active:scale-[0.97] transition-all w-full disabled:opacity-50">
          Save Changes
        </button>
      </div>
    </div>
  );
}
