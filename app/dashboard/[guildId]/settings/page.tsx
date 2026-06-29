'use client';

import React, { useEffect, useState, use } from 'react';
import { api } from '@/lib/api';
import { DashboardNav } from '@/components/dashboard/DashboardNav';

type ChannelOption = { id: string; name: string };

type Settings = {
  logChannelId: string | null;
  stickerEnabled: boolean;
  slowmodeEnabled: boolean;
  slowmodeChannels: string[];
  slowmodeIntervalQuiet: number;
  slowmodeIntervalBusy: number;
};

type PageProps = {
  params: Promise<{ guildId: string }>;
};

export default function SettingsPage({ params }: PageProps) {
  const { guildId } = use(params);

  const [settings, setSettings] = useState<Settings>({
    logChannelId: null,
    stickerEnabled: false,
    slowmodeEnabled: false,
    slowmodeChannels: [],
    slowmodeIntervalQuiet: 5,
    slowmodeIntervalBusy: 10,
  });
  const [channels, setChannels] = useState<ChannelOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, [guildId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [settingsRes, channelsRes] = await Promise.all([
        api<{ ok: boolean; settings: Settings }>(`/guilds/${guildId}/settings`),
        api<{ ok: boolean; channels: ChannelOption[] }>(`/guilds/${guildId}/channels`),
      ]);
      setSettings(settingsRes.settings);
      setChannels(channelsRes.channels || []);
      setError('');
    } catch (err: any) {
      setError(err?.message || 'Failed to load settings data');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSticker = () => {
    setSettings((prev) => ({
      ...prev,
      stickerEnabled: !prev.stickerEnabled,
    }));
  };

  const handleToggleSlowmode = () => {
    setSettings((prev) => ({
      ...prev,
      slowmodeEnabled: !prev.slowmodeEnabled,
    }));
  };

  const handleChannelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSettings((prev) => ({
      ...prev,
      logChannelId: val === 'none' ? null : val,
    }));
  };

  const handleSlowmodeChannelsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, (opt) => opt.value);
    setSettings((prev) => ({
      ...prev,
      slowmodeChannels: selectedOptions,
    }));
  };

  const handleIntervalChange = (field: 'slowmodeIntervalQuiet' | 'slowmodeIntervalBusy', val: string) => {
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 0) {
      setSettings((prev) => ({
        ...prev,
        [field]: num,
      }));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const res = await api<{ ok: boolean; settings: Settings }>(`/guilds/${guildId}/settings`, {
        method: 'PATCH',
        body: JSON.stringify({
          logChannelId: settings.logChannelId,
          stickerEnabled: settings.stickerEnabled,
          slowmodeEnabled: settings.slowmodeEnabled,
          slowmodeChannels: settings.slowmodeChannels,
          slowmodeIntervalQuiet: settings.slowmodeIntervalQuiet,
          slowmodeIntervalBusy: settings.slowmodeIntervalBusy,
        }),
      });

      setSettings(res.settings);
      setSuccess('Settings updated successfully!');
    } catch (err: any) {
      setError(err?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-4xl font-black">Settings</h1>
          <p className="mt-1 text-slate-400">Configure bot options and channel logging.</p>
        </div>

        <DashboardNav guildId={guildId} activeTab="settings" />

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-400">
            {success}
          </div>
        )}

        {loading ? (
          <div className="flex h-64 items-center justify-center text-slate-400">
            Loading settings...
          </div>
        ) : (
          <form onSubmit={handleSave} className="max-w-3xl space-y-6">
            {/* Features Settings */}
            <div className="card p-6">
              <h2 className="text-lg font-bold mb-4">Features Configuration</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-white/5 pb-4">
                  <div>
                    <p className="text-sm font-semibold">Sticker Keywords</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Toggle trigger sticker response when users type keywords in chat.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleSticker}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                      settings.stickerEnabled ? 'bg-indigo-500' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.stickerEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-semibold">Automatic Slowmode</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Dynamically adjusts channel slowmode (10s if busy, 5s if quiet).
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={settings.slowmodeEnabled}
                    aria-label="Toggle automatic slowmode"
                    onClick={handleToggleSlowmode}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                      settings.slowmodeEnabled ? 'bg-indigo-500' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.slowmodeEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Slowmode Detailed Settings */}
            {settings.slowmodeEnabled && (
              <div className="card p-6 space-y-4">
                <h2 className="text-lg font-bold">Slowmode Configuration</h2>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                    Monitored Channels
                  </label>
                  <select
                    multiple
                    value={settings.slowmodeChannels}
                    onChange={handleSlowmodeChannelsChange}
                    className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none min-h-[120px]"
                  >
                    {channels.map((ch) => (
                      <option key={ch.id} value={ch.id}>
                        #{ch.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Hold Ctrl (or Cmd) to select multiple channels to be monitored by automatic slowmode.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                      Quiet Slowmode (seconds)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={settings.slowmodeIntervalQuiet}
                      onChange={(e) => handleIntervalChange('slowmodeIntervalQuiet', e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                      Busy Slowmode (seconds)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={settings.slowmodeIntervalBusy}
                      onChange={(e) => handleIntervalChange('slowmodeIntervalBusy', e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Logging Settings */}
            <div className="card p-6">
              <h2 className="text-lg font-bold mb-4">Logging & Audits</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                    Log Channel
                  </label>
                  <select
                    value={settings.logChannelId || 'none'}
                    onChange={handleChannelChange}
                    className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="none">Disabled (No logs)</option>
                    {channels.map((ch) => (
                      <option key={ch.id} value={ch.id}>
                        #{ch.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Select a text channel where the bot will post moderation and panel event audit logs.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-indigo-500 px-6 py-3 font-bold hover:bg-indigo-400 disabled:opacity-50 transition shadow-lg shadow-indigo-500/20"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
