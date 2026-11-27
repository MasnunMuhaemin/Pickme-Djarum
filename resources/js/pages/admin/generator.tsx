import { Btn, Modal } from '@/features/admin/ui';
import AdminLayout from '@/layouts/admin-layout';
import { cn } from '@/lib/utils';
import { Link, router, useForm } from '@inertiajs/react';
import { AlertTriangle, ArrowLeft, ArrowRight, Check, Download, FileText, KeyRound, LayoutGrid, Lock, Play, RotateCcw } from 'lucide-react';
import { useState } from 'react';

type Stock = { boards: number; slots: number; voucher: number; merch: number; limited: number; detail: Record<string, number> };
type Group = { from: string; to: string; boards: number; counts: { voucher: number; merch: number; limited: number } };
type Checks = { totalMatches: boolean; boards: number; outletsActive: number; outlets: number; qrTested: number };

const DETAIL_LABEL: Record<string, string> = { mitra: 'mitra', kuota: 'top up kuota', agregator: 'token', tunai: 'bensin' };
const KIND_DOT: Record<string, string> = { Voucher: 'bg-lime', Merchandise: 'bg-[#0b0b0b]', 'Limited edition': 'bg-[#f2b134]' };

function Card({ title, right, className, children }: { title: string; right?: React.ReactNode; className?: string; children: React.ReactNode }) {
    return (
        <section className={cn('rounded-2xl bg-white p-5', className)}>
            <div className="flex items-center justify-between gap-2">
                <h2 className="text-[14px] font-extrabold">{title}</h2>
                {right}
            </div>
            <div className="mt-3">{children}</div>
        </section>
    );
}

function Chip({ children, tone = 'lime' }: { children: React.ReactNode; tone?: 'lime' | 'cream' | 'dark' }) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold',
                tone === 'lime' && 'bg-lime-soft',
                tone === 'cream' && 'bg-[#fff1d6] text-[#7a5410]',
                tone === 'dark' && 'bg-lime text-ink',
            )}
        >
            {children}
        </span>
    );
}

/** Bar 25 kotak isi satu papan: voucher lime, merchandise hitam, limited edition oranye. */
function BoardBar({ counts }: { counts: Group['counts'] }) {
    const cells = [
        ...Array(counts.voucher).fill('bg-lime'),
        ...Array(counts.merch).fill('bg-[#0b0b0b]'),
        ...Array(counts.limited).fill('bg-[#f2b134]'),
    ];
    return (
        <span className="flex gap-0.5">
            {cells.map((c, i) => (
                <span key={i} className={cn('h-4 w-1.5 rounded-sm', c)} />
            ))}
        </span>
    );
}

/** Generator kode unik (desain): stok, pembagian, format, pemeriksaan, pratinjau, lalu jalankan sekali dan terkunci. */
export default function Generator({
    locked,
    runAt,
    stock,
    groups,
    checks,
    preview,
    result,
    emptyBoards,
    sampleCodes,
}: {
    locked: boolean;
    runAt: string | null;
    stock: Stock;
    groups: Group[];
    checks: Checks;
    preview: { board: string; position: string; kind: string; code: string }[];
    result: { slots: number; unique: number; duplicates: number };
    emptyBoards: string[];
    sampleCodes: string[];
}) {
    const [confirmOpen, setConfirmOpen] = useState(false);
    const form = useForm({ confirm: false });
    const total = stock.voucher + stock.merch + stock.limited;
    const voucherDetail = Object.entries(stock.detail)
        .map(([k, v]) => `${DETAIL_LABEL[k] ?? k} ${v}`)
        .join(' · ');
    const codes = sampleCodes.length ? sampleCodes : preview.slice(0, 3).map((p) => p.code);

    return (
        <AdminLayout
            active="md-generator"
            title="Generator kode unik"
            subtitle={`Membuat kode hadiah 6 karakter untuk papan ${stock.boards} warung. Dibuat sekali, tidak ada pembuatan ulang selama program.`}
        >
            <div className="-mt-2 mb-4 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <Link
                        href="/admin/master-data/area"
                        className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[12px] font-bold"
                    >
                        <ArrowLeft className="size-3.5" /> Master data
                    </Link>
                    {locked ? (
                        <Chip tone="dark">
                            <Lock className="size-3" /> Sudah dijalankan · terkunci
                        </Chip>
                    ) : (
                        <Chip tone="cream">Belum dijalankan</Chip>
                    )}
                </div>
                {locked ? (
                    <div className="flex gap-2">
                        <Link
                            href="/admin/cetak-voucher"
                            className="bg-lime flex h-9 items-center gap-1.5 rounded-full px-4 text-[12px] font-extrabold"
                        >
                            <ArrowRight className="size-4" /> Lanjut: cetak voucher
                        </Link>
                        <span className="bg-ink/10 text-ink/45 flex h-9 items-center gap-1.5 rounded-full px-4 text-[12px] font-extrabold">
                            <Lock className="size-4" /> Generator terkunci
                        </span>
                    </div>
                ) : (
                    <Btn variant="yellow" className="h-9 rounded-full" onClick={() => setConfirmOpen(true)}>
                        <Play className="size-4" /> Jalankan generator
                    </Btn>
                )}
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <div className="space-y-4">
                    <Card
                        title={locked ? 'Isi papan' : 'Stok dari master data'}
                        right={<Chip tone={locked ? 'cream' : 'lime'}>{locked ? 'Terkunci' : 'Otomatis'}</Chip>}
                    >
                        <div className="grid grid-cols-3 gap-2">
                            {(
                                [
                                    ['Voucher', stock.voucher, locked ? 'termasuk token, bensin, kuota' : voucherDetail, 'bg-lime'],
                                    ['Merchandise', stock.merch, 'ambil di papan', 'bg-[#0b0b0b]'],
                                    [
                                        'Limited edition',
                                        stock.limited,
                                        `${stock.boards ? Math.round(stock.limited / stock.boards) : 0} per papan`,
                                        'bg-[#f2b134]',
                                    ],
                                ] as const
                            ).map(([label, value, hint, dot]) => (
                                <div key={label} className="bg-cream rounded-xl p-3">
                                    <p className="flex items-center gap-1.5 text-[11px] font-bold">
                                        <span className={cn('size-2 rounded-full', dot)} /> {label}
                                    </p>
                                    <p className="mt-1 text-[26px] leading-none font-extrabold">{value}</p>
                                    <p className="text-ink/50 mt-1 text-[10px] leading-snug">{hint}</p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[12px]">
                            <span className="font-extrabold">
                                Total {total} hadiah = {stock.voucher} + {stock.merch} + {stock.limited}
                            </span>
                            <span className="text-ink/50">{stock.boards} papan × 25 hadiah</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[11px]">
                            <span className="text-ink/60">Ikuti stok di master data</span>
                            <Link href="/admin/master-data/isi-papan" className="font-extrabold underline">
                                Ubah jumlah di Master data
                            </Link>
                        </div>
                    </Card>

                    <Card
                        title="Pembagian per papan"
                        right={<Chip tone={locked ? 'lime' : 'cream'}>{locked ? 'Isi sebenarnya' : 'Usulan otomatis'}</Chip>}
                    >
                        <div className="space-y-3">
                            {groups.map((g) => (
                                <div key={g.from} className="flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                        <p className="text-[12px] font-extrabold">
                                            {g.from === g.to ? g.from : `${g.from}–${g.to}`} · {g.boards} papan
                                        </p>
                                        <p className="text-ink/55 text-[11px]">
                                            {g.counts.voucher} voucher + {g.counts.merch} merchandise + {g.counts.limited} limited edition
                                        </p>
                                    </div>
                                    <BoardBar counts={g.counts} />
                                </div>
                            ))}
                            {groups.length === 0 && <p className="text-ink/50 text-[12px]">Belum ada papan. Tambah warung dulu di menu Warung.</p>}
                        </div>
                    </Card>

                    <Card title="Format kode hadiah" right={<KeyRound className="text-ink/40 size-4" />}>
                        <dl className="space-y-2 text-[12px]">
                            {(
                                [
                                    ['Panjang', '6 karakter'],
                                    ['Karakter', 'Huruf dan angka, tanpa I, L, O, 0, 1 (31 karakter)'],
                                    ['Kemungkinan', '± 887 juta kombinasi'],
                                    ['Aturan', 'Tidak ada kode ganda di seluruh sistem, termasuk kode voucher'],
                                ] as const
                            ).map(([k, v]) => (
                                <div key={k} className="grid grid-cols-[100px_1fr] gap-2">
                                    <dt className="text-ink/55">{k}</dt>
                                    <dd className="font-bold">{v}</dd>
                                </div>
                            ))}
                        </dl>
                        <div className="mt-2 flex flex-wrap gap-1.5 sm:ml-[108px]">
                            {codes.map((c) => (
                                <span key={c} className="text-lime rounded-full bg-[#0b0b0b] px-3 py-1 font-mono text-[11px] font-extrabold">
                                    {c}
                                </span>
                            ))}
                        </div>
                    </Card>
                </div>

                <div className="space-y-4">
                    {locked ? (
                        <>
                            <section className="rounded-2xl bg-[#0b0b0b] p-5 text-white">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-[14px] font-extrabold">Hasil generator</h2>
                                    <Chip tone="dark">
                                        <Check className="size-3" strokeWidth={3} /> Berhasil
                                    </Chip>
                                </div>
                                <div className="mt-4 grid grid-cols-3 gap-2">
                                    {(
                                        [
                                            [result.slots, 'hadiah dibuat'],
                                            [result.unique, 'kode unik'],
                                            [result.duplicates, 'kode ganda'],
                                        ] as const
                                    ).map(([v, l]) => (
                                        <div key={l}>
                                            <p className="text-lime text-[36px] leading-none font-extrabold">{v}</p>
                                            <p className="mt-1 text-[11px] text-white/60">{l}</p>
                                        </div>
                                    ))}
                                </div>
                                <p className="mt-4 border-t border-white/10 pt-3 text-[11px] text-white/50">
                                    {stock.boards} papan × 25 hadiah = {stock.slots} · {stock.voucher} voucher + {stock.merch} merchandise +{' '}
                                    {stock.limited} limited edition{runAt ? ` · dijalankan ${runAt}` : ''}
                                </p>
                            </section>

                            <Card title="Export untuk dicetak">
                                <p className="text-ink/55 -mt-2 text-[11px]">Daftar kode dibaca admin saja. Simpan dengan aman.</p>
                                <div className="mt-3 space-y-2">
                                    <a
                                        href="/admin/cetak-voucher/ekspor"
                                        className="bg-lime flex h-10 items-center justify-center gap-1.5 rounded-full text-[12px] font-extrabold"
                                    >
                                        <Download className="size-4" /> Export CSV · {result.slots} baris
                                    </a>
                                    <a
                                        href="/admin/generator/cetak"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="border-ink flex h-10 items-center justify-center gap-1.5 rounded-full border-2 text-[12px] font-extrabold"
                                    >
                                        <FileText className="size-4" /> Daftar cetak PDF · {stock.boards} halaman, 1 per papan
                                    </a>
                                    <Link
                                        href="/admin/cetak-voucher"
                                        className="border-ink flex h-10 items-center justify-center gap-1.5 rounded-full border-2 text-[12px] font-extrabold"
                                    >
                                        <LayoutGrid className="size-4" /> Export satu papan saja
                                    </Link>
                                </div>
                            </Card>

                            {emptyBoards.length > 0 && (
                                <Card title="Papan baru belum terisi">
                                    <p className="text-ink/60 text-[12px]">
                                        {emptyBoards.join(', ')} ditambahkan setelah generator dijalankan. Isi dari sisa stok master data.
                                    </p>
                                    <Btn
                                        variant="yellow"
                                        className="mt-3 rounded-full"
                                        onClick={() => router.post('/admin/generator/isi', {}, { preserveScroll: true })}
                                    >
                                        Isi papan baru
                                    </Btn>
                                </Card>
                            )}

                            <section className="rounded-2xl border border-[#f2d98a] bg-[#fff6dc] p-5">
                                <h2 className="flex items-center gap-2 text-[14px] font-extrabold">
                                    <Lock className="size-4" /> Terkunci
                                </h2>
                                <p className="mt-2 text-[12px] leading-relaxed text-[#7a5410]">
                                    Hadiah dan kode dibuat sekali dan tidak pernah dibuat ulang selama program. Papan tidak diisi ulang. Tombol jalankan
                                    tidak tersedia lagi.
                                </p>
                            </section>
                        </>
                    ) : (
                        <>
                            <Card title="Pemeriksaan sebelum jalan">
                                <ul className="space-y-2 text-[12px]">
                                    {(
                                        [
                                            [checks.totalMatches, `Total ${stock.slots} = ${stock.voucher} + ${stock.merch} + ${stock.limited}`],
                                            [checks.boards > 0, `${checks.boards} papan × 25 hadiah = ${stock.slots} slot`],
                                            [true, 'Kode dibuat unik, dicek tanpa ganda saat jalan'],
                                            [
                                                checks.outletsActive === checks.outlets && checks.outlets > 0,
                                                `${checks.outletsActive} warung aktif, tiap warung punya QR`,
                                            ],
                                            [
                                                checks.qrTested === checks.outlets && checks.outlets > 0,
                                                `Uji scan QR: ${checks.qrTested} dari ${checks.outlets} lolos`,
                                            ],
                                        ] as const
                                    ).map(([ok, text]) => (
                                        <li key={text} className="flex items-center gap-2">
                                            {ok ? (
                                                <span className="bg-lime grid size-5 place-items-center rounded-full">
                                                    <Check className="size-3" strokeWidth={3} />
                                                </span>
                                            ) : (
                                                <AlertTriangle className="size-5 text-[#d08a12]" />
                                            )}
                                            <span className={cn(!ok && 'font-bold')}>{text}</span>
                                        </li>
                                    ))}
                                </ul>
                                <p className="text-ink/45 mt-2 text-[10px]">
                                    Sebaiknya semua QR lolos uji scan sebelum papan dicetak: scan QR tiap warung dengan HP yang sedang masuk sebagai
                                    admin.
                                </p>
                            </Card>

                            <Card
                                title="Pratinjau"
                                right={
                                    <button
                                        type="button"
                                        onClick={() => router.reload({ only: ['preview'] })}
                                        className="border-ink flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-[11px] font-extrabold"
                                    >
                                        <RotateCcw className="size-3.5" /> Acak ulang
                                    </button>
                                }
                            >
                                <p className="text-ink/50 -mt-2 text-[11px]">7 baris pertama · belum disimpan</p>
                                <div className="mt-2 overflow-x-auto">
                                    <table className="w-full min-w-[420px] text-[12px]">
                                    <thead>
                                        <tr className="text-ink/50 text-left text-[11px]">
                                            <th className="py-1.5 font-semibold">Papan</th>
                                            <th className="py-1.5 font-semibold">Posisi</th>
                                            <th className="py-1.5 font-semibold">Jenis</th>
                                            <th className="py-1.5 font-semibold">Kode</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-ink/5 divide-y">
                                        {preview.map((p) => (
                                            <tr key={p.position}>
                                                <td className="py-1.5 font-extrabold">{p.board}</td>
                                                <td className="py-1.5">{p.position}</td>
                                                <td className="py-1.5">
                                                    <span className="flex items-center gap-1.5">
                                                        <span className={cn('size-2 rounded-full', KIND_DOT[p.kind])} /> {p.kind}
                                                    </span>
                                                </td>
                                                <td className="py-1.5 font-mono font-extrabold">{p.code}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    </table>
                                </div>
                            </Card>

                            <Card title="Export" right={<Chip tone="cream">Aktif setelah generator jalan</Chip>}>
                                <div className="grid grid-cols-2 gap-2 opacity-50">
                                    <span className="bg-lime-soft flex h-10 items-center justify-center gap-1.5 rounded-full text-[12px] font-extrabold">
                                        <Download className="size-4" /> Export CSV
                                    </span>
                                    <span className="bg-lime-soft flex h-10 items-center justify-center gap-1.5 rounded-full text-[12px] font-extrabold">
                                        <FileText className="size-4" /> Daftar cetak (PDF)
                                    </span>
                                </div>
                            </Card>
                        </>
                    )}
                </div>
            </div>

            <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)}>
                <div className="flex items-center gap-3 pr-8">
                    <span className="bg-lime grid size-10 shrink-0 place-items-center rounded-full">
                        <Play className="size-5" />
                    </span>
                    <h2 className="text-[17px] font-extrabold">Jalankan generator?</h2>
                </div>
                <p className="text-ink/60 mt-2 text-[12px] leading-relaxed">
                    Sistem membuat {stock.slots} hadiah dan {stock.slots} kode unik di {stock.boards} papan. Setelah dijalankan, tidak bisa diulang dan
                    papan tidak diisi ulang.
                </p>
                <dl className="bg-cream mt-3 divide-y divide-[#ece6cc] rounded-xl px-4 py-1 text-[12px]">
                    {(
                        [
                            ['Voucher', stock.voucher],
                            ['Merchandise', stock.merch],
                            ['Limited edition', stock.limited],
                            ['Papan', `${stock.boards} × 25 hadiah = ${stock.slots}`],
                        ] as const
                    ).map(([k, v]) => (
                        <div key={k} className="flex justify-between py-2">
                            <dt className="text-ink/60">{k}</dt>
                            <dd className="font-extrabold">{v}</dd>
                        </div>
                    ))}
                </dl>
                {checks.qrTested < checks.outlets && (
                    <p className="mt-3 flex items-center gap-2 rounded-xl bg-[#fff1d6] px-3 py-2.5 text-[12px] text-[#7a5410]">
                        <AlertTriangle className="size-4 shrink-0" /> Uji scan QR baru {checks.qrTested} dari {checks.outlets} lolos.
                    </p>
                )}
                {!checks.totalMatches && (
                    <p className="mt-2 rounded-xl bg-[#fde0dc] px-3 py-2.5 text-[12px] font-bold text-[#b42318]">
                        Total stok ({total}) belum sama dengan {stock.slots} hadiah. Merchandise dan limited edition dibagi dulu, hadiah lainnya diisi
                        voucher acak berbobot jumlah tiap jenis.
                    </p>
                )}
                <label className="mt-3 flex items-center gap-2 text-[12px] font-bold">
                    <input
                        type="checkbox"
                        checked={form.data.confirm}
                        onChange={(e) => form.setData('confirm', e.target.checked)}
                        className="accent-lime-dark size-4"
                    />
                    Saya sudah memeriksa stok dan {checks.outlets} warung.
                </label>
                {form.errors.confirm && <p className="mt-1 text-[11px] font-semibold text-[#b42318]">{form.errors.confirm}</p>}
                <div className="mt-4 grid grid-cols-[1fr_2fr] gap-2">
                    <Btn variant="outline" className="h-10 justify-center rounded-full border-2" onClick={() => setConfirmOpen(false)}>
                        Batal
                    </Btn>
                    <Btn
                        variant="yellow"
                        className="h-10 justify-center rounded-full"
                        disabled={!form.data.confirm || form.processing}
                        onClick={() => form.post('/admin/generator/jalankan', { preserveScroll: true, onSuccess: () => setConfirmOpen(false) })}
                    >
                        <Play className="size-4" /> Jalankan generator
                    </Btn>
                </div>
            </Modal>
        </AdminLayout>
    );
}
