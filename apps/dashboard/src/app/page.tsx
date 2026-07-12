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
  MessageSquare,
  Ticket,
  LogOut,
  Plus
} from "lucide-react";

const CATEGORIES = [
  "channels",
  "automod",
  "emojis",
  "invites",
  "messages",
  "roles",
  "server",
  "users",
  "voice",
  "moderation"
];

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [guilds, setGuilds] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [wsStatus, setWsStatus] = useState<string>("Disconnected");

  // Selected guild ID
  const [guildId, setGuildId] = useState<string>("");

  // Resources from discord API
  const [guildChannels, setGuildChannels] = useState<any[]>([]);
  const [guildRoles, setGuildRoles] = useState<any[]>([]);

  // Guild Configuration form state
  const [prefix, setPrefix] = useState<string>("-");
  const [welcomeChannel, setWelcomeChannel] = useState<string>("");
  const [welcomeType, setWelcomeType] = useState<string>("both");
  const [welcomeMessage, setWelcomeMessage] = useState<string>("Welcome {user} to {server}!");
  const [welcomeAutoDelete, setWelcomeAutoDelete] = useState<number>(0);
  const [logChannel, setLogChannel] = useState<string>("");
  const [logEnabled, setLogEnabled] = useState<boolean>(true);
  const [antiRaidEnabled, setAntiRaidEnabled] = useState<boolean>(false);
  const [antiRaidJoins, setAntiRaidJoins] = useState<number>(10);
  const [antiRaidWindow, setAntiRaidWindow] = useState<number>(15);
  const [antiNukeEnabled, setAntiNukeEnabled] = useState<boolean>(false);
  const [ticketCategory, setTicketCategory] = useState<string>("");
  const [supportRole, setSupportRole] = useState<string>("");

  // Modular logging category configurations
  const [categoryToggles, setCategoryToggles] = useState<Record<string, boolean>>({
    channels: true,
    automod: true,
    emojis: true,
    invites: true,
    messages: true,
    roles: true,
    server: true,
    users: true,
    voice: true,
    moderation: true
  });
  
  const [categoryChannels, setCategoryChannels] = useState<Record<string, string>>({
    channels: "",
    automod: "",
    emojis: "",
    invites: "",
    messages: "",
    roles: "",
    server: "",
    users: "",
    voice: "",
    moderation: ""
  });

  // 1. Verify Authentication on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setGuilds(data.guilds || []);
          if (data.guilds && data.guilds.length > 0) {
            setGuildId(data.guilds[0].id);
          }
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setIsLoading(false);
      }
    }
    checkAuth();
  }, []);

  // 2. Fetch live settings and dropdown resources when guildId changes
  useEffect(() => {
    if (!user || !guildId) return;

    async function loadGuildConfig() {
      setWsStatus("Loading...");
      try {
        const response = await fetch(`/api/guilds/${guildId}/config`);
        if (response.ok) {
          const data = await response.json();
          
          setGuildChannels(data.channels || []);
          setGuildRoles(data.roles || []);

          const cfg = data.config || {};
          setPrefix(cfg.prefix || "-");
          setWelcomeChannel(cfg.welcomeChannelId || "");
          setWelcomeType(cfg.welcomeType || "both");
          setWelcomeMessage(cfg.welcomeMessage || "");
          setWelcomeAutoDelete(cfg.welcomeAutoDelete || 0);
          setLogChannel(cfg.logChannelId || "");
          setLogEnabled(cfg.logEnabled ?? false);
          setAntiRaidEnabled(cfg.antiRaidEnabled ?? false);
          setAntiRaidJoins(cfg.antiRaidJoinsLimit ?? 10);
          setAntiRaidWindow(cfg.antiRaidJoinsWindow ?? 15);
          setAntiNukeEnabled(cfg.antiNukeEnabled ?? false);
          setTicketCategory(cfg.ticketCategoryId || "");
          setSupportRole(cfg.supportRoleId || "");

          const logToggles = cfg.logToggles || {};
          const toggles = logToggles.toggles || {};
          const channels = logToggles.channels || {};

          const nextToggles = { ...categoryToggles };
          const nextChannels = { ...categoryChannels };
          for (const cat of CATEGORIES) {
            nextToggles[cat] = toggles[cat] !== false;
            nextChannels[cat] = channels[cat] || "";
          }
          setCategoryToggles(nextToggles);
          setCategoryChannels(nextChannels);
          setWsStatus("Connected");
        } else {
          setWsStatus("Disconnected (Forbidden)");
        }
      } catch (err) {
        console.error("Failed to load guild configuration:", err);
        setWsStatus("Connection Failed");
      }
    }
    loadGuildConfig();
  }, [guildId, user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/guilds/${guildId}/config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prefix,
          welcomeChannelId: welcomeChannel || null,
          welcomeType,
          welcomeMessage,
          welcomeAutoDelete: welcomeAutoDelete || null,
          logChannelId: logChannel || null,
          logEnabled,
          antiRaidEnabled,
          antiRaidJoinsLimit: antiRaidJoins,
          antiRaidJoinsWindow: antiRaidWindow,
          antiNukeEnabled,
          ticketCategoryId: ticketCategory || null,
          supportRoleId: supportRole || null,
          logToggles: {
            toggles: categoryToggles,
            channels: categoryChannels
          }
        })
      });
      if (response.ok) {
        alert("✅ Configurations saved to database and synced successfully.");
      } else {
        alert("❌ Failed to save configuration. Please try again.");
      }
    } catch {
      alert("⚠️ Network error. Failed to save.");
    }
  };

  // Render Loading spinner
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#090d16] text-[#e2e8f0]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-cyan-500/20 border-t-cyan-500 animate-spin"></div>
          <p className="text-sm font-semibold tracking-wider text-cyan-400">CONNECTING TO DATABASE...</p>
        </div>
      </div>
    );
  }

  // Render Login page if not authorized
  if (!user) {
    return (
      <div className="min-h-screen bg-[#070b13] flex flex-col justify-between text-[#e2e8f0] relative overflow-hidden">
        {/* Decorative Neon Blurs */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/10 blur-[150px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[150px]"></div>

        {/* Navbar */}
        <header className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full border-b border-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
              G
            </div>
            <span className="font-extrabold text-xl tracking-wider text-white">GUPSHUP</span>
          </div>
          <a
            href="/api/auth/login"
            className="px-6 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm font-semibold hover:border-slate-700 transition-all duration-300"
          >
            Sign In
          </a>
        </header>

        {/* Hero Section */}
        <main className="max-w-7xl mx-auto px-6 py-20 flex-1 flex flex-col items-center justify-center text-center relative z-10 space-y-10">
          <div className="space-y-4 max-w-3xl">
            <span className="px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs font-bold text-cyan-400 tracking-widest uppercase">
              Live Discord Dashboard
            </span>
            <h1 className="text-5xl md:text-6xl font-black tracking-tight text-white leading-tight">
              Manage Your Server Like <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400">
                Never Before.
              </span>
            </h1>
            <p className="text-slate-400 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
              Complete control over your server. Fully interactive welcomer templates, modular logging overrides, tickets, automod, and anti-nuke protection.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="/api/auth/login"
              className="bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-600 hover:to-indigo-600 text-white font-bold px-10 py-4 rounded-xl transition-all duration-300 shadow-lg shadow-indigo-500/30 transform hover:-translate-y-0.5"
            >
              Connect with Discord
            </a>
            <a
              href="https://discord.com/api/oauth2/authorize?client_id=1126413930105950279&permissions=8&scope=bot%20applications.commands"
              target="_blank"
              rel="noreferrer"
              className="px-10 py-4 rounded-xl bg-slate-900 border border-slate-800 font-bold hover:bg-slate-800/80 transition-all duration-300"
            >
              Invite Bot
            </a>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full pt-16">
            <div className="glass p-6 rounded-2xl text-left border border-slate-900 hover:border-slate-800 transition-all duration-300">
              <UserCheck className="w-8 h-8 text-cyan-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Dynamic Welcomer</h3>
              <p className="text-slate-400 text-sm">Design welcome greetings with custom descriptions and autodelete timers.</p>
            </div>
            <div className="glass p-6 rounded-2xl text-left border border-slate-900 hover:border-slate-800 transition-all duration-300">
              <FileText className="w-8 h-8 text-indigo-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">10 Log Categories</h3>
              <p className="text-slate-400 text-sm">Assign custom channels to audit messages, joins, voice connections, and bans.</p>
            </div>
            <div className="glass p-6 rounded-2xl text-left border border-slate-900 hover:border-slate-800 transition-all duration-300">
              <Shield className="w-8 h-8 text-purple-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Anti-Nuke Recovery</h3>
              <p className="text-slate-400 text-sm">Instantly ban unauthorized executors and restore deleted roles or channels.</p>
            </div>
            <div className="glass p-6 rounded-2xl text-left border border-slate-900 hover:border-slate-800 transition-all duration-300">
              <Ticket className="w-8 h-8 text-emerald-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Ticket Systems</h3>
              <p className="text-slate-400 text-sm">Launch full interactive button panels to handle guild support tickets.</p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="p-8 text-center border-t border-slate-900/50 text-slate-600 text-xs">
          © {new Date().getFullYear()} Gupshup. Built with Next.js and Tailwind CSS.
        </footer>
      </div>
    );
  }

  // Define sidebar tabs list
  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "welcome", label: "Welcomer", icon: UserCheck },
    { id: "logging", label: "Logging", icon: FileText },
    { id: "security", label: "Security & Anti Raid", icon: Shield },
    { id: "tickets", label: "Ticket Systems", icon: Ticket }
  ];

  return (
    <div className="flex h-screen bg-[#090d16] text-[#e2e8f0]">
      {/* Sidebar */}
      <aside className="w-80 glass flex flex-col justify-between border-r border-slate-800/80">
        <div>
          {/* Logo / Header */}
          <div className="p-6 flex items-center gap-3 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
              G
            </div>
            <div>
              <h1 className="font-extrabold text-xl bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Gupshup Bot</h1>
              <p className="text-xs text-cyan-400 flex items-center gap-1.5 mt-0.5">
                <span className={`w-2 h-2 rounded-full ${wsStatus === "Connected" ? "bg-emerald-500 animate-ping" : wsStatus === "Loading..." ? "bg-yellow-500" : "bg-rose-500"} inline-block`}></span>
                <span>{wsStatus}</span>
              </p>
            </div>
          </div>

          {/* Mutual Guild Selector inside Sidebar */}
          <div className="p-4 border-b border-slate-800/40">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Configure Guild</label>
            <select
              value={guildId}
              onChange={(e) => setGuildId(e.target.value)}
              className="w-full bg-[#131b2e] border border-slate-800 text-white px-3 py-2 rounded-xl text-sm font-semibold focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              {guilds.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Navigation Tabs */}
          <nav className="p-4 space-y-1.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-semibold text-sm ${
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
        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={user.avatar || "https://cdn.discordapp.com/embed/avatars/0.png"}
              alt="avatar"
              className="w-10 h-10 rounded-full border border-slate-800 bg-slate-800"
            />
            <div className="truncate w-32">
              <h4 className="font-bold text-sm text-white truncate">{user.username}</h4>
              <p className="text-[10px] text-slate-500 tracking-wider">GUILD ADMIN</p>
            </div>
          </div>
          <a
            href="/api/auth/logout"
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-950 transition-all duration-300"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-10 space-y-8">
        {/* Header */}
        <header className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black text-white capitalize">{activeTab} Panel</h2>
            <p className="text-slate-400 text-sm mt-1">Configure and manage server features in real-time.</p>
          </div>

          <div className="flex gap-3">
            <a
              href="https://discord.com/api/oauth2/authorize?client_id=1126413930105950279&permissions=8&scope=bot%20applications.commands"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm font-bold text-white hover:border-slate-700 transition-all duration-300"
            >
              <Plus className="w-4 h-4" />
              <span>Add to Server</span>
            </a>
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
                  <label className="text-sm font-semibold text-slate-300">Welcome Channel</label>
                  <select
                    value={welcomeChannel}
                    onChange={(e) => setWelcomeChannel(e.target.value)}
                    className="bg-[#131b2e] border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="">Disabled / Not Configured</option>
                    {guildChannels
                      .filter(c => c.type === 0)
                      .map(ch => (
                        <option key={ch.id} value={ch.id}>#{ch.name}</option>
                      ))}
                  </select>
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

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-300">Welcome Greet Type</label>
                  <select
                    value={welcomeType}
                    onChange={(e) => setWelcomeType(e.target.value)}
                    className="bg-[#131b2e] border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="normal">Normal Message Only</option>
                    <option value="embed">Embed Only</option>
                    <option value="both">Both Normal Message and Embed</option>
                  </select>
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
              <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <h3 className="text-xl font-bold text-white">Logging Settings</h3>
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-300 font-bold">Global Fallback Log Channel</label>
                  <select
                    value={logChannel}
                    onChange={(e) => setLogChannel(e.target.value)}
                    className="bg-[#131b2e] border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="">Not Configured</option>
                    {guildChannels
                      .filter(c => c.type === 0)
                      .map(ch => (
                        <option key={ch.id} value={ch.id}>#{ch.name}</option>
                      ))}
                  </select>
                  <span className="text-xs text-slate-500">Used if no category-specific log channel is set below.</span>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-extrabold text-cyan-400 uppercase tracking-wider">Modular Category Channels & Toggles</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {CATEGORIES.map(cat => (
                    <div key={cat} className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-white capitalize">{cat} Logs</span>
                        <input
                          type="checkbox"
                          checked={categoryToggles[cat] !== false}
                          onChange={(e) => {
                            setCategoryToggles({
                              ...categoryToggles,
                              [cat]: e.target.checked
                            });
                          }}
                          className="w-4.5 h-4.5 rounded bg-slate-800 text-cyan-500 focus:ring-0"
                        />
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-slate-400">Custom Log Channel</label>
                        <select
                          value={categoryChannels[cat] || ""}
                          onChange={(e) => {
                            setCategoryChannels({
                              ...categoryChannels,
                              [cat]: e.target.value
                            });
                          }}
                          className="bg-[#0b101c] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                        >
                          <option value="">Global Fallback Channel</option>
                          {guildChannels
                            .filter(c => c.type === 0)
                            .map(ch => (
                              <option key={ch.id} value={ch.id}>#{ch.name}</option>
                            ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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

          {activeTab === "tickets" && (
            <div className="glass p-8 rounded-2xl space-y-6">
              <h3 className="text-xl font-bold text-white">Ticketing Support Panel</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-300">Ticket Category Channel</label>
                  <select
                    value={ticketCategory}
                    onChange={(e) => setTicketCategory(e.target.value)}
                    className="bg-[#131b2e] border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="">Select Category...</option>
                    {guildChannels
                      .filter(c => c.type === 4)
                      .map(ch => (
                        <option key={ch.id} value={ch.id}>{ch.name}</option>
                      ))}
                  </select>
                  <span className="text-xs text-slate-500">Private ticket channels will be generated inside this category.</span>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-300 font-bold">Support Team Role</label>
                  <select
                    value={supportRole}
                    onChange={(e) => setSupportRole(e.target.value)}
                    className="bg-[#131b2e] border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="">Select Role...</option>
                    {guildRoles.map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                  <span className="text-xs text-slate-500">Members with this role will have permission to assist in tickets.</span>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-4 border-t border-slate-800/40 pt-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs text-right text-slate-500 font-semibold tracking-wider">SERVER PREFIX</label>
              <input
                type="text"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                className="bg-[#131b2e] border border-slate-700 text-white text-center w-24 py-2.5 rounded-xl font-bold focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-600 hover:to-indigo-600 text-white font-bold px-10 py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-indigo-500/20 transform hover:-translate-y-0.5"
              >
                Save Server Configurations
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
