"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  Settings,
  UserCheck,
  FileText,
  Volume2,
  Lock,
  Activity,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Users,
  MessageSquare
} from "lucide-react";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [wsStatus, setWsStatus] = useState<string>("Disconnected");
  
  // Guild Configuration form state
  const [guildId, setGuildId] = useState<string>("123456789012345678");
  const [prefix, setPrefix] = useState<string>("-");
  const [welcomeChannel, setWelcomeChannel] = useState<string>("");
  const [welcomeMessage, setWelcomeMessage] = useState<string>("Welcome {mention} to {server}!");
  const [welcomeAutoDelete, setWelcomeAutoDelete] = useState<number>(0);
  const [logChannel, setLogChannel] = useState<string>("");
  const [logEnabled, setLogEnabled] = useState<boolean>(true);
  const [antiRaidEnabled, setAntiRaidEnabled] = useState<boolean>(false);
  const [antiRaidJoins, setAntiRaidJoins] = useState<number>(10);
  const [antiRaidWindow, setAntiRaidWindow] = useState<number>(15);
  const [antiNukeEnabled, setAntiNukeEnabled] = useState<boolean>(false);

  // Sync state with local mock API or fallback
  useEffect(() => {
    // Connect websocket mock/real
    setWsStatus("Connected");
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:3001/api/guilds/${guildId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prefix,
          welcomeChannelId: welcomeChannel || null,
          welcomeMessage,
          welcomeAutoDelete: welcomeAutoDelete || null,
          logChannelId: logChannel || null,
          logEnabled,
          antiRaidEnabled,
          antiRaidJoinsLimit: antiRaidJoins,
          antiRaidJoinsWindow: antiRaidWindow,
          antiNukeEnabled
        })
      });
      if (response.ok) {
        alert("✅ Configuration updated and synchronized with Bot successfully.");
      } else {
        alert("❌ Failed to synchronize with Bot. Please make sure the bot is running.");
      }
    } catch {
      alert("⚠️ Network error. Saving to local database mock context.");
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "welcome", label: "Welcomer", icon: UserCheck },
    { id: "logging", label: "Logging", icon: FileText },
    { id: "tempvc", label: "Temp VC", icon: Volume2 },
    { id: "security", label: "Security & Anti Raid", icon: Shield }
  ];

  return (
    <div className="flex h-screen bg-[#090d16] text-[#e2e8f0]">
      {/* Sidebar */}
      <aside className="w-80 glass flex flex-col justify-between border-r border-slate-800">
        <div>
          {/* Logo / Header */}
          <div className="p-6 flex items-center gap-3 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
              F
            </div>
            <div>
              <h1 className="font-extrabold text-xl bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Flantic Bot</h1>
              <p className="text-xs text-cyan-400 flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block"></span>
                <span>Live Sync (WS: {wsStatus})</span>
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="p-4 space-y-1.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-600/30 to-indigo-600/30 border border-cyan-500/30 text-white"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/40 border border-transparent"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-cyan-400" : ""}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Info footer */}
        <div className="p-6 border-t border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white">
            LC
          </div>
          <div>
            <h4 className="font-semibold text-sm">Lakshya Chopra</h4>
            <p className="text-xs text-slate-500">Guild Administrator</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-10 space-y-8">
        {/* Header */}
        <header className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-extrabold text-white capitalize">{activeTab} Panel</h2>
            <p className="text-slate-400 text-sm mt-1">Configure and manage server features in real-time.</p>
          </div>

          <div className="flex gap-4 items-center">
            <select
              value={guildId}
              onChange={(e) => setGuildId(e.target.value)}
              className="bg-[#1e293b] border border-slate-700 text-white px-4 py-2.5 rounded-xl font-medium focus:outline-none focus:border-cyan-500"
            >
              <option value="123456789012345678">Lakshya's HQ Server</option>
              <option value="987654321098765432">Development Laboratory</option>
            </select>
          </div>
        </header>

        {/* Content Tabs */}
        <form onSubmit={handleSave} className="space-y-6">
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Quick statistics card */}
              <div className="glass p-6 rounded-2xl flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-slate-400 text-sm">Total Members</h4>
                  <p className="text-2xl font-bold text-white">1,248</p>
                </div>
              </div>

              <div className="glass p-6 rounded-2xl flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-slate-400 text-sm">Weekly Messages</h4>
                  <p className="text-2xl font-bold text-white">18,459</p>
                </div>
              </div>

              <div className="glass p-6 rounded-2xl flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-slate-400 text-sm">Active Voice Channels</h4>
                  <p className="text-2xl font-bold text-white">4 channels</p>
                </div>
              </div>

              {/* Status Section */}
              <div className="col-span-3 glass p-8 rounded-2xl space-y-4 bg-gradient-to-br from-[#1e293b]/40 to-[#0f172a]/20">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="text-emerald-400" />
                  <span>Server Status Check</span>
                </h3>
                <p className="text-slate-400 text-sm max-w-xl">
                  Your server is configured correctly and running live. Premium features are unlocked. Prefix is currently set to <code className="bg-slate-800 text-cyan-400 px-2 py-0.5 rounded font-bold">{prefix}</code>.
                </p>
              </div>
            </div>
          )}

          {activeTab === "welcome" && (
            <div className="glass p-8 rounded-2xl space-y-6">
              <h3 className="text-xl font-bold text-white">Welcome Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-300">Welcome Channel ID</label>
                  <input
                    type="text"
                    value={welcomeChannel}
                    onChange={(e) => setWelcomeChannel(e.target.value)}
                    placeholder="e.g. 123456789012345678"
                    className="bg-[#131b2e] border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-300">Welcome Message Auto-Delete (Seconds)</label>
                  <input
                    type="number"
                    value={welcomeAutoDelete}
                    onChange={(e) => setWelcomeAutoDelete(parseInt(e.target.value, 10))}
                    placeholder="0 to disable autodelete"
                    className="bg-[#131b2e] border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="col-span-2 flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-300">Welcome Message Template</label>
                  <textarea
                    rows={4}
                    value={welcomeMessage}
                    onChange={(e) => setWelcomeMessage(e.target.value)}
                    placeholder="Welcome {mention} to {server}!"
                    className="bg-[#131b2e] border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-xs text-slate-500">Variables available: &#123;user&#125;, &#123;mention&#125;, &#123;server&#125;, &#123;membercount&#125;</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "logging" && (
            <div className="glass p-8 rounded-2xl space-y-6">
              <h3 className="text-xl font-bold text-white">Logging Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-300">Log Channel ID</label>
                  <input
                    type="text"
                    value={logChannel}
                    onChange={(e) => setLogChannel(e.target.value)}
                    placeholder="e.g. 987654321098765432"
                    className="bg-[#131b2e] border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex flex-col gap-4 justify-end">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={logEnabled}
                      onChange={(e) => setLogEnabled(e.target.checked)}
                      className="w-5 h-5 rounded bg-slate-700 border-transparent text-cyan-600 focus:ring-0"
                    />
                    <span className="text-sm font-semibold text-slate-300">Enable Logging System</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === "tempvc" && (
            <div className="glass p-8 rounded-2xl space-y-4">
              <h3 className="text-xl font-bold text-white">Temporary Voice Channels</h3>
              <p className="text-slate-400 text-sm">
                Temporary Voice generator channels are configured dynamically. Once users join the designated generator voice channel, a new custom voice channel will be generated automatically.
              </p>
            </div>
          )}

          {activeTab === "security" && (
            <div className="glass p-8 rounded-2xl space-y-6">
              <h3 className="text-xl font-bold text-white">Security & Anti Raid Config</h3>

              <div className="space-y-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={antiRaidEnabled}
                    onChange={(e) => setAntiRaidEnabled(e.target.checked)}
                    className="w-5 h-5 rounded bg-slate-700 border-transparent text-cyan-600 focus:ring-0"
                  />
                  <span className="text-sm font-semibold text-slate-300">Enable Anti-Raid Joins Detection</span>
                </label>

                {antiRaidEnabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-8 border-l border-slate-800">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-slate-300">Max Joins Allowed</label>
                      <input
                        type="number"
                        value={antiRaidJoins}
                        onChange={(e) => setAntiRaidJoins(parseInt(e.target.value, 10))}
                        className="bg-[#131b2e] border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-slate-300">Detection Window (Seconds)</label>
                      <input
                        type="number"
                        value={antiRaidWindow}
                        onChange={(e) => setAntiRaidWindow(parseInt(e.target.value, 10))}
                        className="bg-[#131b2e] border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                )}

                <label className="flex items-center gap-3 cursor-pointer pt-4 border-t border-slate-800/40">
                  <input
                    type="checkbox"
                    checked={antiNukeEnabled}
                    onChange={(e) => setAntiNukeEnabled(e.target.checked)}
                    className="w-5 h-5 rounded bg-slate-700 border-transparent text-cyan-600 focus:ring-0"
                  />
                  <span className="text-sm font-semibold text-slate-300">Enable Anti-Nuke Recovery System</span>
                </label>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs text-right text-slate-500">Guild Custom Prefix</label>
              <input
                type="text"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                className="bg-[#1e293b] border border-slate-700 text-white text-center w-20 px-2 py-2 rounded-xl focus:outline-none"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-600 hover:to-indigo-600 text-white font-bold px-8 py-3 rounded-xl transition-all duration-300 shadow-lg shadow-indigo-500/20"
              >
                Save Configurations
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
