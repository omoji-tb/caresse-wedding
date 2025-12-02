import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  Camera,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Info,
  MapPin,
  Plane,
  Sparkles,
  Utensils,
  Waves,
  X,
} from "lucide-react";

type Lang = "en" | "fa";

type Card = { icon: React.ReactNode; title: string; text: string };

type Photo = {
  id: string;
  title: string;
  tag?: string;
  sources: string[];
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function svgPlaceholderDataUri(label: string) {
  const safe = label.replace(/&/g, "and").slice(0, 44);
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#F7F2E9"/>
      <stop offset="0.48" stop-color="#E7F4FF"/>
      <stop offset="1" stop-color="#E9FFF6"/>
    </linearGradient>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="table" tableValues="0 0.14"/></feComponentTransfer>
    </filter>
  </defs>
  <rect width="1600" height="900" fill="url(#g)"/>
  <rect width="1600" height="900" filter="url(#grain)" opacity="0.32"/>
  <circle cx="1240" cy="260" r="240" fill="#FFD9A8" opacity="0.72"/>
  <circle cx="1320" cy="230" r="170" fill="#FFC2D9" opacity="0.34"/>
  <path d="M0 640 C 280 580, 520 740, 820 670 C 1080 610, 1320 730, 1600 650 L1600 900 L0 900 Z" fill="#0EA5A4" opacity="0.13"/>
  <text x="80" y="120" font-family="ui-sans-serif, system-ui" font-size="44" fill="#0f172a" opacity="0.74">Caresse Bodrum</text>
  <text x="80" y="172" font-family="ui-sans-serif, system-ui" font-size="26" fill="#0f172a" opacity="0.55">${safe}</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function smartUrlSizing(url: string, wid: number) {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("cache.marriott.com")) return url;

    if (u.pathname.includes("/is/image/")) {
      u.searchParams.set("wid", String(wid));
      u.searchParams.set("fit", "constrain");
      return u.toString();
    }

    if (u.pathname.includes("/content/dam/marriott-renditions/")) {
      u.searchParams.set("downsize", `${wid}px:*`);
      u.searchParams.set("output-quality", "86");
      u.searchParams.set("interpolation", "progressive-bilinear");
      return u.toString();
    }

    return url;
  } catch {
    return url;
  }
}

function expandSources(primary: string) {
  const s = new Set<string>();
  const push = (u: string) => u && s.add(u);
  push(smartUrlSizing(primary, 2200));
  push(smartUrlSizing(primary, 1800));
  push(smartUrlSizing(primary, 1400));
  push(smartUrlSizing(primary, 1100));
  push(smartUrlSizing(primary, 900));
  push(primary);
  return Array.from(s);
}

function photoKeyFromUrl(url: string) {
  try {
    const u = new URL(url);
    const path = decodeURIComponent(u.pathname).toLowerCase();
    if (path.includes("/is/image/")) {
      const file = path.split("/is/image/")[1] ?? path;
      const tail = file.split("/").pop() ?? file;
      return tail.split(":")[0].split("?")[0];
    }
    if (path.includes("/content/dam/")) {
      const tail = path.split("/").pop() ?? path;
      return tail.split("?")[0];
    }
    return `${u.hostname}${path}`;
  } catch {
    return url.split("?")[0].toLowerCase();
  }
}

function SmartImage({
  sources,
  alt,
  className,
  priority,
}: {
  sources: string[];
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  const [i, setI] = useState(0);
  const src = i < sources.length ? sources[i] : svgPlaceholderDataUri(alt);

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setI((v) => (v + 1 <= sources.length ? v + 1 : v))}
      style={{ contentVisibility: "auto" as any }}
    />
  );
}

function InfoCard({ icon, title, text }: Card) {
  return (
    <div className="rounded-3xl border border-slate-900/10 bg-white/65 p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-teal-600 to-fuchsia-600 text-white shadow-sm">
          {icon}
        </div>
        <div>
          <div className="text-lg font-semibold">{title}</div>
          <div className="mt-1 text-sm text-slate-700">{text}</div>
        </div>
      </div>
    </div>
  );
}

function SectionShell({
  id,
  title,
  subtitle,
  rtl,
  children,
}: {
  id: string;
  title: string;
  subtitle?: string;
  rtl: boolean;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28">
      <div className={cx("flex items-end justify-between gap-4", rtl && "text-right")}>
        <div>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">{title}</h2>
          {subtitle ? <p className="mt-2 max-w-2xl text-slate-700">{subtitle}</p> : null}
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Lightbox({
  photos,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  photos: Photo[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const p = photos[index];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onPrev, onNext]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          className="relative w-full max-w-6xl overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-[0_40px_120px_rgba(0,0,0,0.6)]"
          initial={{ y: 16, scale: 0.99, opacity: 0 }}
          animate={{ y: 0, scale: 1, opacity: 1 }}
          exit={{ y: 10, scale: 0.995, opacity: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 26 }}
        >
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-white">{p.title}</div>
              {p.tag ? <div className="truncate text-xs text-white/70">{p.tag}</div> : null}
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-white/80 hover:bg-white/10 hover:text-white"
              aria-label="Close"
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="relative bg-slate-950">
            <SmartImage priority alt={p.title} sources={p.sources} className="h-[70vh] w-full object-contain bg-slate-950" />

            <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 items-center justify-between px-3">
              <button
                onClick={onPrev}
                className="rounded-2xl border border-white/15 bg-white/10 p-3 text-white/90 backdrop-blur hover:bg-white/15"
                aria-label="Previous"
                type="button"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={onNext}
                className="rounded-2xl border border-white/15 bg-white/10 p-3 text-white/90 backdrop-blur hover:bg-white/15"
                aria-label="Next"
                type="button"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="absolute bottom-3 left-3 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white/90 backdrop-blur">
              {index + 1} / {photos.length}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Nav({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  const links = [
    { id: "venue", label: lang === "fa" ? "کارِسه" : "Venue" },
    { id: "bodrum", label: lang === "fa" ? "چرا بدروم" : "Why Bodrum" },
    { id: "istanbul", label: lang === "fa" ? "استانبول" : "Istanbul" },
    { id: "weekend", label: lang === "fa" ? "برنامه" : "Weekend" },
    { id: "notes", label: lang === "fa" ? "نکته‌ها" : "Notes" },
    { id: "travel", label: lang === "fa" ? "سفر" : "Travel" },
    { id: "gallery", label: lang === "fa" ? "عکس‌ها" : "Photos" },
  ];

  const scrollToId = (id: string) => {
    if (typeof window === "undefined") return;

    if (id === "top") {
      window.history.replaceState(null, "", "#top");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const el = document.getElementById(id);
    if (!el) return;

    const nav = document.getElementById("site-nav");
    const offset = (nav?.getBoundingClientRect().height ?? 88) + 12;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;

    window.history.replaceState(null, "", `#${id}`);
    window.scrollTo({ top, behavior: "smooth" });
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50">
      <div className="pointer-events-auto mx-auto max-w-6xl px-4 sm:px-6">
        <div
          id="site-nav"
          className="mt-3 rounded-2xl border border-white/50 bg-white/45 p-2 shadow-[0_18px_60px_rgba(15,23,42,0.10)] backdrop-blur"
        >
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => scrollToId("top")}
              className="rounded-xl px-3 py-2 text-sm font-semibold tracking-tight text-slate-900 hover:bg-white/60"
            >
              {lang === "fa" ? "امید و آنیکا" : "Omid & Annika"}
            </button>

            <div className="hidden sm:flex items-center gap-1">
              {links.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => scrollToId(l.id)}
                  className="rounded-xl px-3 py-2 text-sm text-slate-800 hover:bg-white/60"
                >
                  {l.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setLang(lang === "en" ? "fa" : "en")}
              className="rounded-xl border border-slate-900/10 bg-white/70 px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm hover:bg-white"
              aria-label="Toggle language"
            >
              {lang === "en" ? "FA" : "EN"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CaresseInvite() {
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("wedding_lang");
      if (saved === "fa" || saved === "en") setLang(saved);
    } catch {
      void 0;
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("wedding_lang", lang);
    } catch {
      void 0;
    }
  }, [lang]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash?.replace("#", "");
    if (!hash || hash === "top") return;

    const el = document.getElementById(hash);
    if (!el) return;

    const nav = document.getElementById("site-nav");
    const offset = (nav?.getBoundingClientRect().height ?? 88) + 12;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;

    requestAnimationFrame(() => window.scrollTo({ top, behavior: "smooth" }));
  }, []);

  const rtl = lang === "fa";

  const details = useMemo(
    () => ({
      caresseUrl: "https://www.caresse.com.tr/en",
    }),
    []
  );

  const t = useMemo(() => {
    const en = {
      title: "An international Iranian wedding on the Aegean Sea",
      window: "May 31 – June 2, 2026",
      location: "Bodrum, Türkiye",
      copy:
        "Coasting along the sparkling Aegean Sea and emerging from the turquoise horizon of Bodrum, Omid and Annika invite you to join them and their beautiful tribe at Caresse Luxury Resort for their final wedding ceremony on June 1st, 2026. Accommodation at the resort will be provided May 31 – June 2 (nights of May 31 & June 1). Early check-in on May 31 and late checkout on June 2 are arranged.",
      caresseSite: "Visit the Caresse website",
      rsvp: "RSVP by December 31, 2025 — please let Omid or Annika know.",
      venueTitle: "The venue",
      venueSubtitle: "Private bay, beach decks, a gorgeous pool line, and that Bodrum light.",
      venueCards: [
        { icon: <Waves className="h-5 w-5" />, title: "Beach access", text: "Steps from rooms to sea, with decks and sunbeds right on the waterline." },
        { icon: <Utensils className="h-5 w-5" />, title: "Food + atmosphere", text: "Beach club energy by day, elevated dining and cocktails by night." },
        { icon: <Sparkles className="h-5 w-5" />, title: "That Caresse energy", text: "Clean lines, warm textures, and sunsets that keep everyone outside." },
      ] as Card[],
      bodrumTitle: "Why Bodrum",
      bodrumSubtitle: "A place that feels like a Mediterranean postcard—history, water, food, and late golden sunsets.",
      bodrumCards: [
        { icon: <Waves className="h-5 w-5" />, title: "Beaches + coves", text: "Clear water, hidden bays, and easy swim days." },
        { icon: <Camera className="h-5 w-5" />, title: "Old Town + marina", text: "Boutiques, cafés, and nighttime strolling in warm air." },
        { icon: <Info className="h-5 w-5" />, title: "History nearby", text: "Castle of St. Peter and day trips with a real wow factor." },
      ] as Card[],
      istanbulTitle: "Add a few days in Istanbul",
      istanbulSubtitle:
        "If you can, tack on 2–4 days. It’s one of the world’s most magnetic cities—Bosphorus views, street food, historic neighborhoods, and a café culture that never runs out of energy.",
      istanbulCards: [
        { icon: <Sparkles className="h-5 w-5" />, title: "Two continents, one skyline", text: "Ferries across the Bosphorus and neighborhoods that change vibe block to block." },
        { icon: <Utensils className="h-5 w-5" />, title: "Food worth the detour", text: "Meze, bakeries, coffee, and late-night bites—cheap thrills and elevated dining." },
        { icon: <Camera className="h-5 w-5" />, title: "History you can touch", text: "Markets, mosques, palaces, and alleyways—ancient layers wrapped around modern city life." },
      ] as Card[],
      weekendTitle: "The weekend",
      weekendSubtitle: "Two nights at the resort (May 31 & June 1), with early check-in on May 31 and late checkout on June 2.",
      weekend: [
        { day: "May 31", title: "Early check-in + welcome", text: "Arrive, exhale, swim, sunset. We’ll share the plan for the evening once it’s finalized." },
        {
          day: "June 1",
          title: "Wedding day + after-party",
          text: "Golden hour ceremony, dinner by the sea, and a late night. We’ll share the finalized agenda closer to the date.",
        },
        { day: "June 2", title: "Late checkout + farewells", text: "Slow morning, coffee, beach time, hugs—then departures." },
      ],
      notesTitle: "Notes",
      notesSubtitle: "Two small (but important) things for the wedding day.",
      notesCards: [
        { icon: <Sparkles className="h-5 w-5" />, title: "Dress code: Formal", text: "For the wedding itself, formal attire—dress to impress." },
        { icon: <Info className="h-5 w-5" />, title: "No gifts", text: "Please no gifts. The trip and your presence is the gift." },
        { icon: <Utensils className="h-5 w-5" />, title: "Come hungry", text: "We are planning an incredible dinner and cocktails—more details soon." },
      ] as Card[],
      travelTitle: "Travel",
      travelSubtitle: "Most guests will fly into Milas–Bodrum Airport (BJV). Some routes connect via Istanbul (IST).",
      travelCards: [
        {
          icon: <Plane className="h-5 w-5" />,
          title: "Airport",
          text: "BJV is the closest. Plan for about a 45-minute to 1-hour drive to the resort.",
        },
        {
          icon: <MapPin className="h-5 w-5" />,
          title: "Getting around",
          text: "Private transfers / taxis are easiest. Renting a car is also a great option for flexibility. We’ll share logistics closer to date.",
        },
        { icon: <Info className="h-5 w-5" />, title: "Timezone", text: "Türkiye Time (TRT, UTC+3)." },
      ] as Card[],
      galleryTitle: "Caresse photo gallery",
      gallerySubtitle: "Tap any photo for full-screen.",
      loadMore: "Load more photos",
      footer: "We can’t wait to celebrate with you.",
      footer2: "This page will keep evolving as the timeline locks in.",
    };

    const fa = {
      title: "یک جشن ایرانی-بین‌المللی کنار دریای اژه",
      window: "۱۰ تا ۱۲ خرداد ۱۴۰۵",
      location: "بدروم، ترکیه",
      copy:
        "در کنار آب‌های فیروزه‌ای اژه و زیر آفتاب بدروم، امید و آنیکا شما را دعوت می‌کنند تا در ریزورت Caresse کنارشان باشید و مراسم اصلی عروسی‌شان را در ۱۱ خرداد ۱۴۰۵ جشن بگیریم. اقامت در ریزورت از ۱۰ تا ۱۲ خرداد فراهم است (شب‌های ۱۰ و ۱۱ خرداد). ورود زودتر در ۱۰ خرداد و خروج دیرتر در ۱۲ خرداد هماهنگ شده است.",
      caresseSite: "وب‌سایت Caresse",
      rsvp: "لطفاً حداکثر تا ۱۰ دی ۱۴۰۴ حضور خود را با پیام به امید یا آنیکا تأیید کنید.",
      venueTitle: "رزورت کارِسه",
      venueSubtitle: "خلیج دنج، دک‌های ساحلی و نورِ خاصِ بدروم.",
      venueCards: [
        { icon: <Waves className="h-5 w-5" />, title: "دسترسی به ساحل", text: "چند قدم تا دریا؛ دک‌ها و تخت‌های ساحلی دقیقاً کنار آب." },
        { icon: <Utensils className="h-5 w-5" />, title: "غذا و فضا", text: "روزها حال‌وهوای بیچ‌کلاب، شب‌ها شام و کوکتل‌های عالی." },
        { icon: <Sparkles className="h-5 w-5" />, title: "حس‌وحالِ کارِسه", text: "طراحی مینیمال با بافت‌های گرم و غروب‌های تماشایی." },
      ] as Card[],
      bodrumTitle: "چرا بدروم؟",
      bodrumSubtitle: "ترکیبی از دریا، غذا، تاریخ و حال‌وهوای مدیترانه‌ای.",
      bodrumCards: [
        { icon: <Waves className="h-5 w-5" />, title: "ساحل و خلیج‌ها", text: "آب شفاف، خلیج‌های دنج و روزهای بی‌دغدغه برای شنا." },
        { icon: <Camera className="h-5 w-5" />, title: "شهر قدیمی و مارینا", text: "بوتیک‌ها، کافه‌ها و قدم‌زدن شبانه در هوای گرم." },
        { icon: <Info className="h-5 w-5" />, title: "تاریخ نزدیک", text: "قلعه سنت‌پیتر و جاهای دیدنی برای یک گشت کوتاه." },
      ] as Card[],
      istanbulTitle: "چند روزی هم استانبول بمانید",
      istanbulSubtitle:
        "اگر برنامه‌تان اجازه می‌دهد، ۲ تا ۴ روز هم به استانبول اختصاص بدهید. منظره‌های بسفر، فرهنگ کافه‌نشینی، غذاهای خیابانی و محله‌های تاریخی واقعاً ارزشش را دارد.",
      istanbulCards: [
        { icon: <Sparkles className="h-5 w-5" />, title: "دو قاره، یک افق", text: "فِری روی بسفر و محله‌هایی با حال‌وهوای متفاوت." },
        { icon: <Utensils className="h-5 w-5" />, title: "غذاهایی که ارزش سفر دارند", text: "مزه، نان و شیرینی، قهوه و خوراکی‌های نیمه‌شب." },
        { icon: <Camera className="h-5 w-5" />, title: "تاریخِ زنده", text: "بازارها، مسجدها و کاخ‌ها—گذشته و حال کنار هم." },
      ] as Card[],
      weekendTitle: "برنامه کلی",
      weekendSubtitle: "اقامت دو شب (۱۰ و ۱۱ خرداد) با ورود زودتر در ۱۰ خرداد و خروج دیرتر در ۱۲ خرداد.",
      weekend: [
        { day: "۱۰ خرداد", title: "ورود + خوش‌آمد", text: "رسیدن، استقرار، شنا و غروب. برنامه شب را بعد از نهایی‌شدن اعلام می‌کنیم." },
        {
          day: "۱۱ خرداد",
          title: "روز عروسی + افترپارتی",
          text: "مراسم حوالی غروب، شام کنار دریا و جشن شبانه. برنامه نهایی را نزدیک‌تر ارسال می‌کنیم.",
        },
        { day: "۱۲ خرداد", title: "خروج دیرتر + خداحافظی", text: "صبح آرام، قهوه، یک شنا و خداحافظی‌ها—بعد حرکت." },
      ],
      notesTitle: "نکته‌ها",
      notesSubtitle: "دو مورد کوچک (اما مهم) برای روز عروسی.",
      notesCards: [
        { icon: <Sparkles className="h-5 w-5" />, title: "پوشش: رسمی", text: "برای خودِ مراسم عروسی، پوشش رسمی—شیک و آراسته." },
        { icon: <Info className="h-5 w-5" />, title: "بدون هدیه", text: "لطفاً هیچ هدیه‌ای تهیه نکنید. حضور شما بزرگ‌ترین هدیه است." },
        { icon: <Utensils className="h-5 w-5" />, title: "با اشتها بیایید", text: "برای شام و کوکتل‌ها برنامه ویژه داریم—جزئیات بعداً." },
      ] as Card[],
      travelTitle: "سفر",
      travelSubtitle: "بیشتر مهمان‌ها به فرودگاه میلاس–بدروم (BJV) پرواز می‌کنند؛ بعضی مسیرها با اتصال از استانبول (IST) است.",
      travelCards: [
        { icon: <Plane className="h-5 w-5" />, title: "فرودگاه", text: "نزدیک‌ترین فرودگاه BJV است؛ مسیر زمینی حدود ۴۵ دقیقه تا ۱ ساعت." },
        {
          icon: <MapPin className="h-5 w-5" />,
          title: "رفت‌وآمد",
          text: "ترنسفر خصوصی/تاکسی راحت‌ترین گزینه است؛ اجاره خودرو هم برای انعطاف بیشتر گزینهٔ خوبی است. جزئیات را نزدیک‌تر ارسال می‌کنیم.",
        },
        { icon: <Info className="h-5 w-5" />, title: "ساعت", text: "ساعت ترکیه (TRT، UTC+3)." },
      ] as Card[],
      galleryTitle: "گالری عکس‌های Caresse",
      gallerySubtitle: "برای نمایش تمام‌صفحه روی هر عکس بزنید.",
      loadMore: "نمایش عکس‌های بیشتر",
      footer: "بی‌صبرانه منتظر جشن گرفتن با شما هستیم.",
      footer2: "جزئیات بیشتر را با نزدیک شدن به تاریخ اضافه می‌کنیم.",
    };

    return lang === "fa" ? fa : en;
  }, [lang]);

  const raw = useMemo(
    () =>
      [
        {
          id: "drone-bay-1",
          title: "The private bay: Caresse from above",
          tag: "Aerial • Bay",
          primary: "https://cache.marriott.com/is/image/marriotts7prod/lc-bjvlc-drone-view-23060%3AWide-Hor",
        },
        {
          id: "drone-resort-2",
          title: "Aegean shoreline panorama",
          tag: "Aerial • Panorama",
          primary: "https://cache.marriott.com/is/image/marriotts7prod/lc-bjvlc-drone-view-37065%3AWide-Hor",
        },
        {
          id: "hotel-exterior",
          title: "Resort exterior",
          tag: "Resort",
          primary: "https://cache.marriott.com/is/image/marriotts7prod/lc-bjvlc-hotel-exterior-11389%3AWide-Hor",
        },
        {
          id: "beach-hero",
          title: "Turquoise beach day",
          tag: "Beach",
          primary: "https://cache.marriott.com/content/dam/marriott-renditions/BJVLC/bjvlc-caresse-beach-6997-hor-wide.jpg",
        },
        {
          id: "private-beach",
          title: "Private beach & teak decks",
          tag: "Beach • Deck",
          primary: "https://cache.marriott.com/content/dam/marriott-renditions/BJVLC/bjvlc-private-beach-9546-hor-wide.jpg",
        },
        {
          id: "cabanas",
          title: "Cabanas & daybeds",
          tag: "Beach • Cabanas",
          primary: "https://cache.marriott.com/content/dam/marriott-renditions/BJVLC/bjvlc-cabanas-9527-hor-wide.jpg",
        },
        {
          id: "pool-main",
          title: "Infinity pool above the shoreline",
          tag: "Pool",
          primary: "https://cache.marriott.com/content/dam/marriott-renditions/BJVLC/bjvlc-pool-9526-hor-wide.jpg",
        },
        {
          id: "sunset-lounge",
          title: "Sunset Lounge",
          tag: "Sunset",
          primary: "https://cache.marriott.com/content/dam/marriott-renditions/BJVLC/bjvlc-sunset-lounge-9529-hor-wide.jpg",
        },
        {
          id: "glass-restaurant",
          title: "Glass Restaurant terrace",
          tag: "Dining",
          primary: "https://cache.marriott.com/content/dam/marriott-renditions/BJVLC/bjvlc-glass-restaurant-9570-hor-wide.jpg",
        },
        {
          id: "buddha-bar",
          title: "Buddha-Bar Beach Bodrum",
          tag: "Beach Club",
          primary: "https://cache.marriott.com/content/dam/marriott-renditions/BJVLC/bjvlc-buddha-restaurant-1797-hor-wide.jpg",
        },
        {
          id: "spa",
          title: "Spa Caresse",
          tag: "Wellness",
          primary: "https://cache.marriott.com/content/dam/marriott-renditions/BJVLC/bjvlc-spa-caresse-9616-hor-wide.jpg",
        },
        {
          id: "indoor-pool",
          title: "Indoor pool",
          tag: "Wellness",
          primary: "https://cache.marriott.com/is/image/marriotts7prod/bjvlc-indoor-pool-9613%3AWide-Hor",
        },
      ] as const,
    []
  );

  const photos: Photo[] = useMemo(() => {
    const built = raw.map((r) => ({
      id: r.id,
      title: r.title,
      tag: r.tag,
      sources: expandSources(r.primary),
    }));

    const seen = new Set<string>();
    const out: Photo[] = [];
    for (const p of built) {
      const key = photoKeyFromUrl(p.sources[0] ?? p.id);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(p);
    }
    return out;
  }, [raw]);

  const [visibleCount, setVisibleCount] = useState(12);
  const visiblePhotos = useMemo(() => photos.slice(0, Math.min(visibleCount, photos.length)), [photos, visibleCount]);

  const hero = visiblePhotos[0];
  const heroB = visiblePhotos[6] ?? visiblePhotos[1];

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const close = () => setLightboxIndex(null);
  const prev = () =>
    setLightboxIndex((i) => (i === null ? null : (i - 1 + visiblePhotos.length) % visiblePhotos.length));
  const next = () =>
    setLightboxIndex((i) => (i === null ? null : (i + 1) % visiblePhotos.length));

  return (
    <div
      id="top"
      dir={rtl ? "rtl" : "ltr"}
      className={cx(
        "min-h-screen bg-[#f7f2e9] text-slate-900",
        rtl &&
          "[font-family:ui-sans-serif,system-ui,'Segoe UI',Tahoma,Arial,'Noto Naskh Arabic','Vazirmatn','IRANSans',sans-serif]"
      )}
    >
      <Nav lang={lang} setLang={setLang} />

      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(900px 560px at 12% 20%, rgba(255,220,160,0.65), transparent 62%), radial-gradient(850px 560px at 82% 14%, rgba(167,243,208,0.55), transparent 62%), radial-gradient(1100px 760px at 55% -8%, rgba(186,230,253,0.70), transparent 72%), linear-gradient(180deg, #f7f2e9 0%, #f0f7fb 40%, #eef9f7 100%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.10]"
          style={{
            backgroundImage: "radial-gradient(rgba(15,23,42,0.08) 1px, transparent 1px)",
            backgroundSize: "16px 16px",
          }}
        />

        <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-28 sm:px-6 sm:pb-14 sm:pt-32">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-end">
            <div className={cx("lg:col-span-6", rtl && "text-right")}>
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-4xl font-semibold tracking-tight sm:text-5xl"
              >
                {t.title}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.06 }}
                className="mt-4 max-w-xl text-base leading-relaxed text-slate-700 sm:text-lg"
              >
                {t.copy}
              </motion.p>

              <div className={cx("mt-6 flex flex-wrap gap-2", rtl && "justify-end")}>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/45 px-3 py-1 text-sm text-slate-900 shadow-[0_8px_30px_rgba(15,23,42,0.08)] backdrop-blur">
                  <CalendarDays className="h-4 w-4 opacity-80" />
                  <span className="font-medium">{t.window}</span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/45 px-3 py-1 text-sm text-slate-900 shadow-[0_8px_30px_rgba(15,23,42,0.08)] backdrop-blur">
                  <MapPin className="h-4 w-4 opacity-80" />
                  <span className="font-medium">{t.location}</span>
                </div>
              </div>

              <div className={cx("mt-7 flex flex-wrap gap-3", rtl && "justify-end")}>
                <a
                  href={details.caresseUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-slate-800"
                >
                  {t.caresseSite} <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </div>

              <div
                className={cx(
                  "mt-3 inline-flex max-w-xl items-start gap-2 rounded-2xl border border-fuchsia-200/60 bg-white/55 px-4 py-3 text-sm font-semibold shadow-sm",
                  rtl ? "justify-end text-right" : "text-left"
                )}
              >
                <Sparkles className="mt-0.5 h-4 w-4 text-fuchsia-600" />
                <span className="bg-gradient-to-r from-fuchsia-600 to-teal-600 bg-clip-text text-transparent">
                  {t.rsvp}
                </span>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="grid grid-cols-12 gap-3">
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.08 }}
                  className="col-span-12 overflow-hidden rounded-3xl border border-white/55 bg-white/35 shadow-[0_26px_80px_rgba(15,23,42,0.14)] sm:col-span-7"
                >
                  <SmartImage
                    priority
                    alt={hero?.title ?? "Caresse Bodrum"}
                    sources={hero?.sources ?? [svgPlaceholderDataUri("Caresse")]} 
                    className="h-[320px] w-full object-cover sm:h-[440px]"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.14 }}
                  className="col-span-12 overflow-hidden rounded-3xl border border-white/55 bg-white/35 shadow-[0_26px_80px_rgba(15,23,42,0.14)] sm:col-span-5"
                >
                  <SmartImage
                    priority
                    alt={heroB?.title ?? "Caresse Bodrum"}
                    sources={heroB?.sources ?? [svgPlaceholderDataUri("Caresse")]} 
                    className="h-[240px] w-full object-cover sm:h-[440px]"
                  />
                </motion.div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                {visiblePhotos.slice(2, 5).map((p, i) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setLightboxIndex(i + 2)}
                    className="group overflow-hidden rounded-2xl border border-white/55 bg-white/30 shadow-sm"
                    aria-label={`Open photo: ${p.title}`}
                  >
                    <SmartImage
                      alt={p.title}
                      sources={p.sources}
                      className="h-24 w-full object-cover transition duration-300 group-hover:scale-[1.03] sm:h-28"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-slate-900/10 to-transparent" />
      </div>

      <div className="mx-auto max-w-6xl space-y-12 px-4 py-10 sm:px-6 sm:py-12">
        <SectionShell id="venue" title={t.venueTitle} subtitle={t.venueSubtitle} rtl={rtl}>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {t.venueCards.map((c, idx) => (
              <InfoCard key={idx} icon={c.icon} title={c.title} text={c.text} />
            ))}
          </div>
        </SectionShell>

        <SectionShell id="bodrum" title={t.bodrumTitle} subtitle={t.bodrumSubtitle} rtl={rtl}>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {t.bodrumCards.map((c, idx) => (
              <InfoCard key={idx} icon={c.icon} title={c.title} text={c.text} />
            ))}
          </div>
        </SectionShell>

        <SectionShell id="istanbul" title={t.istanbulTitle} subtitle={t.istanbulSubtitle} rtl={rtl}>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {t.istanbulCards.map((c, idx) => (
              <InfoCard key={idx} icon={c.icon} title={c.title} text={c.text} />
            ))}
          </div>
        </SectionShell>

        <SectionShell id="weekend" title={t.weekendTitle} subtitle={t.weekendSubtitle} rtl={rtl}>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {t.weekend.map((c) => (
              <div
                key={c.day}
                className={cx("rounded-3xl border border-slate-900/10 bg-white/65 p-5 shadow-sm", rtl && "text-right")}
              >
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{c.day}</div>
                <div className="mt-1 text-lg font-semibold">{c.title}</div>
                <div className="mt-2 text-sm text-slate-700">{c.text}</div>
              </div>
            ))}
          </div>
        </SectionShell>

        <SectionShell id="notes" title={t.notesTitle} subtitle={t.notesSubtitle} rtl={rtl}>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {t.notesCards.map((c, idx) => (
              <InfoCard key={idx} icon={c.icon} title={c.title} text={c.text} />
            ))}
          </div>
        </SectionShell>

        <SectionShell id="travel" title={t.travelTitle} subtitle={t.travelSubtitle} rtl={rtl}>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {t.travelCards.map((c, idx) => (
              <InfoCard key={idx} icon={c.icon} title={c.title} text={c.text} />
            ))}
          </div>
        </SectionShell>

        <SectionShell id="gallery" title={t.galleryTitle} subtitle={t.gallerySubtitle} rtl={rtl}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {visiblePhotos.map((p, i) => {
              const big = i % 10 === 0 || i % 10 === 6;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setLightboxIndex(i)}
                  className={cx(
                    "group relative overflow-hidden rounded-3xl border border-white/60 bg-white/30 shadow-sm",
                    big && "col-span-2 row-span-2"
                  )}
                  aria-label={`Open photo: ${p.title}`}
                >
                  <SmartImage
                    alt={p.title}
                    sources={p.sources}
                    className={cx(
                      "w-full object-cover transition duration-300 group-hover:scale-[1.03]",
                      big ? "h-[260px] sm:h-[380px]" : "h-[160px] sm:h-[210px]"
                    )}
                  />
                  <div className="pointer-events-none absolute inset-0">
                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/50 to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
                    <div className="absolute bottom-2 left-2 right-2 translate-y-2 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                      <div className="line-clamp-2 text-left text-xs font-semibold text-white">{p.title}</div>
                      {p.tag ? <div className="mt-1 text-left text-[11px] text-white/75">{p.tag}</div> : null}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {visibleCount < photos.length ? (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleCount((v) => Math.min(v + 12, photos.length))}
                className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-slate-800"
              >
                {t.loadMore}
              </button>
            </div>
          ) : null}
        </SectionShell>

        <div className={cx("rounded-3xl border border-slate-900/10 bg-white/60 p-6 text-center shadow-sm", rtl && "text-right")}>
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-teal-600 to-fuchsia-600 px-3 py-1 text-xs font-semibold text-white">
            <Sparkles className="h-4 w-4" />
            Bodrum • Aegean Sea • 2026
          </div>
          <div className="mt-3 text-xl font-semibold">{t.footer}</div>
          <div className="mt-1 text-sm text-slate-700">{t.footer2}</div>
        </div>
      </div>

      {lightboxIndex !== null ? (
        <Lightbox photos={visiblePhotos} index={lightboxIndex} onClose={close} onPrev={prev} onNext={next} />
      ) : null}
    </div>
  );
}
