import { Sidebar } from '@/components/Sidebar';
import { LiveActivityPanel } from '@/components/LiveActivityPanel';

/**
 * Dashboard layout — 3-column structure:
 *   [Sidebar 260px fixed] | [main content flex-1] | [LiveActivityPanel 300px fixed]
 *
 * InboxWidget is intentionally NOT here.
 * It lives in src/app/layout.tsx (root level) via InboxProvider so it
 * persists across ALL routes including /room/[slug]/studio.
 * The floating button is suppressed inside rooms — only the panel overlay
 * is shown there via the studio control bar trigger.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Left sidebar — navigation, activity calendar, objectives */}
      <Sidebar />

      {/* Center — page content fills remaining space */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-8 min-w-0">
        {children}
      </main>

      {/* Right panel — live user activity feed */}
      <LiveActivityPanel />
    </div>
  );
}