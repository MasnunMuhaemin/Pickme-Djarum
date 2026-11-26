import { downloadQr, QrImage } from '@/features/admin/qr';
import AdminLayout from '@/layouts/admin-layout';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { ArrowLeft, Download, Printer } from 'lucide-react';

type Item = { code: string; name: string; area: string | null; qr: string; qr_used: boolean };

/** QR warung (desain): satu QR per warung, unduh satu per satu atau semua, dan cetak lembar. */
export default function QrWarung({ outlets }: { outlets: Item[] }) {
    async function downloadAll() {
        // Unduh berurutan supaya browser tidak memblokir unduhan beruntun.
        for (const o of outlets) {
            await downloadQr(o.qr, o.code);
            await new Promise((r) => setTimeout(r, 250));
        }
    }

    return (
        <AdminLayout active="md-warung" title="QR warung" subtitle={`${outlets.length} QR, satu per warung, lengkap dengan nama toko.`}>
            <div className="-mt-2 mb-4 flex flex-wrap items-center justify-between gap-2 print:hidden">
                <Link href="/admin/master-data/warung" className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[12px] font-bold">
                    <ArrowLeft className="size-3.5" /> Semua warung
                </Link>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={downloadAll}
                        className="border-ink flex h-9 items-center gap-1.5 rounded-full border-2 bg-white px-4 text-[12px] font-extrabold"
                    >
                        <Download className="size-4" /> Unduh semua (PNG)
                    </button>
                    <a
                        href="/admin/master-data/warung/qr/cetak"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-lime flex h-9 items-center gap-1.5 rounded-full px-4 text-[12px] font-extrabold"
                    >
                        <Printer className="size-4" /> Cetak lembar (PDF)
                    </a>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
                {outlets.map((o) => (
                    <div key={o.code} className="break-inside-avoid rounded-2xl bg-white p-4">
                        <QrImage value={o.qr} className="mx-auto aspect-square w-full max-w-[140px]" />
                        <p className="mt-2 text-[12px] font-extrabold">
                            {o.code} <span className="text-ink/50 font-semibold">{o.area}</span>
                        </p>
                        <p className="text-ink/70 truncate text-[11px]">{o.name}</p>
                        <div className="mt-2 flex items-center justify-between">
                            <span
                                className={cn(
                                    'rounded-full px-2 py-0.5 text-[10px] font-extrabold',
                                    o.qr_used ? 'bg-lime' : 'bg-[#fff1d6] text-[#b07a12]',
                                )}
                            >
                                {o.qr_used ? 'Sudah dipakai' : 'Belum dipakai'}
                            </span>
                            <button
                                type="button"
                                onClick={() => downloadQr(o.qr, o.code)}
                                aria-label={`Unduh QR ${o.code}`}
                                className="text-ink/60 hover:text-ink print:hidden"
                            >
                                <Download className="size-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </AdminLayout>
    );
}
