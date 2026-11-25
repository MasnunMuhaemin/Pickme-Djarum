import {
    Btn,
    Card,
    Chip,
    DateInput,
    Empty,
    FieldError,
    Hint,
    Modal,
    Req,
    RequiredNote,
    SearchInput,
    Table,
    Td,
    TextInput,
    matches,
    rupiah,
} from '@/features/admin/ui';
import AdminLayout from '@/layouts/admin-layout';
import { useForm } from '@inertiajs/react';
import { useState } from 'react';

type Running = { id: number; name: string; count: number; value: number };
type Last = {
    id: number;
    name: string;
    count: number;
    value: number;
    status: 'menunggu_bayar' | 'dibayar';
    paid_at: string | null;
    proof: string | null;
    correction: string | null;
};

function PayDialog({ row, onClose }: { row: Last; onClose: () => void }) {
    const form = useForm({ paid_at: new Date().toISOString().slice(0, 10), proof: '' });
    return (
        <Modal open onClose={onClose}>
            <h3 className="text-[15px] font-extrabold">Tandai dibayar · {row.name}</h3>
            <p className="text-ink/55 mt-1 text-[12px]">
                {row.count} voucher · {rupiah(row.value)}. Pembayaran dilakukan di luar webapp.
            </p>
            <RequiredNote />
            <label className="mt-3 block text-[11px] font-bold">
                Tanggal bayar
                <Req />
                <DateInput value={form.data.paid_at} onChange={(v) => form.setData('paid_at', v)} className="mt-1" />
                <Hint>Tanggal uang ditransfer ke mitra. Tidak boleh setelah hari ini.</Hint>
            </label>
            <FieldError message={form.errors.paid_at} />
            <label className="mt-3 block text-[11px] font-bold">
                Bukti bayar
                <Req />
                <TextInput
                    value={form.data.proof}
                    onChange={(e) => form.setData('proof', e.target.value)}
                    placeholder="Mis. nomor transfer"
                    className="mt-1"
                />
                <Hint>Nomor transfer atau referensi bank, mis. TRX-240518-001.</Hint>
            </label>
            <FieldError message={form.errors.proof} />
            <div className="mt-4 flex justify-end gap-2">
                <Btn variant="outline" onClick={onClose}>
                    Batal
                </Btn>
                <Btn
                    disabled={!form.data.paid_at || !form.data.proof.trim() || form.processing}
                    onClick={() => form.post(`/admin/mitra/${row.id}/dibayar`, { preserveScroll: true, onSuccess: onClose })}
                >
                    Tandai dibayar
                </Btn>
            </div>
        </Modal>
    );
}

function CorrectDialog({ row, onClose }: { row: Last; onClose: () => void }) {
    const form = useForm({ count: String(row.count), reason: '' });
    return (
        <Modal open onClose={onClose}>
            <h3 className="text-[15px] font-extrabold">Koreksi jumlah · {row.name}</h3>
            <p className="text-ink/55 mt-1 text-[12px]">Hanya sebelum dibayar. Tercatat di log.</p>
            <RequiredNote />
            <label className="mt-3 block text-[11px] font-bold">
                Jumlah voucher ditukar
                <Req />
                <TextInput type="number" min={0} value={form.data.count} onChange={(e) => form.setData('count', e.target.value)} className="mt-1" />
                <Hint>Jumlah voucher yang benar untuk minggu itu.</Hint>
            </label>
            <FieldError message={form.errors.count} />
            <label className="mt-3 block text-[11px] font-bold">
                Alasan koreksi
                <Req />
                <TextInput value={form.data.reason} onChange={(e) => form.setData('reason', e.target.value)} className="mt-1" />
                <Hint>Minimal 5 huruf, mis. 2 kode tercatat ganda.</Hint>
            </label>
            <FieldError message={form.errors.reason} />
            <div className="mt-4 flex justify-end gap-2">
                <Btn variant="outline" onClick={onClose}>
                    Batal
                </Btn>
                <Btn
                    disabled={form.data.count === '' || form.data.reason.trim().length < 5 || form.processing}
                    onClick={() => form.post(`/admin/mitra/${row.id}/koreksi`, { preserveScroll: true, onSuccess: onClose })}
                >
                    Simpan koreksi
                </Btn>
            </div>
        </Modal>
    );
}

/** A5 Pembayaran mitra: rekap mingguan per mitra; pembayaran dilakukan di luar webapp, di sini hanya dicatat. */
export default function Pembayaran({
    weekLabel,
    lastWeekLabel,
    running,
    last,
}: {
    weekLabel: string;
    lastWeekLabel: string;
    running: Running[];
    last: Last[];
}) {
    const [paying, setPaying] = useState<Last | null>(null);
    const [correcting, setCorrecting] = useState<Last | null>(null);
    const [q, setQ] = useState('');
    const runningTotal = running.reduce((a, r) => ({ count: a.count + r.count, value: a.value + r.value }), { count: 0, value: 0 });

    return (
        <AdminLayout active="pembayaran" title="Pembayaran mitra" subtitle="Rekap mingguan per mitra · dibayar di luar webapp">
            <SearchInput value={q} onChange={setQ} placeholder="Cari nama mitra" />
            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
                <Card title={`Minggu berjalan · ${weekLabel}`}>
                    {running.length ? (
                        <Table head={['Mitra', 'Voucher ditukar', 'Nilai', 'Status']}>
                            {running
                                .filter((r) => matches(q, r.name))
                                .map((r) => (
                                    <tr key={r.id}>
                                        <Td className="font-bold">{r.name}</Td>
                                        <Td>{r.count}</Td>
                                        <Td>{rupiah(r.value)}</Td>
                                        <Td>
                                            <Chip tone="yellow">Berjalan</Chip>
                                        </Td>
                                    </tr>
                                ))}
                            <tr className="font-extrabold">
                                <Td>Jumlah</Td>
                                <Td>{runningTotal.count}</Td>
                                <Td>{rupiah(runningTotal.value)}</Td>
                                <Td />
                            </tr>
                        </Table>
                    ) : (
                        <Empty>Belum ada mitra.</Empty>
                    )}
                </Card>
                <Card title={`Minggu lalu · ${lastWeekLabel}`}>
                    {last.length ? (
                        <Table head={['Mitra', 'Voucher', 'Nilai', 'Status', 'Aksi']}>
                            {last
                                .filter((r) => matches(q, r.name))
                                .map((r) => (
                                    <tr key={r.id}>
                                        <Td className="font-bold">{r.name}</Td>
                                        <Td>
                                            {r.count}
                                            {r.correction && <span className="text-ink/45 block text-[10px]">Koreksi: {r.correction}</span>}
                                        </Td>
                                        <Td>{rupiah(r.value)}</Td>
                                        <Td>
                                            {r.status === 'dibayar' ? (
                                                <Chip tone="green">Dibayar {r.paid_at}</Chip>
                                            ) : (
                                                <Chip tone="yellow">Menunggu bayar</Chip>
                                            )}
                                        </Td>
                                        <Td>
                                            {r.status === 'dibayar' ? (
                                                <span className="text-ink/45 text-[11px]">{r.proof}</span>
                                            ) : (
                                                <span className="flex gap-1.5">
                                                    <Btn onClick={() => setPaying(r)}>Tandai dibayar</Btn>
                                                    <Btn variant="outline" onClick={() => setCorrecting(r)}>
                                                        Koreksi
                                                    </Btn>
                                                </span>
                                            )}
                                        </Td>
                                    </tr>
                                ))}
                        </Table>
                    ) : (
                        <Empty>Tidak ada penukaran voucher minggu lalu.</Empty>
                    )}
                    <p className="text-ink/45 mt-3 text-[11px]">
                        Pembayaran dilakukan di luar webapp. Webapp hanya mencatat tanggal dan bukti. Setelah dibayar, rekap tidak bisa diubah, hanya
                        dikoreksi di minggu berikutnya.
                    </p>
                </Card>
            </div>

            {paying && <PayDialog row={paying} onClose={() => setPaying(null)} />}
            {correcting && <CorrectDialog row={correcting} onClose={() => setCorrecting(null)} />}
        </AdminLayout>
    );
}
