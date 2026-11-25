import { downloadQr, QrImage } from '@/features/admin/qr';
import { Btn } from '@/features/admin/ui';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Download, Printer } from 'lucide-react';

type Slot = { position: string; code: string; prize: string; partner: string | null; status: string };

/**
 * Lembar cetak papan fisik: QR alamat titik di atas, lalu 25 slot dengan kode yang ditempel di balik slot dan isinya.
 * Kode slot rahasia: lembar ini hanya untuk tim yang membuat papan.
 */
export default function CetakPapan({ outlet, slots }: { outlet: { code: string; name: string; area: string | null; qr: string }; slots: Slot[] }) {
    return (
        <div className="bg-cream text-ink min-h-dvh py-8 print:bg-white print:py-0">
            <Head title={`Cetak papan ${outlet.code} · Admin`} />
            <div className="mx-auto max-w-[820px] px-6 print:max-w-none print:px-0">
                <div className="mb-4 flex items-center justify-between gap-3 print:hidden">
                    <Link
                        href={`/admin/papan?titik=${outlet.code}`}
                        className="text-ink/60 hover:text-ink flex items-center gap-1.5 text-[12px] font-bold"
                    >
                        <ArrowLeft className="size-4" />
                        Kembali ke Papan dan slot
                    </Link>
                    <div className="flex gap-2">
                        <Btn variant="outline" onClick={() => downloadQr(outlet.qr, outlet.code)}>
                            <Download className="size-3.5" />
                            Unduh QR
                        </Btn>
                        <Btn onClick={() => window.print()}>
                            <Printer className="size-3.5" />
                            Cetak
                        </Btn>
                    </div>
                </div>

                <div className="rounded-2xl bg-white p-8 print:rounded-none print:p-0">
                    <div className="border-ink/10 flex items-center gap-6 border-b pb-6">
                        <QrImage value={outlet.qr} className="size-44 shrink-0" />
                        <div>
                            <p className="text-ink/50 text-[12px] font-bold tracking-widest uppercase">PICK(ME) · Papan titik</p>
                            <p className="mt-1 text-[48px] leading-none font-black tracking-tight">{outlet.code}</p>
                            <p className="mt-2 text-[14px] font-bold">
                                {outlet.name}
                                {outlet.area ? ` · ${outlet.area}` : ''}
                            </p>
                            <p className="text-ink/60 mt-1 font-mono text-[12px]">{outlet.qr}</p>
                        </div>
                    </div>

                    <p className="mt-5 text-[11px] font-bold text-[#b42318]">
                        Rahasia: kode di bawah ditempel di balik slot fisik. Jangan dibagikan ke peserta.
                    </p>
                    <table className="mt-3 w-full text-left text-[12px]">
                        <thead>
                            <tr className="border-ink text-ink/60 border-b-2 text-[10px] font-bold">
                                <th className="py-2">Slot</th>
                                <th className="py-2">Kode di balik slot</th>
                                <th className="py-2">Isi</th>
                                <th className="py-2">Tukar di</th>
                            </tr>
                        </thead>
                        <tbody>
                            {slots.map((slot) => (
                                <tr key={slot.position} className="border-ink/10 border-b">
                                    <td className="py-1.5 font-extrabold">{slot.position}</td>
                                    <td className="py-1.5 font-mono text-[14px] font-bold tracking-[0.2em]">{slot.code}</td>
                                    <td className="py-1.5">{slot.prize}</td>
                                    <td className="text-ink/60 py-1.5">{slot.partner ?? '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
