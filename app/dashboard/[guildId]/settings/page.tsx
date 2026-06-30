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

  const toggleSlowmodeChannel = (channelId: string) => {
    setSettings((prev) => {
      const selected = prev.slowmodeChannels.includes(channelId);
      return {
        ...prev,
        slowmodeChannels: selected
          ? prev.slowmodeChannels.filter((id) => id !== channelId)
          : [...prev.slowmodeChannels, channelId],
      };
    });
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
              <div className="card p-6 space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold">Auto Slowmode Rules</h2>
                    <p className="mt-1 text-xs text-slate-400">
                      Pilih channel yang mau dijaga slowmode otomatis.
                    </p>
                  </div>
                  <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300">
                    {settings.slowmodeChannels.length} selected
                  </span>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  {channels.map((ch) => {
                    const selected = settings.slowmodeChannels.includes(ch.id);
                    return (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => toggleSlowmodeChannel(ch.id)}
                        className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                          selected
                            ? 'border-indigo-500/60 bg-indigo-500/10 text-white'
                            : 'border-white/10 bg-black/20 text-slate-300 hover:border-white/20 hover:bg-white/5'
                        }`}
                      >
                        <span className="text-sm font-semibold">#{ch.name}</span>
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${
                            selected ? 'border-indigo-400 bg-indigo-500 text-white' : 'border-slate-600 text-transparent'
                          }`}
                        >
                          ✓
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-2">
                      Sepi
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={settings.slowmodeIntervalQuiet}
                        onChange={(e) => handleIntervalChange('slowmodeIntervalQuiet', e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                      />
                      <span className="text-xs text-slate-400">sec</span>
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-2">
                      Rame
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={settings.slowmodeIntervalBusy}
                        onChange={(e) => handleIntervalChange('slowmodeIntervalBusy', e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                      />
                      <span className="text-xs text-slate-400">sec</span>
                    </div>
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
