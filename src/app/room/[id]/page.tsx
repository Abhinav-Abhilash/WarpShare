"use html";
"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Copy, Check, Wifi, HardDrive } from "lucide-react";
import { useWebRTC } from "../../../hooks/useWebRTC";
import { Dropzone } from "../../../components/broadcast/Dropzone";
import { MeshTelemetry } from "../../../components/broadcast/MeshTelemetry";
import RoomQRCode from "../../../components/RoomQRCode";

export default function RoomPage({ params }: { params: { id: string } }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<string>("Initializing mesh engine...");
  const [logs, setLogs] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  
  const addLog = (msg: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
    // Also use the status label for simple top-level status
    if (msg.includes("Connected") || msg.includes("secured") || msg.includes("tunnel")) {
      setStatus("Connected!");
    } else if (msg.includes("Waiting") || msg.includes("Host registered")) {
      setStatus("Waiting for peers...");
    } else if (msg.includes("Guest registered")) {
      setStatus("Connecting to Host...");
    } else if (msg.includes("Error") || msg.includes("failure")) {
      setStatus("Connection Error");
    }
  };

  const { peers, transfers, startBroadcast, localId } = useWebRTC(params.id, addLog);

  useEffect(() => {
    setMounted(true);
  }, []);

  const copyRoomLink = () => {
    if (typeof window === "undefined") return;
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-200">
      {/* Top Navigation Banner */}
      <header className="w-full border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-50 px-4 py-3.5 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-accent rounded-xl flex items-center justify-center text-white font-bold shadow-md shadow-accent/20">
            ⚡
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight leading-none">WarpShare</h1>
            <p className="text-[11px] text-muted-foreground mt-1">Offline Local Mesh Network</p>
          </div>
        </div>

        <button 
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground transition-all cursor-pointer shadow-sm"
          aria-label="Toggle Theme"
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
      </header>

      {/* Main Workspace Grid - Classic Responsive Layout */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* LEFT SECTION (2 Columns on Desktop) - Transfer Controls & Dropzone */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm space-y-6">
              
              {/* Room Status Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-accent/10 text-accent font-mono">
                      ROOM #{params.id}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <span className={`h-2 w-2 rounded-full ${status === "Connected!" ? "bg-green-500" : "bg-amber-500 animate-pulse"}`} />
                      {status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">Open this exact page on your phone or PC to link instantly.</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <RoomQRCode roomId={params.id} />
                  <button
                    onClick={copyRoomLink}
                    className="inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 text-accent-foreground px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all shadow-sm cursor-pointer shrink-0"
                  >
                    {copied ? <Check className="h-4 w-4 text-green-300"/> : <Copy className="h-4 w-4"/>}
                    {copied ? "Copied Link!" : "Copy Room Link"}
                  </button>
                </div>
              </div>

              {/* Classic File Drop Zone - REINTEGRATED WITH startBroadcast */}
              <Dropzone onDrop={startBroadcast} />

            </div>
          </div>

          {/* RIGHT SECTION (1 Column on Desktop) - Telemetry & Network Diagnostics */}
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3.5">
                <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Wifi className="h-4 w-4 text-accent"/> Network Telemetry
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-green-500/10 text-green-500 font-bold">ONLINE</span>
              </div>
              
              {/* Diagnostic Specs */}
              <div className="bg-muted/30 border border-border rounded-xl p-3.5 space-y-2.5 text-xs mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Engine:</span>
                  <span className="font-mono font-semibold text-foreground">PeerJS WebRTC Mesh</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Signaling:</span>
                  <span className="font-mono font-semibold text-accent">0.peerjs.com (SSL)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">NAT Traversal:</span>
                  <span className="font-mono font-semibold text-green-500">Google STUN Active</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Serialization:</span>
                  <span className="font-mono font-semibold text-purple-500">RAW Binary</span>
                </div>
              </div>

              {/* Live Mesh Transfers - REINTEGRATED */}
              <div className="mb-4">
                <MeshTelemetry peers={peers} transfers={transfers} />
              </div>

              {/* Live Terminal Logs */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Live Pipeline Logs</h4>
                </div>
                <div className="h-52 w-full bg-background/80 font-mono text-[11px] p-3 rounded-xl overflow-y-auto border border-border flex flex-col gap-2 select-none shadow-inner">
                  {logs.length === 0 ? (
                    <span className="text-muted-foreground italic">Listening for network telemetry events...</span>
                  ) : (
                    logs.map((log, index) => (
                      <div key={index} className="text-foreground/80 break-words leading-relaxed border-b border-border/40 pb-1.5 last:border-0 last:pb-0">
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
