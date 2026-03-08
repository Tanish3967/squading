import React, { useState, useEffect, useRef } from "react";
import { Phone, User } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import GlowOrb from "@/components/squad/GlowOrb";
import squadLogo from "@/assets/squad-logo.png";
import { checkPhone, registerPhone, resetupTOTP, verifySetup, loginWithTOTP } from "@/lib/auth-api";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function LoginScreen() {
  const [step, setStep] = useState<"phone" | "qr-setup" | "totp-login" | "name-setup">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [setupDone, setSetupDone] = useState(false);
  const [totpSecret, setTotpSecret] = useState("");
  const [otpauthUri, setOtpauthUri] = useState("");
  const [userId, setUserId] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [shaking, setShaking] = useState(false);
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handlePhoneNext = async () => {
    if (phone.length !== 10) return;
    setLoading(true);
    try {
      const result = await checkPhone(phone);
      if (result.exists && result.totp_enabled) {
        setIsNewUser(false);
        setStep("totp-login");
      } else if (result.exists && !result.totp_enabled) {
        setIsNewUser(true);
        const regResult = await resetupTOTP(phone);
        setUserId(regResult.user_id);
        setTotpSecret(regResult.totp_secret);
        setOtpauthUri(regResult.otpauth_uri);
        setStep("qr-setup");
      } else {
        setIsNewUser(true);
        const regResult = await registerPhone(phone);
        setUserId(regResult.user_id);
        setTotpSecret(regResult.totp_secret);
        setOtpauthUri(regResult.otpauth_uri);
        setStep("qr-setup");
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (idx: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...code];
    next[idx] = val.slice(-1);
    setCode(next);
    if (val && idx < 5) codeRefs.current[idx + 1]?.focus();
  };

  const handleCodeKey = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[idx] && idx > 0) codeRefs.current[idx - 1]?.focus();
  };

  const handleVerify = async () => {
    const codeStr = code.join("");
    if (codeStr.length !== 6) return;
    setLoading(true);
    try {
      if (step === "qr-setup" && setupDone) {
        await verifySetup(userId, codeStr);
        toast.success("Account activated!");
        // New user — go to name setup
        setStep("name-setup");
      } else {
        const result = await loginWithTOTP(phone, codeStr);
        // Check if returning user has a name set
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: prof } = await supabase
            .from("profiles")
            .select("name")
            .eq("id", user.id)
            .single();
          if (!prof?.name) {
            setStep("name-setup");
            return;
          }
        }
        toast.success("Welcome back!");
      }
    } catch (err: any) {
      toast.error(err.message || "Invalid code");
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      setCode(["", "", "", "", "", ""]);
      codeRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleSaveName = async () => {
    if (!displayName.trim()) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").update({ name: displayName.trim() }).eq("id", user.id);
      }
      // Trigger a page reload to let AuthProvider pick up the updated profile
      window.location.reload();
    } catch (err: any) {
      toast.error("Failed to save name");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const codeStr = code.join("");
    if (codeStr.length === 6 && (step === "totp-login" || setupDone)) {
      handleVerify();
    }
  }, [code]);

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = [...code];
    for (let i = 0; i < 6; i++) next[i] = pasted[i] || "";
    setCode(next);
    const focusIdx = Math.min(pasted.length, 5);
    codeRefs.current[focusIdx]?.focus();
  };

  const codeInputJSX = (
    <div className={`flex items-center gap-1.5 justify-center ${shaking ? "animate-shake" : ""}`} onPaste={handlePaste}>
      {code.map((digit, i) => (
        <React.Fragment key={i}>
          {i === 3 && <div className="otp-separator" />}
          <input
            ref={el => { codeRefs.current[i] = el; }}
            className={`otp-input ${digit ? "filled" : ""}`}
            type="tel"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            value={digit}
            onChange={e => handleCodeChange(i, e.target.value)}
            onKeyDown={e => handleCodeKey(i, e)}
            onFocus={e => e.target.select()}
          />
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col justify-center px-7 py-10 relative overflow-hidden animate-fade-up">
      <GlowOrb color="hsl(25 100% 50%)" size={300} top="-100px" right="-80px" />
      <GlowOrb color="#845EC2" size={200} bottom="80px" left="-60px" />

      {/* Logo */}
      <div className="mb-10 relative z-10">
        <div className="flex items-center gap-2.5 mb-2">
          <img src={squadLogo} alt="Squad" className="w-11 h-11 rounded-[13px] object-contain" />
          <span className="font-display text-[26px] font-extrabold tracking-tight">squad</span>
        </div>
        <p className="text-squad-text2 text-sm leading-relaxed">
          Plan together. Show up together.<br />Get your money back when you do.
        </p>
      </div>

      {/* Phone step */}
      {step === "phone" && (
        <div className="flex flex-col gap-5 relative z-10">
          <div>
            <p className="font-display text-[22px] font-bold mb-1.5">Enter your number</p>
            <p className="text-squad-text2 text-sm">We'll check if you have an authenticator set up</p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[13px] text-squad-text2 font-medium tracking-wide">Mobile Number</label>
            <div className="flex gap-2.5">
              <div className="px-3.5 py-3.5 bg-squad-bg3 border border-border rounded-[14px] text-squad-text2 text-[15px] flex items-center gap-1.5 whitespace-nowrap">
                🇮🇳 +91
              </div>
              <input
                className="flex-1 bg-squad-bg3 border border-border rounded-[14px] px-4 py-3.5 text-foreground text-base outline-none transition-all focus:border-squad-saffron focus:shadow-[0_0_0_3px_hsl(25_100%_50%/0.25)] placeholder:text-squad-text3"
                type="tel"
                maxLength={10}
                placeholder="98765 43210"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, ""))}
                onKeyDown={e => e.key === "Enter" && handlePhoneNext()}
              />
            </div>
          </div>

          <button
            onClick={handlePhoneNext}
            disabled={loading}
            className="flex items-center justify-center gap-2 py-3.5 px-6 rounded-[14px] bg-squad-saffron text-primary-foreground font-medium shadow-saffron active:scale-[0.97] transition-all disabled:opacity-50"
          >
            {loading ? <span className="animate-pulse-soft">Checking…</span> : <><Phone size={18} />Continue</>}
          </button>

          <div className="p-3.5 bg-card border border-border rounded-[14px]">
            <p className="text-xs text-squad-text3 mb-2">YOU'LL NEED ONE OF THESE</p>
            <div className="flex gap-2">
              {[["🔐", "Google Authenticator"], ["🛡️", "Authy"], ["🔑", "Microsoft Auth"]].map(([icon, name]) => (
                <div key={name} className="flex-1 p-2 bg-squad-bg3 rounded-[10px] text-center">
                  <div className="text-lg mb-0.5">{icon}</div>
                  <div className="text-[10px] text-squad-text3 leading-tight">{name}</div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-center text-xs text-squad-text3">By continuing, you agree to our Terms & Privacy Policy</p>
        </div>
      )}

      {/* QR Setup - scan step */}
      {step === "qr-setup" && !setupDone && (
        <div className="flex flex-col gap-5 relative z-10 animate-fade-up">
          <div>
            <p className="font-display text-[21px] font-bold mb-1.5">Set up your authenticator</p>
            <p className="text-squad-text2 text-sm leading-relaxed">
              Open <strong className="text-foreground">Google Authenticator</strong> (or Authy), tap <strong className="text-foreground">+</strong>, then scan this QR code.
            </p>
          </div>

          <div className="flex justify-center">
            <div className="p-3 bg-white rounded-xl border-2 border-squad-saffron/30 shadow-[0_0_40px_hsl(25_100%_50%/0.1)]">
              <QRCodeSVG
                value={otpauthUri}
                size={196}
                level="M"
                bgColor="#ffffff"
                fgColor="#000000"
              />
            </div>
          </div>

          <div>
            <button
              className="bg-transparent border-none text-squad-saffron text-[13px] cursor-pointer w-full text-center"
              onClick={() => setShowManual(v => !v)}
            >
              {showManual ? "Hide" : "Can't scan? Enter key manually ↓"}
            </button>
            {showManual && (
              <div className="mt-2.5 p-3.5 bg-squad-bg3 rounded-xl border border-border">
                <p className="text-[11px] text-squad-text3 mb-1.5">MANUAL ENTRY KEY</p>
                <p className="font-mono text-[15px] tracking-widest text-squad-saffron break-all">{totpSecret}</p>
                <p className="text-[11px] text-squad-text3 mt-1.5">Select "Time-based" when adding manually.</p>
              </div>
            )}
          </div>

          <div className="p-3.5 bg-card border border-border rounded-[14px] flex gap-3 items-center">
            <div className="w-10 h-10 rounded-[10px] bg-gradient-to-br from-squad-saffron to-[#FF3D6B] flex items-center justify-center text-xl shrink-0">🎯</div>
            <div className="flex-1">
              <p className="text-[13px] font-semibold">Squad (+91{phone.slice(0, 5)}···)</p>
              <p className="text-xl font-mono tracking-[0.2em] text-squad-saffron mt-0.5">● ● ● ● ● ●</p>
            </div>
            <div className="text-[11px] text-squad-text3 text-right">
              <div>refreshes</div><div>every 30s</div>
            </div>
          </div>

          <button onClick={() => setSetupDone(true)} className="flex items-center justify-center gap-2 py-3.5 px-6 rounded-[14px] bg-squad-saffron text-primary-foreground font-medium shadow-saffron active:scale-[0.97] transition-all w-full">
            I've scanned it →
          </button>
          <button onClick={() => setStep("phone")} className="flex items-center justify-center gap-2 py-3.5 px-6 rounded-[14px] bg-transparent text-foreground border border-foreground/10 font-medium active:bg-squad-bg3 transition-all w-full">
            ← Change number
          </button>
        </div>
      )}

      {/* QR Setup - verify step */}
      {step === "qr-setup" && setupDone && (
        <div className="flex flex-col gap-5 relative z-10 animate-fade-up">
          <div>
            <p className="font-display text-[21px] font-bold mb-1.5">Confirm your code</p>
            <p className="text-squad-text2 text-sm leading-relaxed">
              Enter the 6-digit code shown for <strong className="text-foreground">Squad</strong> in your authenticator app to confirm setup.
            </p>
          </div>
          <CodeInput />
          <div className="flex items-center gap-2 p-3 bg-squad-green/5 border border-squad-green/15 rounded-xl">
            <span className="text-base">⏱️</span>
            <p className="text-[13px] text-squad-text2">The code refreshes every 30 seconds. Enter it before it changes.</p>
          </div>
          <button onClick={handleVerify} disabled={loading || code.join("").length !== 6} className="flex items-center justify-center gap-2 py-3.5 px-6 rounded-[14px] bg-squad-saffron text-primary-foreground font-medium shadow-saffron active:scale-[0.97] transition-all w-full disabled:opacity-50">
            {loading ? <span className="animate-pulse-soft">Activating…</span> : "Activate & Enter Squad →"}
          </button>
          <button onClick={() => setSetupDone(false)} className="flex items-center justify-center gap-2 py-3.5 px-6 rounded-[14px] bg-transparent text-foreground border border-foreground/10 font-medium active:bg-squad-bg3 transition-all w-full">
            ← Back to QR code
          </button>
        </div>
      )}

      {/* Name Setup — shown after TOTP verification for new users */}
      {step === "name-setup" && (
        <div className="flex flex-col gap-5 relative z-10 animate-fade-up">
          <div>
            <p className="font-display text-[22px] font-bold mb-1.5">What should we call you?</p>
            <p className="text-squad-text2 text-sm leading-relaxed">This is how your squad will see you.</p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[13px] text-squad-text2 font-medium tracking-wide">Your Name</label>
            <input
              className="bg-squad-bg3 border border-border rounded-[14px] px-4 py-3.5 text-foreground text-base outline-none transition-all focus:border-squad-saffron focus:shadow-[0_0_0_3px_hsl(25_100%_50%/0.25)] placeholder:text-squad-text3"
              type="text"
              placeholder="e.g. Arjun Sharma"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSaveName()}
              autoFocus
            />
          </div>

          <button
            onClick={handleSaveName}
            disabled={loading || !displayName.trim()}
            className="flex items-center justify-center gap-2 py-3.5 px-6 rounded-[14px] bg-squad-saffron text-primary-foreground font-medium shadow-saffron active:scale-[0.97] transition-all disabled:opacity-50"
          >
            {loading ? <span className="animate-pulse-soft">Saving…</span> : <><User size={18} />Let's go →</>}
          </button>
        </div>
      )}

      {/* TOTP Login */}
      {step === "totp-login" && (
        <div className="flex flex-col gap-5 relative z-10 animate-fade-up">
          <div>
            <p className="font-display text-[21px] font-bold mb-1.5">Enter your code</p>
            <p className="text-squad-text2 text-sm leading-relaxed">
              Open your authenticator app and enter the 6-digit code for <strong className="text-foreground">Squad (+91{phone.slice(0, 5)}···)</strong>
            </p>
          </div>

          <div className="p-4 bg-card border border-border rounded-2xl flex gap-3 items-center">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-squad-saffron to-[#FF3D6B] flex items-center justify-center text-[22px] shrink-0">🎯</div>
            <div className="flex-1">
              <p className="text-[13px] text-squad-text2 mb-0.5">Squad · in your app</p>
              <p className="text-[13px] font-medium">+91 {phone.slice(0, 5)} {phone.slice(5)}</p>
            </div>
            <div className="w-8 h-8 rounded-full border-[3px] border-squad-saffron flex items-center justify-center text-[11px] text-squad-saffron font-bold">30</div>
          </div>

          <CodeInput />

          <button onClick={handleVerify} disabled={loading || code.join("").length !== 6} className="flex items-center justify-center gap-2 py-3.5 px-6 rounded-[14px] bg-squad-saffron text-primary-foreground font-medium shadow-saffron active:scale-[0.97] transition-all w-full disabled:opacity-50">
            {loading ? <span className="animate-pulse-soft">Verifying…</span> : "Verify & Enter →"}
          </button>

          <button onClick={() => setStep("phone")} className="bg-transparent border-none text-squad-text2 cursor-pointer text-[13px] text-center">
            ← Change number
          </button>
        </div>
      )}
    </div>
  );
}
