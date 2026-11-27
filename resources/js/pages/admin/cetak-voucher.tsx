import AdminLayout from '@/layouts/admin-layout';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import { ArrowLeft, Check, Download, Hash, Image, Layers } from 'lucide-react';

type Row = { code: string; name: string; vouchers: number; merch: number };

const STEPS: { title: string; who: string; text: string }[] = [
    { title: 'Generate isi papan', who: 'Admin', text: 'Isi papan dibuat sistem saat warung ditambahkan. Kode unik tiap hadiah terkunci per papan.' },
    { title: 'Ekspor kode dan QR', who: 'Admin', text: 'Ekspor kode unik per papan (CSV) dan QR warung, lalu serahkan ke tim cetak.' },
    { title: 'Cetak voucher', who: 'Tim', text: 'Cetak sesuai file ekspor, satu voucher per hadiah. Kode tercetak di kotak KODE UNIK.' },
    { title: 'Masukkan ke plastik', who: 'Tim', text: 'Voucher masuk plastik. Merchandise kecil ikut dimasukkan sesuai kolom isi plastik.' },
    { title: 'Tempel ke papan', who: 'Tim', text: 'Plastik ditempel urut di papan, sesuai posisi hadiah (A1 sampai E5) di file ekspor.' },
];

function Stat({ label, value, hint, icon: Icon, tone }: { label: string; value: string | number; hint: string; icon: LucideIcon; tone: string }) {
    return (
        <div className="flex items-start justify-between gap-2 rounded-2xl bg-white p-4">
            <div>
                <p className="text-ink/55 text-[11px] font-semibold">{label}</p>
                <p className="mt-1 text-[24px] leading-none font-extrabold">{value}</p>
                <p className="text-ink/45 mt-1 text-[10px]">{hint}</p>
            </div>
            <span className={cn('grid size-10 place-items-center rounded-full', tone)}>
                <Icon className="size-5" />
            </span>
        </div>
    );
}

/** Cetak voucher (desain): alur cetak dan pasang, bentuk voucher, dan ekspor kode unik per papan. */
export default function CetakVoucher({ outlets, totalCodes, lastExport }: { outlets: Row[]; totalCodes: number; lastExport: string | null }) {
    return (
        <AdminLayout
            active="md-warung"
            title="Cetak voucher"
            subtitle="Ekspor kode unik per papan untuk dicetak tim. Satu voucher = satu hadiah = satu kode di kotak KODE UNIK."
        >
            <div className="-mt-2 mb-4 flex flex-wrap items-center justify-between gap-2">
                <Link href="/admin/master-data/warung" className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[12px] font-bold">
                    <ArrowLeft className="size-3.5" /> Semua warung
                </Link>
                <div className="flex gap-2">
                    <Link
                        href="/admin/master-data/warung/qr"
                        className="border-ink flex h-9 items-center rounded-full border-2 bg-white px-4 text-[12px] font-extrabold"
                    >
                        Ekspor QR warung
                    </Link>
                    <a
                        href="/admin/cetak-voucher/ekspor"
                        className="bg-lime flex h-9 items-center gap-1.5 rounded-full px-4 text-[12px] font-extrabold"
                    >
                        <Download className="size-4" /> Ekspor semua kode (CSV)
                    </a>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                <Stat label="Kode unik siap" value={totalCodes} hint={`${outlets.length} papan × 25 hadiah`} icon={Hash} tone="bg-lime text-ink" />
                <Stat label="Voucher per papan" value={25} hint="satu kode per hadiah" icon={Layers} tone="bg-lime-soft text-ink" />
                <Stat label="Desain kartu" value={2} hint="depan dan belakang" icon={Image} tone="bg-lime-soft text-ink" />
                <Stat label="Terakhir diekspor" value={lastExport ?? 'Belum'} hint="ekspor kode unik" icon={Download} tone="bg-lime-soft text-ink" />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
                <div className="space-y-4">
                    <section className="rounded-2xl bg-white p-5">
                        <h2 className="text-[14px] font-extrabold">Alur cetak dan pasang</h2>
                        <p className="text-ink/50 text-[11px]">Lima langkah, urutannya sama untuk semua papan.</p>
                        <ol className="mt-3 space-y-3">
                            {STEPS.map((step, i) => (
                                <li key={step.title} className="flex gap-3">
                                    <span
                                        className={cn(
                                            'grid size-7 shrink-0 place-items-center rounded-full text-[12px] font-extrabold',
                                            i === 0 ? 'bg-lime' : 'border-ink/20 border-2',
                                        )}
                                    >
                                        {i === 0 ? <Check className="size-4" strokeWidth={3} /> : i + 1}
                                    </span>
                                    <span>
                                        <span className="flex items-center gap-2 text-[12px] font-extrabold">
                                            {step.title}
                                            <span
                                                className={cn(
                                                    'rounded-full px-2 py-0.5 text-[9px]',
                                                    step.who === 'Admin' ? 'bg-lime-soft' : 'bg-[#fff1d6]',
                                                )}
                                            >
                                                {step.who}
                                            </span>
                                        </span>
                                        <span className="text-ink/55 block text-[11px] leading-snug">{step.text}</span>
                                    </span>
                                </li>
                            ))}
                        </ol>
                    </section>
                    <section className="rounded-2xl bg-white p-5">
                        <h2 className="text-[14px] font-extrabold">Bentuk voucher</h2>
                        <p className="text-ink/60 mt-1 text-[11px] leading-relaxed">
                            Dua desain kartu, masing-masing ada depan dan belakang. Depan: gambar, logo PAPAN PICK(ME), kotak KODE UNIK. Belakang:
                            cara menukar voucher.
                        </p>
                    </section>
                </div>

                <section className="rounded-2xl bg-white p-5">
                    <h2 className="text-[14px] font-extrabold">Ekspor per papan</h2>
                    <p className="text-ink/50 text-[11px]">Satu file per papan: 25 baris, urut A1 sampai E5.</p>
                    <div className="mt-3 overflow-x-auto">
                        <table className="w-full min-w-[560px] text-[12px]">
                        <thead>
                            <tr className="text-ink/50 text-left text-[11px]">
                                <th className="py-2 font-semibold">Titik</th>
                                <th className="py-2 font-semibold">Nama warung</th>
                                <th className="py-2 font-semibold">Voucher · Merch</th>
                                <th className="py-2 text-right font-semibold">File</th>
                            </tr>
                        </thead>
                        <tbody className="divide-ink/5 divide-y">
                            {outlets.map((o) => (
                                <tr key={o.code}>
                                    <td className="py-2 font-extrabold">{o.code}</td>
                                    <td className="py-2">{o.name}</td>
                                    <td className="text-ink/60 py-2">
                                        {o.vouchers} · {o.merch}
                                    </td>
                                    <td className="py-2 text-right">
                                        <span className="inline-flex gap-2">
                                            <Link
                                                href={`/admin/papan/${o.code}/pasang`}
                                                className="rounded-full bg-white px-2 py-0.5 text-[10px] font-extrabold underline"
                                            >
                                                Panduan pasang
                                            </Link>
                                            <a
                                                href={`/admin/cetak-voucher/ekspor?titik=${o.code}`}
                                                className="border-ink/20 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold"
                                            >
                                                <Download className="size-3" /> Ekspor CSV
                                            </a>
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        </table>
                    </div>
                    <p className="text-ink/45 mt-3 text-[10px]">Kolom file: Titik, Nama warung, Hadiah, Kode unik, Isi papan.</p>
                </section>
            </div>
        </AdminLayout>
    );
}
