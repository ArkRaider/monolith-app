import Link from 'next/link';

export default function DashboardSelectionPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full opacity-15 pointer-events-none">
        <div className="absolute top-[10%] left-[20%] w-96 h-96 rounded-full filter blur-[120px] bg-sky-200/20" />
        <div className="absolute top-[40%] right-[10%] w-[500px] h-[500px] rounded-full filter blur-[150px] bg-neutral-300/10" />
      </div>

      <div className="z-10 text-center mb-16 space-y-4">
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none">Select Workspace</h1>
        <p className="text-sm text-neutral-400 font-mono tracking-widest uppercase">Choose your operating environment</p>
      </div>

      <div className="z-10 grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        <Link 
          href="/dashboard/traditional"
          className="group relative p-8 rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl hover:bg-black/60 transition-all duration-500 hover:border-white/30 hover:-translate-y-2"
        >
          <div className="space-y-4">
            <span className="text-[10px] font-mono tracking-widest text-sky-400 uppercase">Legacy Interface</span>
            <h2 className="text-3xl font-bold tracking-tight">Traditional Monolith</h2>
            <p className="text-sm text-neutral-400 font-mono">
              The standard 3-column layout. Features the persistent sidebar, full live activity panel, and dense data views.
            </p>
          </div>
        </Link>

        <Link 
          href="/dashboard/minimal"
          className="group relative p-8 rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl hover:bg-black/60 transition-all duration-500 hover:border-white/30 hover:-translate-y-2"
        >
          <div className="space-y-4">
            <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase">Focus Interface</span>
            <h2 className="text-3xl font-bold tracking-tight">Minimal Monolith</h2>
            <p className="text-sm text-neutral-400 font-mono">
              The spatial brutalist layout. Built for maximum immersion, zero distraction, and silent co-presence.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
