import { Btn, Card, Chip, Empty, Modal, PillTabs, SearchInput, Table, Td, matches } from '@/features/admin/ui';
import AdminLayout from '@/layouts/admin-layout';
import { useForm } from '@inertiajs/react';
import { useState } from 'react';

type Row = {
    rank: number;
    name: string;
    outlet: string | null;
    caps: number;
    flagged: number;
    golden: boolean;
    merch: boolean;
    golden_status: string | null;
};

/** Peringkat total program dan minggu ini; admin menutup peringkat sebelum Laga Kosan dimulai. */
export default function Peringkat({ tab, rows, closedAt }: { tab: 'total' | 'minggu'; rows: Row[]; closedAt: string | null }) {
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState('');
    const form = useForm({ confirm: false });

    return (
        <AdminLayout active="peringkat" title="Peringkat" subtitle="Cap terbanyak dari klaim yang disetujui">
            <PillTabs
                active={tab}
                tabs={[
                    { key: 'total', label: 'Total program', href: '/admin/peringkat' },
                    { key: 'minggu', label: 'Minggu ini', href: '/admin/peringkat?tab=minggu' },
                ]}
            />

            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
                <Card>
                    <SearchInput value={q} onChange={setQ} placeholder="Cari nama peserta atau titik" className="mb-3" />
                    {rows.length ? (
                        <Table head={['#', 'Peserta', 'Titik', 'Cap', 'Foto', 'Hadiah', 'Golden slot']}>
                            {rows
                                .filter((row) => matches(q, row.name, row.outlet))
                                .map((row) => (
                                    <tr key={row.rank}>
                                        <Td className="font-bold">{row.rank}</Td>
                                        <Td className="font-extrabold">{row.name}</Td>
                                        <Td>{row.outlet ?? '-'}</Td>
                                        <Td className="font-bold">{row.caps}</Td>
                                        <Td>{row.flagged > 0 ? <Chip tone="yellow">{row.flagged} ditandai</Chip> : '-'}</Td>
                                        <Td>
                                            <span className="flex gap-1">
                                                {row.golden && <Chip tone="yellow">Golden slot</Chip>}
                                                {row.merch && <Chip tone="black">Merch LE</Chip>}
                                            </span>
                                        </Td>
                                        <Td>
                                            {row.golden_status ? (
                                                <Chip tone={row.golden_status.startsWith('Dikonfirmasi') ? 'green' : 'yellow'}>
                                                    {row.golden_status}
                                                </Chip>
                                            ) : (
                                                '-'
                                            )}
                                        </Td>
                                    </tr>
                                ))}
                        </Table>
                    ) : (
                        <Empty>Belum ada klaim disetujui{tab === 'minggu' ? ' minggu ini' : ''}.</Empty>
                    )}
                </Card>

                <div className="space-y-3">
                    <Card title="Aturan peringkat">
                        <p className="text-ink/60 text-[11px] leading-relaxed">
                            Hanya klaim berstatus disetujui yang dihitung. Urutan: cap terbanyak, lalu yang lebih dulu mencapai jumlah itu.
                            <br />
                            <br />
                            10 teratas: merchandise limited edition.
                            <br />4 teratas: golden slot Laga Kosan.
                        </p>
                    </Card>
                    <Card title="Tutup peringkat">
                        <p className="text-ink/60 text-[11px] leading-relaxed">
                            Ditutup sebelum Laga Kosan dimulai. Admin mengonfirmasi dulu apakah pemenang bisa main. Jika tidak, slot turun ke
                            peringkat berikutnya.
                        </p>
                        {closedAt ? (
                            <Chip tone="green" className="mt-3">
                                Ditutup {closedAt}
                            </Chip>
                        ) : (
                            <Btn variant="red" className="mt-3" onClick={() => setOpen(true)}>
                                Tutup peringkat
                            </Btn>
                        )}
                        <p className="text-ink/45 mt-2 text-[10px]">Memerlukan konfirmasi dua langkah dan tercatat di log.</p>
                    </Card>
                </div>
            </div>

            <Modal open={open} onClose={() => setOpen(false)} danger>
                <h3 className="text-[16px] font-extrabold">Tutup peringkat?</h3>
                <p className="text-ink/60 mt-1 text-[12px]">Pemenang golden slot dan merch LE dikunci sesuai urutan saat ini.</p>
                <label className="mt-3 flex items-center gap-2 text-[12px]">
                    <input
                        type="checkbox"
                        checked={form.data.confirm}
                        onChange={(e) => form.setData('confirm', e.target.checked)}
                        className="accent-ink size-4"
                    />
                    Saya mengerti dampaknya (langkah 2 dari 2)
                </label>
                <div className="mt-4 flex justify-end gap-2">
                    <Btn variant="outline" onClick={() => setOpen(false)}>
                        Batal
                    </Btn>
                    <Btn
                        variant="red"
                        disabled={!form.data.confirm || form.processing}
                        onClick={() => form.post('/admin/peringkat/tutup', { onSuccess: () => setOpen(false) })}
                    >
                        Tutup peringkat
                    </Btn>
                </div>
            </Modal>
        </AdminLayout>
    );
}
