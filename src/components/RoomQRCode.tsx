"use client";

import { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Check, Download, QrCode, Share2, X } from "lucide-react";

interface RoomQRCodeProps {
  roomId: string;
}

const BRAND_MARK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%234f46e5' d='M13 2 3 14h7l-1 8 10-12h-7z'/%3E%3C/svg%3E";

export default function RoomQRCode({ roomId }: RoomQRCodeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [roomUrl, setRoomUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const qrCodeRef = useRef<SVGSVGElement>(null);

  const openModal = () => {
    setRoomUrl(window.location.href);
    setIsOpen(true);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(roomUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      console.warn("Unable to copy the room link to the clipboard.");
    }
  };

  const downloadQR = () => {
    const svg = qrCodeRef.current;
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const image = new Image();

    image.onload = () => {
      canvas.width = image.width;
      canvas.height = image.height;
      ctx?.drawImage(image, 0, 0);

      const downloadLink = document.createElement("a");
      downloadLink.download = `WarpShare-Room-${roomId}.png`;
      downloadLink.href = canvas.toDataURL("image/png");
      downloadLink.click();
    };

    image.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  };

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex items-center gap-2 bg-card border border-border hover:bg-muted text-foreground px-3.5 py-2 rounded-xl font-medium text-xs sm:text-sm transition-all shadow-sm cursor-pointer shrink-0"
      >
        <QrCode className="h-4 w-4 text-accent" />
        <span>Scan QR</span>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="qr-modal-title"
        >
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl relative flex flex-col items-center text-center space-y-6">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer"
              aria-label="Close QR code"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 text-accent font-mono text-xs font-bold mb-2">
                ROOM #{roomId}
              </div>
              <h3 id="qr-modal-title" className="text-lg font-bold text-foreground">
                Scan with Mobile Camera
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Point any mobile camera here to connect instantly over local Wi-Fi.
              </p>
            </div>

            <div className="p-5 bg-white rounded-2xl shadow-inner border border-slate-100">
              {roomUrl && (
                <QRCodeSVG
                  ref={qrCodeRef}
                  id="warpshare-qr"
                  value={roomUrl}
                  level="H"
                  size={190}
                  bgColor="#ffffff"
                  fgColor="#0f172a"
                  imageSettings={{
                    src: BRAND_MARK,
                    height: 32,
                    width: 32,
                    excavate: true,
                  }}
                />
              )}
            </div>

            <div className="flex items-center gap-2 w-full pt-2">
              <button
                type="button"
                onClick={copyLink}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-muted hover:bg-muted/80 text-foreground py-2.5 rounded-xl font-medium text-xs transition-all cursor-pointer"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Share2 className="h-3.5 w-3.5" />
                )}
                {copied ? "Copied!" : "Copy Link"}
              </button>

              <button
                type="button"
                onClick={downloadQR}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 text-accent-foreground py-2.5 rounded-xl font-medium text-xs transition-all cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                Download QR
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
