import { Card, Chip, Empty, PillTabs, Table, Td } from '@/features/admin/ui';
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
export default function KirimVoucher({ tab, counts, rows }: { tab: 'perlu' | 'sudah'; counts: { perlu: number }; rows: Row[] }) {
    const [selectedId, setSelectedId] = useState<number | null>(rows[0]?.id ?? null);
    const selected = rows.find((r) => r.id === selectedId) ?? rows[0];

    function send(row: Row) {
        if (row.wa) window.open(row.wa, '_blank', 'noopener');
        router.post(`/admin/kirim-voucher/${row.id}/terkirim`, {}, { preserveScroll: true });
    }

    return (
        <AdminLayout active="kirim-voucher" title="Kirim voucher" subtitle="Voucher mitra yang menunggu dikirim ke peserta lewat WhatsApp">
            <PillTabs
                active={tab}
                tabs={[
                    { key: 'perlu', label: 'Perlu dikirim', href: '/admin/kirim-voucher', count: counts.perlu },
                    { key: 'sudah', label: 'Sudah dikirim', href: '/admin/kirim-voucher?tab=sudah' },
                ]}
            />

            <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
                <Card>
                    {rows.length ? (
                        <Table head={['Peserta', 'Voucher', 'Nilai', 'Kode', 'Status', 'Aksi']}>
                            {rows.map((row) => (
                                <tr
                                    key={row.id}
                                    onClick={() => setSelectedId(row.id)}
                                    className={cn('cursor-pointer', selected?.id === row.id && 'bg-[#fffbd6]')}
                                >
                                    <Td>
                                        <p className="font-extrabold">{row.name}</p>
                                        <p className="text-[10px] text-black/45">{row.whatsapp}</p>
                                    </Td>
                                    <Td>
                                        <p className="font-bold">{row.kind}</p>
                                        <p className="text-[10px] text-black/45">{row.partner}</p>
                                    </Td>
                                    <Td className="font-bold">{row.value}</Td>
                                    <Td className="font-mono font-bold">{row.code}</Td>
                                    <Td>
                                        {row.sent_at ? <Chip tone="green">Terkirim {row.sent_at}</Chip> : <Chip tone="yellow">Perlu dikirim</Chip>}
                                    </Td>
                                    <Td>
                                        {!row.sent_at && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    send(row);
                                                }}
                                                className="inline-flex h-8 items-center rounded-full bg-black px-3.5 text-[11px] font-bold text-white"
                                            >
                                                Kirim WhatsApp
                                            </button>
                                        )}
                                    </Td>
                                </tr>
                            ))}
                        </Table>
                    ) : (
                        <Empty>{tab === 'perlu' ? 'Semua voucher sudah dikirim.' : 'Belum ada voucher yang dikirim.'}</Empty>
                    )}
                </Card>

                <div className="space-y-3">
                    <Card title={`Pratinjau pesan${selected ? ` (${selected.name})` : ''}`}>
                        {selected ? (
                            <p className="rounded-xl bg-[#e7f7dc] p-3 text-[12px] leading-relaxed whitespace-pre-line">{selected.message}</p>
                        ) : (
                            <p className="text-[12px] text-black/50">Pilih baris untuk melihat pesannya.</p>
                        )}
                        <p className="mt-3 text-[11px] leading-relaxed text-black/45">
                            Tombol membuka WhatsApp dengan pesan ini sudah terisi. Status berubah ke Terkirim setelah admin menandai kirim, atas nama
                            akun.
                        </p>
                    </Card>
                    <Card>
                        <Chip tone="yellow">[Konfirmasi: kanal voucher]</Chip>
                        <p className="mt-2 text-[11px] leading-relaxed text-black/55">
                            Prototype ini mengirim voucher lewat WhatsApp dan menampilkan kode di webapp. PRD FR-14 sama: kode tampil di halaman
                            Hadiahku peserta. Pilih salah satu kanal utama.
                        </p>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
