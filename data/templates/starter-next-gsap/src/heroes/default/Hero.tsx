type HeroConfig = {
  heroId: string;
  title: string;
  headline: string;
  subheadline: string;
  ctaText: string;
  theme: {
    primaryColor: string;
  };
};

export default function Hero({ config }: { config: HeroConfig }) {
  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-white/10 px-8 py-16"
      style={{
        backgroundImage: `linear-gradient(120deg, ${config.theme.primaryColor}33, #0b1220 55%, #05070c)`,
      }}
    >
      <div className="absolute -top-14 -left-12 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="relative max-w-3xl space-y-5">
        <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/80">{config.title}</p>
        <h2 className="text-4xl font-black leading-tight text-white md:text-6xl">{config.headline}</h2>
        <p className="max-w-2xl text-base text-slate-200 md:text-lg">{config.subheadline}</p>
        <button
          className="rounded-full px-6 py-3 text-sm font-semibold text-slate-950"
          style={{ backgroundColor: config.theme.primaryColor }}
        >
          {config.ctaText}
        </button>
      </div>
    </section>
  );
}
