import { Sidebar } from '@/components/Sidebar';
import { LiveActivityPanel } from '@/components/LiveActivityPanel';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        {children}
      </main>
      <LiveActivityPanel />
    </div>
  );
}
