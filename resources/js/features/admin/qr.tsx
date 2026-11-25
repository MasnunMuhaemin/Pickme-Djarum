import QRCode from 'qrcode';
import { useEffect, useState } from 'react';

const options = { errorCorrectionLevel: 'M' as const, margin: 2, width: 720 };

/** Gambar QR untuk alamat titik, dibuat di browser. */
export function QrImage({ value, className }: { value: string; className?: string }) {
    const [src, setSrc] = useState<string | null>(null);

    useEffect(() => {
        QRCode.toDataURL(value, options).then(setSrc);
    }, [value]);

    return src ? <img src={src} alt={`QR ${value}`} className={className} /> : <div className={className} />;
}

/** Unduh QR sebagai PNG, mis. QR-W07.png. */
export async function downloadQr(value: string, code: string): Promise<void> {
    const link = document.createElement('a');
    link.href = await QRCode.toDataURL(value, options);
    link.download = `QR-${code}.png`;
    link.click();
}
