import React, { useEffect, useState } from 'react';
import { Dropzone } from './Dropzone';
import { MeshTelemetry } from './MeshTelemetry';
import { Peer, FileTransfer } from '../../lib/types/network';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from "react-resizable-panels";
import { GripVertical } from "lucide-react";

interface RoomBroadcastProps {
  peers: Peer[];
  transfers: FileTransfer[];
  startBroadcast: (file: File) => void;
}

export function RoomBroadcast({ peers, transfers, startBroadcast }: RoomBroadcastProps) {
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const checkIsDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkIsDesktop();
    window.addEventListener('resize', checkIsDesktop);
    return () => window.removeEventListener('resize', checkIsDesktop);
  }, []);

  return (
    <PanelGroup 
      id="warpshare-layout-v1" 
      className="h-full w-full rounded-[12px] border border-[var(--border)] bg-white dark:bg-[#18181B] overflow-hidden" 
      orientation={isDesktop ? "horizontal" : "vertical"}
    >
      {/* Left Panel: Primary File Drop Zone */}
      <Panel defaultSize={65} minSize={30}>
        <div className="h-full w-full overflow-y-auto">
          <Dropzone onDrop={startBroadcast} />
        </div>
      </Panel>

      {/* Center Draggable Resize Handle */}
      <PanelResizeHandle className="w-2 md:w-2 h-2 md:h-full bg-zinc-100 dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors flex items-center justify-center cursor-row-resize md:cursor-col-resize group z-10">
        <GripVertical className="h-4 w-4 text-zinc-400 group-hover:text-indigo-500 transition-colors hidden md:block" />
        <div className="h-1 w-8 bg-zinc-400 rounded-full md:hidden group-hover:bg-indigo-500" />
      </PanelResizeHandle>

      {/* Right Panel: Telemetry & Network Logs */}
      <Panel collapsible={true} defaultSize={35} minSize={20}>
        <div className="h-full w-full overflow-y-auto bg-zinc-50 dark:bg-zinc-900/50">
          <MeshTelemetry peers={peers} transfers={transfers} />
        </div>
      </Panel>
    </PanelGroup>
  );
}
