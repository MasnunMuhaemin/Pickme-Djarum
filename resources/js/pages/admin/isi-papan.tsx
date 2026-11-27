import { Btn, FieldError, TextInput, rupiah } from '@/features/admin/ui';
import AdminLayout from '@/layouts/admin-layout';
import { cn } from '@/lib/utils';
import { Link, useForm } from '@inertiajs/react';
import { AlertTriangle, ArrowRight, Check } from 'lucide-react';

type Stock = { boards: number; slots: number; voucher: number; merch: number; limited: number };
type Type = { id: number; name: string; partner: string | null; fulfillment: string; value: number; quantity: number; placed: number };

const FULFILLMENT: Record<string, string> = { mitra: 'Tukar di mitra', kuota: 'Top up kuota', agregator: 'Token listrik', tunai: 'Bensin tunai' };

/** Ubah isi papan (desain): jumlah hadiah yang dibagi generator ke semua papan. Total harus = papan × 25. */
export default function IsiPapan({
    stock,
    locked,
    placed,
    types,
}: {
    stock: Stock;
    locked: boolean;
    placed: { merch: number; limited: number };
    types: Type[];
}) {
    const form = useForm({
        merch: String(stock.merch),
        limited: String(stock.limited),
        quantities: Object.fromEntries(types.map((t) => [t.id, String(t.quantity)])) as Record<number, string>,
    });
    const voucher = Object.values(form.data.quantities).reduce((sum, v) => sum + (Number(v) || 0), 0);
    const total = voucher + (Number(form.data.merch) || 0) + (Number(form.data.limited) || 0);
    const diff = total - stock.slots;

    return (
        <AdminLayout active="md-isi" title="Ubah isi papan" subtitle="Jumlah hadiah yang dibagi generator ke semua papan">
            {locked && (
                <p className="mb-4 flex items-center gap-2 rounded-xl bg-[#fff1d6] px-4 py-3 text-[12px] text-[#7a5410]">
                    <AlertTriangle className="size-4 shrink-0" /> Generator sudah dijalankan. Papan yang sudah berisi tidak berubah; jumlah baru hanya
                    dipakai untuk papan warung baru.
                </p>
            )}
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
                <section className="rounded-2xl bg-white p-5">
                    <h2 className="text-[14px] font-extrabold">Voucher per jenis</h2>
                    <div className="overflow-x-auto">
                        <table className="mt-3 w-full min-w-[560px] text-[12px]">
                            <thead>
                                <tr className="text-ink/50 text-left text-[11px]">
                                    <th className="py-2 font-semibold">Jenis voucher</th>
                                    <th className="py-2 font-semibold">Pemenuhan</th>
                                    <th className="py-2 font-semibold">Sudah di papan</th>
                                    <th className="py-2 text-right font-semibold">Jumlah</th>
                                </tr>
                            </thead>
                            <tbody className="divide-ink/5 divide-y">
                                {types.map((t) => (
                                    <tr key={t.id}>
                                        <td className="py-2">
                                            <span className="block font-extrabold">{t.name}</span>
                                            <span className="text-ink/50 text-[10px]">
                                                {t.partner ?? '-'} · {rupiah(t.value)}
                                            </span>
                                        </td>
                                        <td className="text-ink/60 py-2">{FULFILLMENT[t.fulfillment] ?? t.fulfillment}</td>
                                        <td className="py-2 tabular-nums">{t.placed}</td>
                                        <td className="py-2 text-right">
                                            <TextInput
                                                type="number"
                                                min={0}
                                                aria-label={`Jumlah ${t.name}`}
                                                value={form.data.quantities[t.id]}
                                                onChange={(e) => form.setData('quantities', { ...form.data.quantities, [t.id]: e.target.value })}
                                                className="ml-auto w-24 text-right"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="text-ink/45 mt-2 text-[10px]">
                        Jenis voucher baru ditambah di{' '}
                        <Link href="/admin/master-data/jenis-voucher" className="underline">
                            Jenis voucher
                        </Link>
                        .
                    </p>

                    <h2 className="mt-6 text-[14px] font-extrabold">Barang di papan</h2>
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {(
                            [
                                ['merch', 'Merchandise', placed.merch, 'Peserta isi alamat, admin kirim.'],
                                ['limited', 'Limited edition', placed.limited, 'Diambil langsung dari plastik hadiah.'],
                            ] as const
                        ).map(([key, label, done, hint]) => (
                            <label key={key} className="bg-cream block rounded-xl p-3 text-[12px] font-extrabold">
                                {label}
                                <TextInput
                                    type="number"
                                    min={0}
                                    value={form.data[key]}
                                    onChange={(e) => form.setData(key, e.target.value)}
                                    className="mt-1"
                                />
                                <span className="text-ink/50 mt-1 block text-[10px] font-normal">
                                    {hint} Sudah di papan: {done}.
                                </span>
                                <FieldError message={form.errors[key]} />
                            </label>
                        ))}
                    </div>
                </section>

                <aside className="h-fit rounded-2xl bg-[#0b0b0b] p-5 text-white xl:sticky xl:top-4">
                    <h2 className="text-[14px] font-extrabold">Ringkasan</h2>
                    <dl className="mt-3 space-y-2 text-[12px]">
                        {(
                            [
                                ['Voucher', voucher],
                                ['Merchandise', Number(form.data.merch) || 0],
                                ['Limited edition', Number(form.data.limited) || 0],
                            ] as const
                        ).map(([k, v]) => (
                            <div key={k} className="flex justify-between">
                                <dt className="text-white/60">{k}</dt>
                                <dd className="font-extrabold tabular-nums">{v}</dd>
                            </div>
                        ))}
                        <div className="flex justify-between border-t border-white/10 pt-2">
                            <dt className="text-white/60">Total</dt>
                            <dd className="text-lime text-[18px] font-extrabold tabular-nums">{total}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-white/60">Hadiah papan</dt>
                            <dd className="font-extrabold tabular-nums">
                                {stock.boards} × 25 = {stock.slots}
                            </dd>
                        </div>
                    </dl>
                    <p
                        className={cn(
                            'mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-bold',
                            diff === 0 ? 'bg-lime text-ink' : 'bg-[#fff1d6] text-[#7a5410]',
                        )}
                    >
                        {diff === 0 ? <Check className="size-4" strokeWidth={3} /> : <AlertTriangle className="size-4" />}
                        {diff === 0
                            ? 'Pas dengan jumlah hadiah.'
                            : diff > 0
                              ? `Lebih ${diff} dari jumlah hadiah.`
                              : `Kurang ${-diff}; sisa hadiah diisi voucher acak.`}
                    </p>
                    <Btn
                        variant="yellow"
                        className="mt-4 h-10 w-full justify-center rounded-full"
                        disabled={form.processing}
                        onClick={() => form.post('/admin/master-data/isi-papan', { preserveScroll: true })}
                    >
                        Simpan isi papan
                    </Btn>
                    <Link
                        href="/admin/generator"
                        className="mt-2 flex h-10 items-center justify-center gap-1.5 rounded-full border-2 border-white/30 text-[12px] font-extrabold"
                    >
                        Generator kode <ArrowRight className="size-4" />
                    </Link>
                </aside>
            </div>
        </AdminLayout>
    );
}
