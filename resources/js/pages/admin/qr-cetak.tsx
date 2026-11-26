import { QrImage } from '@/features/admin/qr';
import { Head } from '@inertiajs/react';
import { useEffect } from 'react';

type Item = { code: string; name: string; qr: string };

/** Lembar cetak semua QR warung: hanya QR, kode titik, dan nama warung. Dialog cetak terbuka otomatis (simpan sebagai PDF). */
export default function QrCetak({ outlets }: { outlets: Item[] }) {
    useEffect(() => {
        // Tunggu gambar QR selesai dibuat di browser sebelum membuka dialog cetak.
        const t = window.setTimeout(() => window.print(), 1200);
        return () => window.clearTimeout(t);
    }, []);

    return (
        <div className="bg-white p-4 text-black sm:p-6">
            <Head title="Cetak QR warung" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
                {outlets.map((o) => (
                    <div key={o.code} className="break-inside-avoid rounded-xl border border-black/15 p-4 text-center">
                        <QrImage value={o.qr} className="mx-auto aspect-square w-full max-w-[180px]" />
                        <p className="mt-2 text-[16px] font-extrabold">{o.code}</p>
                        <p className="text-[13px] font-bold">{o.name}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
