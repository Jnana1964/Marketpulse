import { Link } from 'react-router-dom';
import { Activity, Search, TrendingUp, FileText, Zap, BarChart3, Radar, MessageSquareText } from 'lucide-react';

const FEATURES = [
  { icon: Search, title: 'Spot Meaningful Moves', description: 'Filter out the noise and focus on what matters.' },
  { icon: FileText, title: 'Understand the Why', description: 'Get clear, simple explanations behind market movements.' },
  { icon: Zap, title: 'Make Informed Decisions', description: 'Turn insights into confidence in your next move.' },
  { icon: BarChart3, title: 'Stay Ahead', description: 'Be aware of what’s changing in the market, in real time.' },
];

const STEPS = [
  { icon: Radar, title: 'Monitor', description: 'Your watchlist is checked against fresh market data, continuously and quietly.' },
  { icon: Search, title: 'Detect', description: "Each move is measured against that stock's own typical behavior, not a generic threshold." },
  { icon: MessageSquareText, title: 'Understand', description: 'You get a plain-language reason, not just a number — so you know why it matters.' },
];

export function Landing() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--color-bg)] text-white">
      <header className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-10">
        <div className="flex items-center gap-2.5">
          <Activity size={26} strokeWidth={2.5} className="text-[var(--color-brand)]" />
          <span className="text-2xl font-bold tracking-tight">
            Market<span className="text-[var(--color-brand)]">Pulse</span>
          </span>
        </div>
        <nav className="hidden items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] p-1.5 text-base font-medium md:flex">
          <a href="#home" className="rounded-full bg-white/10 px-5 py-2 text-white">Home</a>
          <a href="#features" className="rounded-full px-5 py-2 text-[var(--color-text-secondary)] hover:text-white">Features</a>
          <a href="#how-it-works" className="rounded-full px-5 py-2 text-[var(--color-text-secondary)] hover:text-white">How It Works</a>
          <a href="#about" className="rounded-full px-5 py-2 text-[var(--color-text-secondary)] hover:text-white">About</a>
        </nav>
        <div className="flex items-center gap-3">
          <button aria-label="Search" className="hidden rounded-full p-2.5 text-[var(--color-text-secondary)] hover:bg-white/5 hover:text-white sm:block">
            <Search size={22} />
          </button>
          <Link to="/login" className="rounded-full border border-[var(--color-border)] px-5 py-2.5 text-base font-medium text-white transition hover:bg-white/5">
            Sign In
          </Link>
          <Link to="/signup" className="flex items-center gap-1.5 rounded-full bg-[var(--color-brand)] px-5 py-2.5 text-base font-semibold text-[#071011] transition hover:bg-[var(--color-brand-hover)]">
            Get Started →
          </Link>
        </div>
      </header>

      <main id="home" className="relative mx-auto max-w-7xl px-6 pb-20 pt-10 text-center lg:px-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-brand-glow" />

        <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-accent)] bg-[var(--color-brand-soft)] px-5 py-2 text-sm font-semibold text-[var(--color-brand)]">
          <span className="h-2 w-2 rounded-full bg-[var(--color-brand)]" /> Smarter insights. Clearer decisions.
        </span>

        <h1 className="mt-7 text-6xl font-extrabold tracking-tight sm:text-7xl xl:text-8xl">
          Market<span className="text-[var(--color-brand)]">Pulse</span>
        </h1>

        <p className="mt-3 text-3xl font-semibold text-white sm:text-4xl">See what changed, not just what moved.</p>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-[var(--color-text-secondary)]">
          MarketPulse identifies meaningful market movements and explains why they deserve your attention.
        </p>

        <div className="mt-9 flex items-center justify-center gap-4">
          <Link to="/signup" className="flex items-center gap-2 rounded-full bg-[var(--color-brand)] px-8 py-4 text-base font-bold text-[#071011] transition hover:bg-[var(--color-brand-hover)]">
            Get Started →
          </Link>
          <Link to="/login" className="rounded-full border border-[var(--color-border)] px-8 py-4 text-base font-semibold text-white transition hover:bg-white/5">
            Sign In
          </Link>
        </div>

        <div className="relative mt-14 overflow-hidden rounded-2xl border border-[var(--color-border)]">
          <img
            src="/bull-bear-hero.png"
            alt="Bull and bear market illustration"
            className="h-[420px] w-full object-cover sm:h-[520px] xl:h-[640px]"
          />
          <p className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
            Market intelligence
            <br />
            for a better tomorrow
          </p>
        </div>
      </main>

      <section id="features" className="mx-auto max-w-7xl px-6 py-4 lg:px-10">
        <div className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-7">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 flex-none items-center justify-center rounded-full bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
              <Activity size={26} />
            </span>
            <div>
              <p className="text-lg font-semibold text-white">What is MarketPulse?</p>
              <p className="text-base text-[var(--color-text-secondary)]">MarketPulse makes market movements understandable, highlighting the changes that truly matter.</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-5 lg:grid-cols-4 lg:gap-6">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-7">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
                <Icon size={26} />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-white">{title}</h3>
              <p className="mt-2 text-base text-[var(--color-text-secondary)]">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
        <p className="text-center text-sm font-semibold uppercase tracking-widest text-[var(--color-brand)]">How It Works</p>
        <h2 className="mt-3 text-center text-4xl font-extrabold text-white sm:text-5xl">Three steps to a clearer watchlist</h2>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3 lg:gap-6">
          {STEPS.map(({ icon: Icon, title, description }, i) => (
            <div key={title} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-7">
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-base font-bold text-[var(--color-text-muted)]">
                  {i + 1}
                </span>
                <Icon size={26} className="text-[var(--color-brand)]" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-white">{title}</h3>
              <p className="mt-2 text-base text-[var(--color-text-secondary)]">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="about" className="mx-auto max-w-5xl px-6 pb-20 lg:px-10">
        <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border-accent)] bg-[var(--color-card-alt)] bg-brand-glow px-8 py-16 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
            Better Insights · Brighter Tomorrow
          </p>
          <h2 className="mt-4 text-4xl font-extrabold text-white sm:text-5xl">
            Know where to look. <span className="text-[var(--color-brand)]">Know why it matters.</span>
          </h2>
          <Link
            to="/signup"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--color-brand)] px-8 py-4 text-base font-bold text-[#071011] transition hover:bg-[var(--color-brand-hover)]"
          >
            Get Started →
          </Link>
        </div>
      </section>

      <footer className="border-t border-[var(--color-border)] px-6 py-10 text-center text-sm text-[var(--color-text-muted)]">
        <div className="flex items-center justify-center gap-2.5 pb-3 text-lg font-semibold text-white">
          <TrendingUp size={20} className="text-[var(--color-brand)]" /> MarketPulse
        </div>
        Market information is provided for informational purposes only and does not constitute investment advice.
      </footer>
    </div>
  );
}
