import { Eyebrow, PartnerPage } from '@/features/partner/partner-page';
import { PayoutBadge, type Week } from '@/pages/partner/rekap';
import { Link } from '@inertiajs/react';

type Row = { code: string; title: string; value: string; holder: string; at: string; has_photo: boolean; kuota: boolean };

/** Rincian satu minggu: ringkasan, status pembayaran (minggu lalu), dan daftar penukaran. */
export default function RekapMinggu({ week, rows }: { week: Week; rows: Row[] }) {
    const isCurrent = week.status === 'berjalan';

    return (
        <PartnerPage title={isCurrent ? 'Rincian minggu ini' : week.label} back="/mitra/rekap" nav="rekap">
            <div className="grid grid-cols-3 gap-2 rounded-3xl bg-white p-4">
                <div>
                    <Eyebrow className="text-ink-soft">Voucher</Eyebrow>
                    <p className="mt-1 text-[18px] font-extrabold">{week.count}</p>
                </div>
                <div>
                    <Eyebrow className="text-ink-soft">Nilai</Eyebrow>
                    <p className="mt-1 text-[18px] font-extrabold">{week.value}</p>
                </div>
                <div>
                    <Eyebrow className="text-ink-soft">Foto bukti</Eyebrow>
                    <p className="mt-1 text-[18px] font-extrabold">
                        {week.photos} dari {week.redeemed}
                    </p>
                </div>
            </div>

            {!isCurrent && (
                <>
                    <h2 className="mt-5 text-[13px] font-extrabold">Status pembayaran</h2>
                    <div className="mt-2 rounded-3xl bg-white p-4">
                        <PayoutBadge status={week.status} />
                        {week.status === 'dibayar' ? (
                            <dl className="mt-3 grid grid-cols-[7rem_1fr] gap-y-2 text-[13px]">
                                <dt className="text-ink-soft">Tanggal bayar</dt>
                                <dd className="font-extrabold">{week.paid_at ?? '-'}</dd>
                                <dt className="text-ink-soft">Bukti bayar</dt>
                                <dd className="font-extrabold break-words">{week.proof ?? 'Tercatat oleh admin'}</dd>
                            </dl>
                        ) : (
                            <p className="text-ink-soft mt-2 text-[12px] leading-relaxed">
                                Admin membayar di luar aplikasi. Tanggal dan bukti bayar akan tampil di sini.
                            </p>
                        )}
                    </div>
                </>
            )}

            <h2 className="mt-5 text-[13px] font-extrabold">Penukaran</h2>
            {rows.length === 0 ? (
                <p className="text-ink-soft mt-2 rounded-2xl bg-white p-4 text-center text-[12px]">Belum ada penukaran di minggu ini.</p>
            ) : (
                <div className="mt-2 divide-y divide-[#efe7c8] rounded-3xl bg-white px-4">
                    {rows.map((row) => (
                        <Link key={row.code} href={`/mitra/tukar/${row.code}`} className="flex items-start justify-between gap-3 py-3">
                            <div className="min-w-0">
                                <p className="text-[15px] font-extrabold">{row.holder}</p>
                                <p className="text-ink-soft text-[12px]">
                                    {row.code} · {row.at} ·{' '}
                                    {row.kuota ? 'Top up' : row.has_photo ? 'Foto ada' : <span className="text-danger font-bold">Belum foto</span>}
                                </p>
                            </div>
                            <span className="shrink-0 text-[15px] font-extrabold">{row.value}</span>
                        </Link>
                    ))}
                </div>
            )}
            {rows.length > 0 && (
                <p className="text-ink-soft mt-2 text-center text-[12px]">
                    Menampilkan {rows.length} dari {Math.max(week.count, rows.length)} penukaran
                </p>
            )}
        </PartnerPage>
    );
}
