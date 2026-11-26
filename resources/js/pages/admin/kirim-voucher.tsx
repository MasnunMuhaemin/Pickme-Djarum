import { Card, Chip, Empty, Phone, PillTabs, SearchInput, Table, Td, matches } from '@/features/admin/ui';
import AdminLayout from '@/layouts/admin-layout';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { useState } from 'react';

type Row = {
    id: number;
    name: string;
    whatsapp: string;
    partner: string;
    kind: string;
    value: string;
    code: string;
    sent_at: string | null;
    message: string;
    wa: string | null;
};

/** Kirim voucher mitra ke peserta lewat WhatsApp; status terkirim dicatat atas nama admin. */
export default function KirimVoucher({
    tab,
    counts,
    rows,
}: {
    tab: 'semua' | 'perlu' | 'sudah';
    counts: { perlu: number; sudah: number };
    rows: Row[];
}) {
    const [selectedId, setSelectedId] = useState<number | null>(rows[0]?.id ?? null);
    const selected = rows.find((r) => r.id === selectedId) ?? rows[0];
    const [q, setQ] = useState('');
    const shown = rows.filter((r) => matches(q, r.name, r.whatsapp, r.code, r.kind, r.partner));

    function send(row: Row) {
        if (row.wa) window.open(row.wa, '_blank', 'noopener');
        router.post(`/admin/kirim-voucher/${row.id}/terkirim`, {}, { preserveScroll: true });
    }

    return (
        <AdminLayout active="kirim-voucher" title="Pemenuhan" subtitle="Voucher mitra ke peserta lewat WhatsApp · yang sudah dikirim tetap tercatat">
            <PillTabs
                active={tab}
                tabs={[
                    { key: 'semua', label: `Semua (${counts.perlu + counts.sudah})`, href: '/admin/kirim-voucher' },
                    { key: 'perlu', label: 'Belum dikirim', href: '/admin/kirim-voucher?tab=perlu', count: counts.perlu },
                    { key: 'sudah', label: `Sudah dikirim (${counts.sudah})`, href: '/admin/kirim-voucher?tab=sudah' },
                ]}
            />

            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
                <Card>
                    <SearchInput value={q} onChange={setQ} placeholder="Cari nama, nomor, kode, atau voucher" className="mb-3" />
                    {shown.length ? (
                        <Table head={['Peserta', 'Voucher', 'Nilai', 'Kode', 'Status', 'Aksi']}>
                            {shown.map((row) => (
                                <tr
                                    key={row.id}
                                    onClick={() => setSelectedId(row.id)}
                                    className={cn('cursor-pointer', selected?.id === row.id && 'bg-lime-soft/50')}
                                >
                                    <Td>
                                        <p className="font-extrabold">{row.name}</p>
                                        <Phone value={row.whatsapp} className="text-ink/45 text-[10px]" />
                                    </Td>
                                    <Td>
                                        <p className="font-bold">{row.kind}</p>
                                        <p className="text-ink/45 text-[10px]">{row.partner}</p>
                                    </Td>
                                    <Td className="font-bold">{row.value}</Td>
                                    <Td className="font-mono font-bold">{row.code}</Td>
                                    <Td>
                                        {row.sent_at ? (
                                            <>
                                                <Chip tone="green">Sudah dikirim</Chip>
                                                <span className="text-ink/45 mt-0.5 block text-[10px]">{row.sent_at}</span>
                                            </>
                                        ) : (
                                            <Chip tone="yellow">Belum dikirim</Chip>
                                        )}
                                    </Td>
                                    <Td>
                                        {row.sent_at ? (
                                            <span className="text-ink/45 text-[11px]">Selesai</span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    send(row);
                                                }}
                                                className="bg-ink inline-flex h-8 items-center rounded-full px-3.5 text-[11px] font-bold whitespace-nowrap text-white"
                                            >
                                                Kirim WhatsApp
                                            </button>
                                        )}
                                    </Td>
                                </tr>
                            ))}
                        </Table>
                    ) : (
                        <Empty>
                            {tab === 'perlu'
                                ? 'Semua voucher sudah dikirim.'
                                : tab === 'sudah'
                                  ? 'Belum ada voucher yang dikirim.'
                                  : 'Belum ada voucher mitra.'}
                        </Empty>
                    )}
                </Card>

                <div className="space-y-3">
                    <Card title={`Pratinjau pesan${selected ? ` (${selected.name})` : ''}`}>
                        {selected ? (
                            <p className="rounded-xl bg-[#e7f7dc] p-3 text-[12px] leading-relaxed whitespace-pre-line">{selected.message}</p>
                        ) : (
                            <p className="text-ink/50 text-[12px]">Pilih baris untuk melihat pesannya.</p>
                        )}
                        <p className="text-ink/45 mt-3 text-[11px] leading-relaxed">
                            Tombol membuka WhatsApp dengan pesan ini sudah terisi. Status berubah ke Terkirim setelah admin menandai kirim, atas nama
                            akun.
                        </p>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
