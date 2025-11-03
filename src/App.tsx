
import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
function formatNumber(n: number) {
  return new Intl.NumberFormat("he-IL").format(n);
}

const BASE_INTERVAL_KM: Record<string, { fork: number; shock: number }> = {
  FOX: { fork: 1500, shock: 1000 },
  ROCKSHOX: { fork: 1200, shock: 800 },
  PUSH: { fork: 1000, shock: 700 },
  "Öhlins": { fork: 1000, shock: 800 },
};

const STYLE_MULTIPLIER: Record<string, number> = {
  "XC – קרוס קאנטרי": 1.25,
  "Trail – טרייל": 1.05,
  "All Mountain – אל מאונטן": 0.9,
  "Enduro – אנדורו": 0.92,
  "Downhill – דאונהיל": 0.65,
};

const RIDER_LEVEL_MULTIPLIER: Record<string, number> = {
  "חובבן": 1.2,
  "חובבן פלוס": 1.1,
  "מקצוען": 0.95,
  "מתחרה": 0.85,
};

const AVG_KPH_BY_STYLE: Record<string, number> = {
  "XC – קרוס קאנטרי": 18,
  "Trail – טרייל": 14,
  "All Mountain – אל מאונטן": 12,
  "Enduro – אנדורו": 10,
  "Downhill – דאונהיל": 8,
};

const MFG_POLICY: Record<string, any> = {
  FOX: { fork: { fullHours: 125, time: "שנה" }, shock: { fullHours: 125, time: "שנה" } },
  ROCKSHOX: { fork: { lowerHours: 50, fullHours: 100 }, shock: { airCanHours: 50, fullHoursRange: [100, 200] } },
  "Öhlins": { fork: { lowerHours: 50, fullHours: 100, time: "שנה" }, shock: { airCanHours: 100, fullHours: 100, time: "שנה (דמפר עד שנתיים)" } },
  PUSH: { fork: { time: "שנה (שירות מלא)" }, shock: { time: "שנה (שירות מלא)" } },
};

const MODELS: Record<string, { fork: string[]; shock: string[] }> = {
  FOX: { fork: ["34","36","38","40"], shock: ["Float X","DHX","DHX2"] },
  ROCKSHOX: { fork: ["SID","Pike","Lyrik","Zeb"], shock: ["Deluxe","Super Deluxe","Vivid"] },
  PUSH: { fork: ["ACS3","HC97"], shock: ["ElevenSix","SV EIGHT","VT/X"] },
  "Öhlins": { fork: ["RXF34","RXF36","DH38"], shock: ["TTX Air"] },
};

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

function ResultBox({ mfgHoursText, mfgTimeText, personalKm, priceNis }: { mfgHoursText?: string; mfgTimeText?: string; personalKm: number; priceNis: number }) {
  return (
    <motion.div className="w-full max-w-lg mx-auto rounded-2xl border border-orange-500/60 p-5 sm:p-6 bg-white/10 backdrop-blur-md ring-1 ring-orange-500/20 text-center" initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.3 }}>
      <div className="space-y-3 text-center">
        <div>
          <div className="text-xs text-orange-300/80 font-semibold">המלצת יצרן:</div>
          {mfgHoursText && (<div className="text-sm sm:text-base font-bold text-white/90 leading-snug" dir="rtl">{mfgHoursText}</div>)}
          {mfgTimeText && (<div className="text-sm sm:text-base font-semibold text-orange-200/90 leading-snug">{mfgTimeText}</div>)}
        </div>
        <div className="pt-1">
          <div className="text-xs text-orange-300/80 font-semibold">המלצה משוקללת על פי נתוני רוכב:</div>
          <div className="text-2xl sm:text-3xl font-extrabold font-[Assistant] text-white leading-snug tracking-wide">~{formatNumber(personalKm)} ק&quot;מ</div>
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

export default function App() {
  const [isEbike, setIsEbike] = useState(false);
  const [productType, setProductType] = useState<'fork'|'shock'>('fork');
  const [brand, setBrand] = useState<string>('FOX');
  const [model, setModel] = useState<string>(MODELS['FOX'].fork[0]);
  const [style, setStyle] = useState<string>('Trail – טרייל');
  const [ridingLevel, setRidingLevel] = useState<string>('חובבן');
  const [bikeKg, setBikeKg] = useState<number>(15);
  const [riderKg, setRiderKg] = useState<number>(80);
  const [kmSince, setKmSince] = useState<number>(0);

  const modelOptions = useMemo(()=>{
    const m = MODELS[brand]; if(!m) return [];
    return productType==='fork'? m.fork : m.shock;
  },[brand, productType]);

  useEffect(()=>{
    if(!modelOptions.includes(model)) setModel(modelOptions[0] || '');
  },[brand, productType, modelOptions, model]);

  const result = useMemo(()=>{
    const baseByBrand = BASE_INTERVAL_KM[brand] ?? BASE_INTERVAL_KM.FOX;
    const policy: any = (MFG_POLICY as any)[brand]?.[productType] || {};
    const fullHours: number | undefined = policy.fullHours ?? (policy.fullHoursRange ? policy.fullHoursRange[0] : undefined);
    const avgKph = AVG_KPH_BY_STYLE[style] ?? 14;
    const baseKmFromHours = typeof fullHours === 'number' ? Math.round(fullHours * avgKph) : undefined;
    const legacyBaseKm = productType==='fork'? baseByBrand.fork : baseByBrand.shock;
    const baseKm = typeof baseKmFromHours === 'number' ? baseKmFromHours : legacyBaseKm;
    const styleFactor = STYLE_MULTIPLIER[style] ?? 1.0;
    const levelFactor = RIDER_LEVEL_MULTIPLIER[ridingLevel] ?? 1.0;
    const totalW = (Number(bikeKg) || 0) + (Number(riderKg) || 0);
    const refW = 95;
    const weightFactor = clamp(refW / max(totalW,1), 0.8, 1.2);
    const eBikeFactor = isEbike ? 0.85 : 1.0;
    const modelOffset = MODEL_OFFSETS_KM[model] ?? 0;
    const leniencyFactor = 1.1;
    const recommendedKmRaw = baseKm * styleFactor * levelFactor * weightFactor * eBikeFactor * leniencyFactor + modelOffset;
    const recommendedKm = Math.max(600, Math.round(recommendedKmRaw));
    let mfgHoursText = ''; let mfgTimeText = '';
    if(brand==='FOX'){ mfgHoursText='טיפול מלא: 125 שעות'; mfgTimeText='או שנה (המוקדם)'; }
    else if(brand==='ROCKSHOX'){ mfgHoursText = productType==='fork'? 'שימון רגליים תחתונות: 50 שעות · טיפול מלא: 100 שעות' : 'שירות אייר-קאן (קפיץ אוויר): 50 שעות · טיפול מלא: 100–200 שעות (לפי דגם)'; }
    else if(brand==='Öhlins'){ if(productType==='fork'){ mfgHoursText='ניקוי רגליים תחתונות: 50 שעות · טיפול מלא: 100 שעות'; mfgTimeText='או שנה'; } else { mfgHoursText='שירות קפיץ אוויר: 100 שעות · שירות דמפר: 100 שעות'; mfgTimeText='או שנה (לדמפר עד שנתיים)'; } }
    else if(brand==='PUSH'){ mfgTimeText='שנה (שירות מלא)'; }
    const kmLeft = Math.max(0, recommendedKm - (Number(kmSince)||0));
    const months = Math.max(1, Math.min(24, Math.round((recommendedKm/1000)*7)));
    const servicePrice = productType==='fork'? 550 : (SHOCK_PIGGYBACK[model] ? 650 : 550);
    return { baseKm, recommendedKm, kmLeft, months, mfgHoursText, mfgTimeText, servicePrice };
  },[productType, brand, model, style, ridingLevel, bikeKg, riderKg, kmSince, isEbike]);

  const typeHe = productType==='fork' ? 'מזלג' : 'בולם אחורי';
  const msg = `היי, אני מעוניין לקבוע טיפול לבולם מסוג ${brand} דגם ${model} (${typeHe}).\nמתי הולך להגיע?`;
  const waUrl = `https://wa.me/972522567888?text=${encodeURIComponent(msg)}`;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen w-full bg-[#0c0d0d] text-orange-500">
      <header className="sticky top-0 z-30 bg-[#0c0d0d]/80 backdrop-blur border-b border-orange-500/20">
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Assistant:wght@400;600;700;800&display=swap" rel="stylesheet" />
        <div className="mx-auto max-w-2xl px-4 py-4 flex items-center justify-between">
          <div />
          <div className="text-sm text-orange-300/80 hidden sm:block">SSC — ShocKIng Service Calculator</div>
        </div>
      </header>

      <section className="mx-auto max-w-2xl px-4 pt-8 pb-4 text-center">
        <motion.h1 className="mt-4 text-4xl sm:text-6xl font-extrabold text-white leading-tight tracking-wide drop-shadow-[0_0_18px_rgba(255,115,0,0.55)] font-[Assistant]" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
          מחשבון טיפולי בולמים
        </motion.h1>
        <motion.p className="mt-2 text-orange-300/90 leading-relaxed" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, delay: 0.1 }}>
          קבלו המלצה חכמה מתי לבצע טיפול תקופתי למזלג או לבולם האחורי, לפי היצרן, הדגם, סגנון הרכיבה והמשקל הכולל.
        </motion.p>
      </section>

      <main className="mx-auto max-w-5xl px-4 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:flex-row">
          <aside className="order-2 lg:order-1 lg:col-span-4 rounded-2xl border border-orange-500/30 bg-white/5 backdrop-blur-sm ring-1 ring-orange-500/15 p-4 sm:p-5 sticky top-24 h-max" dir="rtl">
            <h3 className="text-orange-300 font-bold text-lg mb-2">שאלות נפוצות</h3>
            <details className="mb-3"><summary className="cursor-pointer text-orange-200 font-semibold">הבולם כבר לא טופל מעל שנה והוא עדיין מרגיש טוב, לטפל?</summary><p className="text-orange-200/80 text-sm mt-1 leading-relaxed">כן. גם אם הבולם מרגיש תקין, השמנים והאטמים מתיישנים עם הזמן ומאבדים מהיעילות שלהם. מומלץ לבצע טיפול לפחות פעם בשנה כדי למנוע שחיקה יקרה ונזקים עתידיים.</p></details>
          </aside>

          <motion.div className="lg:col-span-8 rounded-2xl border border-orange-500/30 bg-white/5 backdrop-blur-md ring-1 ring-orange-500/15 p-4 sm:p-6" initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3 }}>
            <form className="grid grid-cols-1 lg:grid-cols-3 gap-4" dir="rtl">
              <div className="order-1 rounded-xl border border-orange-500/30 bg-white/5 ring-1 ring-orange-500/10 p-3 lg:p-4">
                <label className="block text-lg text-orange-300 mb-2 text-center font-bold">סוג מוצר</label>
                <div className="flex gap-2 justify-center">
                  <button type="button" onClick={() => setProductType('fork')} className={`px-5 py-3 rounded-2xl border-2 transition ${productType==='fork'?'border-orange-500 bg-orange-500/10 text-white':'border-orange-500/30 hover:border-orange-500/60'}`}>מזלג</button>
                  <button type="button" onClick={() => setProductType('shock')} className={`px-5 py-3 rounded-2xl border-2 transition ${productType==='shock'?'border-orange-500 bg-orange-500/10 text-white':'border-orange-500/30 hover:border-orange-500/60'}`}>בולם אחורי</button>
                </div>
              </div>
              <div className="order-2 rounded-xl border border-orange-500/30 bg-white/5 ring-1 ring-orange-500/10 p-3 lg:p-4">
                <label className="block text-lg text-orange-300 mb-2 text-center font-bold">יצרן</label>
                <select className="w-full bg-[#0c0d0d] text-white border border-orange-500/40 rounded-xl px-4 py-3 text-center text-lg font-bold" value={brand} onChange={e=>setBrand(e.target.value)}>
                  {Object.keys(BASE_INTERVAL_KM).map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className="order-3 rounded-xl border border-orange-500/30 bg-white/5 ring-1 ring-orange-500/10 p-3 lg:p-4">
                <label className="block text-lg text-orange-300 mb-2 text-center font-bold">דגם</label>
                <select className="w-full bg-[#0c0d0d] text-white border border-orange-500/40 rounded-xl px-4 py-3 text-center text-lg font-bold" value={model} onChange={e=>setModel(e.target.value)}>
                  {modelOptions.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="order-4 lg:col-span-3">
                <label className="block text-lg text-orange-300 mb-2 text-center font-bold">סגנון רכיבה</label>
                <select className="w-full bg-[#0c0d0d] text-white border border-orange-500/40 rounded-xl px-4 py-3 text-center text-lg font-bold" value={style} onChange={e=>setStyle(e.target.value)}>
                  {Object.keys(STYLE_MULTIPLIER).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="order-5 lg:col-span-3">
                <label className="block text-lg text-orange-300 mb-2 text-center font-bold">רמת רכיבה</label>
                <select className="w-full bg-[#0c0d0d] text-white border border-orange-500/40 rounded-xl px-4 py-3 text-center text-lg font-bold" value={ridingLevel} onChange={e=>setRidingLevel(e.target.value)}>
                  {Object.keys(RIDER_LEVEL_MULTIPLIER).map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="lg:col-span-3">
                <label className="block text-lg text-orange-300 mb-2 text-center font-bold">E-Bike?</label>
                <div className="flex items-center justify-center gap-3">
                  <button type="button" aria-pressed={isEbike} onClick={()=>setIsEbike(!isEbike)} className={`relative inline-flex h-8 w-16 rounded-full transition border border-orange-500/50 ${isEbike ? 'bg-orange-500' : 'bg-orange-500/20'}`}>
                    <span className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white transition-transform ${isEbike ? 'translate-x-8' : 'translate-x-0'}`} />
                    <span className="sr-only">E-Bike toggle</span>
                  </button>
                  <span className="text-orange-200 font-bold">{isEbike ? 'כן (E-Bike)' : 'לא'}</span>
                </div>
              </div>
              <div className="order-7 lg:col-span-3">
                <label className="block text-lg text-orange-300 mb-2 text-center font-bold">משקל אופניים (ק"ג)</label>
                <input type="number" min={8} max={35} step={0.1} value={bikeKg} onChange={e=>setBikeKg(Number(e.target.value))} className="w-full bg-[#0c0d0d] text-white border border-orange-500/40 rounded-xl px-4 py-3 text-center text-lg font-bold" placeholder="15" />
              </div>
              <div className="order-6 lg:col-span-3">
                <label className="block text-lg text-orange-300 mb-2 text-center font-bold">משקל רוכב (ק"ג)</label>
                <input type="number" min={35} max={140} step={0.5} value={riderKg} onChange={e=>setRiderKg(Number(e.target.value))} className="w-full bg-[#0c0d0d] text-white border border-orange-500/40 rounded-xl px-4 py-3 text-center text-lg font-bold" placeholder="80" />
              </div>
              <div className="order-8 lg:col-span-3">
                <label className="block text-lg text-orange-300 mb-2 text-center font-bold">ק"מ מאז הטיפול האחרון</label>
                <input type="number" min={0} step={1} value={kmSince} onChange={e=>{ const v=e.target.value; const n=v===''?0:Math.max(0,Math.floor(Number(v))); setKmSince(n) }} className="w-full bg-[#0c0d0d] text-white border border-orange-500/40 rounded-xl px-4 py-3 text-center text-lg font-bold" placeholder="0" />
              </div>
              <div className="order-9 lg:col-span-3 text-center">
                <ResultBox mfgHoursText={result.mfgHoursText} mfgTimeText={result.mfgTimeText} personalKm={result.recommendedKm} priceNis={result.servicePrice} />
                <a href={waUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block px-7 py-3 rounded-2xl border-2 border-orange-500/90 text-white text-lg font-bold font-[Assistant]">
                  קבע לי טיפול בולמים
                </a>
              </div>
            </form>
            <div className="mt-6 text-xs text-orange-300/70 leading-relaxed text-center">
              * המחשבון מספק הערכה כללית בלבד. השימוש בו על אחריות המשתמש. שוקינג אינה נושאת באחריות לכל נזק שייגרם עקב שימוש או הסתמכות על התוצאות.
            </div>
          </motion.div>
        </div>
      </main>

      <footer className="border-t border-orange-500/20">
        <div className="mx-auto max-w-2xl px-4 py-6 text-xs text-orange-300/70 flex items-center justify-between">
          <span>© {new Date().getFullYear()} ShocKing Suspension — SSC</span>
          <a className="underline hover:text-orange-300" href="#" onClick={(e)=>e.preventDefault()} title="צור קשר להזמנת טיפול">קביעת תור לטיפול</a>
        </div>
      </footer>
    </motion.div>
  );
}
