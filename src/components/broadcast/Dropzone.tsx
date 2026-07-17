import React, { useRef, useState, DragEvent, ChangeEvent } from 'react';
import { HardDriveDownload } from 'lucide-react';

interface DropzoneProps {
  onDrop: (file: File) => void;
}

export function Dropzone({ onDrop }: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onDrop(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onDrop(e.target.files[0]);
    }
  };

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`w-full flex flex-col items-center justify-center p-10 bg-white dark:bg-[#18181B] border border-dashed rounded-xl transition-colors duration-200 cursor-pointer group
        ${isDragging ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20' : 'border-[var(--border)] hover:border-indigo-500/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/50'}
      `}
    >
      <input 
        type="file" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileInput} 
      />
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 mb-4 group-hover:scale-105 transition-transform duration-200">
        <HardDriveDownload className={`w-6 h-6 transition-colors duration-200 ${isDragging ? 'text-indigo-500' : 'text-zinc-500 dark:text-zinc-400 group-hover:text-indigo-500'}`} />
      </div>
      <p className="text-sm font-medium text-[var(--foreground)]">
        Drag & drop files here, or <span className="text-indigo-500">browse</span> to broadcast to the room.
      </p>
      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
        Unlimited file size. Distributed securely via WebRTC.
      </p>
    </div>
  );
}
