import AdminLayout from '@/layouts/admin-layout';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, Check, KeyRound, LayoutGrid, Lock, MapPin, QrCode, Store, Tag } from 'lucide-react';

type Stock = { boards: number; slots: number; voucher: number; merch: number; limited: number };
type Counts = { areas: number; types: number; partners: number; outlets: number; qrTested: number; slots: number };

function Step({
    n,
    icon: Icon,
    title,
    text,
    stat,
    href,
    done,
}: {
    n: number;
    icon: LucideIcon;
    title: string;
    text: string;
    stat: string;
    href: string;
    done: boolean;
}) {
    return (
        <Link href={href} className="group flex flex-col rounded-2xl bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
                <span className="bg-lime-soft grid size-11 place-items-center rounded-full">
                    <Icon className="size-5" />
                </span>
                <span
                    className={cn(
                        'flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold',
                        done ? 'bg-lime' : 'bg-[#fff1d6] text-[#7a5410]',
                    )}
                >
                    {done && <Check className="size-3" strokeWidth={3} />}
                    Langkah {n}
                </span>
            </div>
            <h2 className="mt-3 text-[15px] font-extrabold">{title}</h2>
            <p className="text-ink/55 mt-1 flex-1 text-[12px] leading-relaxed">{text}</p>
            <div className="border-ink/5 mt-4 flex items-center justify-between border-t pt-3">
                <span className="text-[12px] font-extrabold">{stat}</span>
                <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
            </div>
        </Link>
    );
}

/** Master data (desain): urutan menyiapkan program, dari area kos sampai generator kode dan QR warung. */
export default function MasterData({
    stock,
    counts,
    generatorRunAt,
    locked,
}: {
    stock: Stock;
    counts: Counts;
    generatorRunAt: string | null;
    locked: boolean;
}) {
    return (
        <AdminLayout active="md-hub" title="Master data" subtitle="Siapkan data program berurutan. Generator dijalankan sekali setelah semua siap.">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <Step
                    n={1}
                    icon={MapPin}
                    title="Area kos"
                    text="Daftar area kos dan pengantaran. Warung memilih area yang dicakup."
                    stat={`${counts.areas} area`}
                    href="/admin/master-data/area"
                    done={counts.areas > 0}
                />
                <Step
                    n={2}
                    icon={Store}
                    title="Mitra dan akun"
                    text="Mitra penukar voucher, mitra kuota, dan akun warung beserta PIN."
                    stat={`${counts.partners} mitra`}
                    href="/admin/master-data/mitra"
                    done={counts.partners > 0}
                />
                <Step
                    n={3}
                    icon={Tag}
                    title="Jenis hadiah"
                    text="Jenis voucher: mitra, nilai, jumlah, dan cara pemenuhan."
                    stat={`${counts.types} jenis voucher`}
                    href="/admin/master-data/jenis-voucher"
                    done={counts.types > 0}
                />
                <Step
                    n={4}
                    icon={LayoutGrid}
                    title="Warung dan isi papan"
                    text="Titik warung dengan papan 25 hadiah, lalu jumlah voucher, merchandise, dan limited edition."
                    stat={`${counts.outlets} warung · stok ${stock.voucher + stock.merch + stock.limited} untuk ${stock.slots} slot`}
                    href="/admin/master-data/isi-papan"
                    done={counts.outlets > 0 && stock.voucher + stock.merch + stock.limited === stock.slots}
                />
                <Step
                    n={5}
                    icon={KeyRound}
                    title="Generator kode unik"
                    text="Membuat hadiah dan kode 6 karakter untuk semua papan. Sekali jalan, lalu terkunci."
                    stat={locked ? `Terkunci · ${counts.slots} hadiah${generatorRunAt ? ` · ${generatorRunAt}` : ''}` : 'Belum dijalankan'}
                    href="/admin/generator"
                    done={locked}
                />
                <Step
                    n={6}
                    icon={QrCode}
                    title="QR warung"
                    text="Unduh atau cetak QR tiap warung, lalu uji scan dengan HP yang masuk sebagai admin."
                    stat={`Uji scan ${counts.qrTested}/${counts.outlets} lolos`}
                    href="/admin/master-data/warung/qr"
                    done={counts.outlets > 0 && counts.qrTested === counts.outlets}
                />
            </div>
            {locked && (
                <p className="mt-4 flex items-center gap-2 rounded-xl bg-[#fff6dc] px-4 py-3 text-[12px] text-[#7a5410]">
                    <Lock className="size-4 shrink-0" /> Generator sudah dijalankan. Papan yang sudah berisi tidak diisi ulang; warung baru diisi dari
                    sisa stok lewat Generator kode.
                </p>
            )}
        </AdminLayout>
    );
}
