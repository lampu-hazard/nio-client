import { DashboardNav } from '@/components/dashboard/DashboardNav';

export default async function SettingsPage({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-4xl font-black">Settings</h1>
          <p className="mt-1 text-slate-400">Configure bot options and channel logging.</p>
        </div>

        <DashboardNav guildId={guildId} activeTab="settings" />

        <div className="card p-8 text-slate-400">
          Guild settings will be added here.
        </div>
      </div>
    </main>
  );
}
