import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Maximize2, QrCode, X } from 'lucide-react';

interface QrCodeDisplayProps {
  url: string;
  code: string;
}

export const QrCodeDisplay: React.FC<QrCodeDisplayProps> = ({ url, code }) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(url, {
      width: 320,
      margin: 1,
      color: {
        dark: '#0F172A',
        light: '#FFFFFF',
      },
    })
      .then((generated) => {
        if (active) setDataUrl(generated);
      })
      .catch(() => {
        if (active) setDataUrl('');
      });
    return () => {
      active = false;
    };
  }, [url]);

  return (
    <>
      <div className="flex items-center gap-2.5 rounded-xl border-2 border-slate-900 bg-white p-2">
        {dataUrl ? (
          <img
            src={dataUrl}
            alt={`QR Code masuk ruang ${code}`}
            data-testid="room-qr-image"
            className="h-[74px] w-[74px] shrink-0 rounded-md border border-slate-200"
          />
        ) : (
          <div className="flex h-[74px] w-[74px] shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-400">
            <QrCode className="h-7 w-7" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-extrabold text-slate-900">
            Scan QR untuk Langsung Masuk
          </div>
          <p className="mt-0.5 text-[10.5px] font-medium leading-snug text-slate-600">
            Siswa cukup arahkan kamera HP/tablet ke kode QR ini untuk bergabung ke ruang{' '}
            <span className="font-num font-bold text-slate-900">{code}</span>.
          </p>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="mt-1.5 inline-flex items-center gap-1 rounded-lg border-2 border-slate-900 bg-amber-300 px-2.5 py-1 text-[11px] font-bold text-slate-900 hover:bg-amber-200"
          >
            <Maximize2 className="h-3 w-3" />
            Perbesar QR (Proyektor)
          </button>
        </div>
      </div>

      {expanded && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="qr-projector-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 p-4"
        >
          <div className="w-full max-w-md rounded-2xl border-[3px] border-slate-900 bg-[#FFFDF5] p-6 text-center shadow-[0_10px_0_#0F172A]">
            <div className="mb-3 flex items-center justify-between">
              <h3 id="qr-projector-title" className="font-display text-xl font-bold text-slate-900">
                Scan QR Ruang Balapan
              </h3>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                aria-label="Tutup tampilan QR besar"
                className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-slate-900 bg-white text-slate-900 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mx-auto inline-block rounded-2xl border-[3px] border-slate-900 bg-white p-4">
              {dataUrl && (
                <img
                  src={dataUrl}
                  alt={`QR Code proyektor ruang ${code}`}
                  className="h-64 w-64"
                />
              )}
            </div>

            <div className="mt-4">
              <span className="block text-xs font-bold text-slate-600">KODE RUANG</span>
              <span className="font-num text-4xl font-bold tracking-widest text-slate-900">
                {code}
              </span>
            </div>
            <p className="mt-2 truncate rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-mono text-xs text-slate-700">
              {url}
            </p>
          </div>
        </div>
      )}
    </>
  );
};
