import { ChevronLeft } from "lucide-react";

interface Props {
  deposit: number;
  activityTitle: string;
  processing: boolean;
  onPay: () => void;
  onBack: () => void;
}

export default function PaymentScreen({ deposit, activityTitle, processing, onPay, onBack }: Props) {
  return (
    <div className="min-h-screen flex flex-col pb-20 animate-fade-up">
      <div className="flex items-center justify-between pt-14 px-6 pb-5">
        <button onClick={onBack} className="w-10 h-10 rounded-xl bg-secondary border border-border flex items-center justify-center text-foreground">
          <ChevronLeft size={22} />
        </button>
        <p className="font-display text-[17px] font-bold">Pay Deposit</p>
        <div className="w-10" />
      </div>

      <div className="px-6 flex flex-col gap-5">
        <div className="text-center py-6">
          <div className="w-20 h-20 rounded-3xl bg-[hsl(var(--squad-phonepe)/0.15)] border border-[hsl(var(--squad-phonepe)/0.3)] flex items-center justify-center text-4xl mx-auto mb-4">💸</div>
          <p className="font-display text-xl font-bold mb-1.5">Commitment Deposit</p>
          <p className="text-muted-foreground text-sm leading-relaxed">
            This ₹{deposit} deposit will be refunded after you show up to <strong className="text-foreground">{activityTitle}</strong>
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-xs text-[hsl(var(--squad-text3))] mb-3">PAYMENT SUMMARY</p>
          {[["Commitment deposit", `₹${deposit}`], ["Platform fee", "₹0"], ["GST", "₹0"]].map(([l, v]) => (
            <div key={l} className="flex justify-between py-2.5 border-b border-border text-sm">
              <span className="text-muted-foreground">{l}</span><span>{v}</span>
            </div>
          ))}
          <div className="flex justify-between pt-3.5 text-base font-bold">
            <span>Total</span>
            <span className="text-primary">₹{deposit}</span>
          </div>
        </div>

        <div className="p-3.5 bg-[hsl(var(--squad-green)/0.06)] border border-[hsl(var(--squad-green)/0.15)] rounded-[14px]">
          <p className="text-[13px] text-[hsl(var(--squad-green))] leading-relaxed">
            ✅ <strong>100% refund</strong> when the activity host marks you as attended. Usually within 48 hours after the event.
          </p>
        </div>

        <div>
          <p className="text-xs text-[hsl(var(--squad-text3))] mb-2.5 text-center">PAY SECURELY VIA</p>
          <div className="flex items-center gap-2.5 p-4 bg-[hsl(var(--squad-phonepe)/0.1)] border border-[hsl(var(--squad-phonepe)/0.25)] rounded-[14px] mb-3.5">
            <div className="w-9 h-9 rounded-[10px] bg-[hsl(var(--squad-phonepe))] flex items-center justify-center text-lg">🟣</div>
            <div>
              <p className="font-semibold text-sm">PhonePe</p>
              <p className="text-xs text-[hsl(var(--squad-text3))]">UPI · Wallet · Cards</p>
            </div>
            <div className="ml-auto text-[11px] px-2 py-0.5 bg-[hsl(var(--squad-green)/0.1)] text-[hsl(var(--squad-green))] rounded-md border border-[hsl(var(--squad-green)/0.2)]">Secured</div>
          </div>
          <button onClick={onPay} disabled={processing}
            className="flex items-center justify-center gap-2 py-3.5 px-6 rounded-[14px] bg-[hsl(var(--squad-phonepe))] text-foreground font-medium shadow-phonepe active:scale-[0.97] transition-all w-full disabled:opacity-50">
            {processing ? <span className="animate-pulse-soft">Processing…</span> : `Pay ₹${deposit} via PhonePe`}
          </button>
        </div>
        <p className="text-center text-[11px] text-[hsl(var(--squad-text3))]">Powered by PhonePe Payment Gateway · PCI-DSS Compliant</p>
      </div>
    </div>
  );
}
