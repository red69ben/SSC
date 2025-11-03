import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ---------------------------------------------
// SSC — שוקינג Service Calculator
// Dark UI (black) with orange text accents
// Single-file React component (Tailwind CSS)
// ---------------------------------------------

// Simple inline ShocKing logo (placeholder). Replace with your real logo when ready.
const ShocKingLogo = () => (
  <img
    src="https://www.simonline.co.il/Uploads/%D7%A8%D7%90%D7%A9%D7%99/%D7%A1%D7%93%D7%A0%D7%AA%20%D7%91%D7%95%D7%9C%D7%9E%D7%99%D7%9D.png"
    alt="ShocKing Logo"
    className="h-14 w-auto select-none"
  />
);

// Big centered hero logo (C3) with "shock bounce" animation (D)
const HeroLogo = () => (
  <motion.img
    src="https://www.simonline.co.il/Uploads/%D7%A8%D7%90%D7%A9%D7%99/%D7%90%D7%97%D7%95%D7%A8%D7%99%20%D7%97%D7%AA%D7%95%D7%9A.png"
    alt="ShocKing Hero Logo"
    className="mx-auto h-40 sm:h-52 md:h-64 lg:h-72 w-auto select-none drop-shadow-[0_0_25px_rgba(255,115,0,0.45)]"
    initial={{ y: -18, opacity: 0, scale: 0.9 }}
    animate={{ y: 0, opacity: 1, scale: 1 }}
    transition={{ duration: 0.55 }}
  />
);

// ---------------------- Utils & Config ----------------------
function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
function formatNumber(n: number) {
  return new Intl.NumberFormat("he-IL").format(n);
}

// Base intervals by brand (KM)
const BASE_INTERVAL_KM: Record<string, { fork: number; shock: number }> = {
  FOX: { fork: 1500, shock: 1000 },
  ROCKSHOX: { fork: 1200, shock: 800 },
  PUSH: { fork: 1000, shock: 700 },
  "Öhlins": { fork: 1000, shock: 800 },
};

// Riding style multipliers
const STYLE_MULTIPLIER: Record<string, number> = {
  "XC – קרוס קאנטרי": 1.25,
  "Trail – טרייל": 1.05,
  "All Mountain – אל מאונטן": 0.9,
  "Enduro – אנדורו": 0.92, // יותר סלחני מ-0.80 כדי לא להבהיל לקוחות
  "Downhill – דאונהיל": 0.65,
};

// Rider level multipliers
const RIDER_LEVEL_MULTIPLIER: Record<string, number> = {
  "חובבן": 1.2,
  "חובבן פלוס": 1.1,
  "מקצוען": 0.95,
  "מתחרה": 0.85,
};

// Avg trail speed (kph) used to convert manufacturer HOURS → KM
const AVG_KPH_BY_STYLE: Record<string, number> = {
  "XC – קרוס קאנטרי": 18,
  "Trail – טרייל": 14,
  "All Mountain – אל מאונטן": 12,
  "Enduro – אנדורו": 10,
  "Downhill – דאונהיל": 8,
};

// Manufacturer policies (official cadence per brand)
// This is used for display (hours/time) and for deriving a base in KM (via AVG_KPH)
const MFG_POLICY: Record<string, any> = {
  FOX: {
    fork: { fullHours: 125, time: "שנה" },
    shock: { fullHours: 125, time: "שנה" },
  },
  ROCKSHOX: {
    fork: { lowerHours: 50, fullHours: 100 },
    shock: { airCanHours: 50, fullHoursRange: [100, 200] },
  },
  "Öhlins": {
    fork: { lowerHours: 50, fullHours: 100, time: "שנה" },
    shock: { airCanHours: 100, fullHours: 100, time: "שנה (דמפר עד שנתיים)" },
  },
  PUSH: {
    fork: { time: "שנה (שירות מלא)" },
    shock: { time: "שנה (שירות מלא)" },
  },
};

// Model lists per brand
const MODELS: Record<string, { fork: string[]; shock: string[] }> = {
  FOX: {
    fork: ["34", "36", "38", "40"],
    shock: ["Float X", "DHX", "DHX2"],
  },
  ROCKSHOX: {
    fork: ["SID", "Pike", "Lyrik", "Zeb"],
    shock: ["Deluxe", "Super Deluxe", "Vivid"],
  },
  PUSH: {
    fork: ["ACS3", "HC97"],
    shock: ["ElevenSix", "SV EIGHT", "VT/X"],
  },
  "Öhlins": {
    fork: ["RXF34", "RXF36", "DH38"],
    shock: ["TTX Air"],
  },
};

// Per‑model KM offsets (positive = longer, negative = shorter)
const MODEL_OFFSETS_KM: Record<string, number> = {
  "Float X": -50,
  
  DHX: -80,
  DHX2: -120,
  Deluxe: -40,
  "Super Deluxe": -80,
  Vivid: -100,
  ElevenSix: -150,
  "SV EIGHT": -120,
  "VT/X": -120,
  "TTX Air": -60,
  ACS3: 0,
  HC97: 0,
};

// Piggyback presence by rear shock model (affects service price)
const SHOCK_PIGGYBACK: Record<string, boolean> = {
  "Float X": true,
  DHX: true,
  DHX2: true,
  Deluxe: false,
  "Super Deluxe": true,
  Vivid: true,
  ElevenSix: true,
  "SV EIGHT": true,
  "VT/X": true,
  "TTX Air": true,
};

// Result box component: Manufacturer vs Personal recommendation
function ResultBox({ mfgHoursText, mfgTimeText, personalKm, priceNis, whatsappUrl }: { mfgHoursText?: string; mfgTimeText?: string; personalKm: number; priceNis: number; whatsappUrl: string }) {

  // Build WhatsApp message & URL for direct booking (computed in parent)
  

  return (
    <motion.div
      className="w-full max-w-lg mx-auto rounded-2xl border border-orange-500/60 p-5 sm:p-6 bg-white/10 backdrop-blur-md ring-1 ring-orange-500/20 shadow-[0_0_28px_rgba(255,115,0,0.35)] text-center"
      initial={{ y: 8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="space-y-3 text-center">
        <div>
          <div className="text-xs text-orange-300/80 font-semibold">המלצת יצרן:</div>
          {mfgHoursText && (
            <div className="text-sm sm:text-base font-bold text-white/90 leading-snug" dir="rtl">{mfgHoursText}</div>
          )}
          {mfgTimeText && (
            <div className="text-sm sm:text-base font-semibold text-orange-200/90 leading-snug">{mfgTimeText}</div>
          )}
        </div>
        <div className="pt-1">
          <div className="text-xs text-orange-300/80 font-semibold">המלצה משוקללת על פי נתוני רוכב:</div>
          <div className="text-2xl sm:text-3xl font-extrabold font-[Assistant] text-white leading-snug tracking-wide">
            ~{formatNumber(personalKm)} ק"מ
          </div>
        </div>
        <div className="pt-2">
          <div className="text-xs text-orange-300/80 font-semibold">מחיר טיפול משוער:</div>
          <div className="text-xl sm:text-2xl font-extrabold text-white leading-snug">₪{formatNumber(priceNis)}</div>
          <div className="text-[11px] text-orange-300/70 mt-0.5">* לא נגבים דמי פירוק והרכבה</div>
        </div>
      </div>
    </motion.div>
  );
}

export default function SSC() {
  // Form state
  const [isEbike, setIsEbike] = useState<boolean>(false);
  const [productType, setProductType] = useState<"fork" | "shock">("fork");
  const [brand, setBrand] = useState<string>("FOX");
  const [model, setModel] = useState<string>(MODELS["FOX"].fork[0]);
  const [style, setStyle] = useState<string>("Trail – טרייל");
  const [ridingLevel, setRidingLevel] = useState<string>("חובבן");
  const [bikeKg, setBikeKg] = useState<number>(15);
  const [riderKg, setRiderKg] = useState<number>(80);
  const [kmSince, setKmSince] = useState<number>(0);

  // Touched flags for badges (show only after explicit user interaction)
      
  // Keep model list in sync with selected brand
  const modelOptions = useMemo(() => {
    const brandModels = MODELS[brand];
    if (!brandModels) return [];
    return productType === "fork" ? brandModels.fork : brandModels.shock;
  }, [brand, productType]);

  // Update model when brand or productType changes
  React.useEffect(() => {
    if (!modelOptions.includes(model)) {
      setModel(modelOptions[0] || "");
    }
  }, [brand, productType, modelOptions, model]);

  // Core computation
  const result = useMemo(() => {
    const baseByBrand = BASE_INTERVAL_KM[brand] ?? BASE_INTERVAL_KM.FOX;

    // Manufacturer hours → base hours (full service)
    const policy = (MFG_POLICY[brand] || {})[productType] || {};
    const fullHours: number | undefined = policy.fullHours ?? (policy.fullHoursRange ? policy.fullHoursRange[0] : undefined);

    // Avg kph by style for conversion
    const avgKph = AVG_KPH_BY_STYLE[style] ?? 14;

    // Derive base KM from manufacturer hours when available; otherwise fall back to legacy KM base
    const baseKmFromHours = typeof fullHours === "number" ? Math.round(fullHours * avgKph) : undefined;
    const legacyBaseKm = productType === "fork" ? baseByBrand.fork : baseByBrand.shock;
    const baseKm = typeof baseKmFromHours === "number" ? baseKmFromHours : legacyBaseKm;

    // Riding style factor
    const styleFactor = STYLE_MULTIPLIER[style] ?? 1.0;
    // Rider level factor
    const levelFactor = RIDER_LEVEL_MULTIPLIER[ridingLevel] ?? 1.0;

    // Weight factor — compares total system weight to 95kg reference (bike 15 + rider 80)
    const totalW = (Number(bikeKg) || 0) + (Number(riderKg) || 0);
    const refW = 95;
    const weightFactor = clamp(refW / Math.max(totalW, 1), 0.8, 1.2);

    // E‑Bike factor
    const eBikeFactor = isEbike ? 0.85 : 1.0;

    // Model bias
    const modelOffset = MODEL_OFFSETS_KM[model] ?? 0;

    // Final recommended interval (in KM)
    const leniencyFactor = 1.1; // make calculator more customer‑friendly
    const recommendedKmRaw = baseKm * styleFactor * levelFactor * weightFactor * eBikeFactor * leniencyFactor + modelOffset;
    const recommendedKm = Math.max(600, Math.round(recommendedKmRaw)); // never below 300km

    // Build manufacturer texts
    let mfgHoursText = "";
    let mfgTimeText = "";
    if (brand === "FOX") {
      mfgHoursText = "טיפול מלא: 125 שעות";
      mfgTimeText = "או שנה (המוקדם)";
    } else if (brand === "ROCKSHOX") {
      if (productType === "fork") mfgHoursText = "שימון רגליים תחתונות: 50 שעות · טיפול מלא: 100 שעות";
      else mfgHoursText = "שירות אייר‑קאן (קפיץ אוויר): 50 שעות · טיפול מלא: 100–200 שעות (לפי דגם)";
    } else if (brand === "Öhlins") {
      if (productType === "fork") {
        mfgHoursText = "ניקוי רגליים תחתונות: 50 שעות · טיפול מלא: 100 שעות";
        mfgTimeText = "או שנה";
      } else {
        mfgHoursText = "שירות קפיץ אוויר: 100 שעות · שירות דמפר: 100 שעות";
        mfgTimeText = "או שנה (לדמפר עד שנתיים)";
      }
    } else if (brand === "PUSH") {
      mfgTimeText = "שנה (שירות מלא)";
    }

    // Due logic
    const kmLeft = Math.max(0, recommendedKm - (Number(kmSince) || 0));
    const isDue = kmLeft === 0 || (Number(kmSince) || 0) >= recommendedKm;

    // Suggest calendar/warranty cadence (months) — rough mapping 1000km ≈ ~6–8 months casual
    const months = clamp(Math.round((recommendedKm / 1000) * 7), 1, 24);

    const servicePrice = productType === "fork" ? 550 : (SHOCK_PIGGYBACK[model] ? 650 : 550);

    return { baseKm, recommendedKm, kmLeft, isDue, months, mfgHoursText, mfgTimeText, servicePrice };
  }, [productType, brand, model, style, ridingLevel, bikeKg, riderKg, kmSince, isEbike]);

  
  // handlePrint removed — using direct anchor link to avoid popup blockers

  // Build WhatsApp message & URL for direct booking (computed in parent)
  const typeHe = productType === "fork" ? "מזלג" : "בולם אחורי";
  const msg = `היי, אני מעוניין לקבוע טיפול לבולם מסוג ${brand} דגם ${model} (${typeHe}).
מתי הולך להגיע?`;
  const waUrl = `https://wa.me/972522567888?text=${encodeURIComponent(msg)}`;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-ה-screen w-full bg-[#0c0d0d] text-orange-500 ">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0c0d0d]/80 backdrop-blur border-b border-orange-500/20">
        {/* Google Fonts: Assistant */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Assistant:wght@400;600;700;800&display=swap" rel="stylesheet" />
        <div className="mx-auto max-w-2xl px-4 py-4 flex items-center justify-between">
          <motion.div initial={{ y: -12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4 }}>
            
          </motion.div>
          <motion.div className="text-sm text-orange-300/80 hidden sm:block" initial={{ y: -12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4, delay: 0.05 }}>
            SSC — ShocKIng Service Calculator
          </motion.div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-2xl px-4 pt-8 pb-4 text-center">
        <motion.h1
          className="mt-4 text-4xl sm:text-6xl font-extrabold text-white leading-tight tracking-wide drop-shadow-[0_0_18px_rgba(255,115,0,0.55)] font-[Assistant]"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          מחשבון טיפולי בולמים
        </motion.h1>
        <motion.div
          className="mt-1 text-orange-400 font-bold tracking-wider text-sm "
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.45, delay: 0.05 }}
        >
          SSC – ShocKIng Service Calculator
        </motion.div>
        <motion.p className="mt-2 text-orange-300/90 leading-relaxed" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, delay: 0.1 }}>
          קבלו המלצה חכמה מתי לבצע טיפול תקופתי למזלג או לבולם האחורי, לפי היצרן, הדגם, סגנון הרכיבה והמשקל הכולל.
        </motion.p>
      </section>

      {/* Calculator Card */}
      <main className="mx-auto max-w-5xl px-4 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:flex-row">
          <aside className="order-2 lg:order-1 lg:col-span-4 rounded-2xl border border-orange-500/30 bg-white/5 backdrop-blur-sm ring-1 ring-orange-500/15 p-4 sm:p-5 sticky top-24 h-max" dir="rtl">
            <h3 className="text-orange-300 font-bold text-lg mb-2">שאלות נפוצות</h3>
            <!-- FAQ content omitted in this compact export to keep file shorter -->
          </aside>

          <motion.div className="lg:col-span-8 rounded-2xl border border-orange-500/30 bg-white/5 backdrop-blur-md ring-1 ring-orange-500/15 shadow-[0_0_32px_rgba(255,115,0,0.18)] p-4 sm:p-6" initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3 }}>
            <form className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <!-- Form content omitted for brevity -->
            </form>

            <div className="mt-6 text-xs text-orange-300/70 leading-relaxed text-center">
              * המחשבון מספק הערכה כללית בלבד. השימוש בו על אחריות המשתמש. שוקינג אינה נושאת באחריות לכל נזק שייגרם עקב שימוש או הסתמכות על התוצאות.
            </div>
          </motion.div>
        </div>
      </main>
    </motion.div>
  );
}
