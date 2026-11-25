import { Btn, Card, Chip, Empty, FieldError, Modal, PillTabs, SelectInput, Table, Td, TextInput, rupiah } from '@/features/admin/ui';
import AdminLayout from '@/layouts/admin-layout';
import { router, useForm, usePage } from '@inertiajs/react';
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
type PartnerRow = {
    id: number;
    name: string;
    type: string;
    area: string | null;
    whatsapp: string;
    active: boolean;
    has_pin: boolean;
    voucher_types: string;
};
type Option = { value: string; label: string };

function PayDialog({ row, onClose }: { row: Last; onClose: () => void }) {
    const form = useForm({ paid_at: new Date().toISOString().slice(0, 10), proof: '' });
    return (
        <Modal open onClose={onClose}>
            <h3 className="text-[15px] font-extrabold">Tandai dibayar · {row.name}</h3>
            <p className="mt-1 text-[12px] text-black/55">
                {row.count} voucher · {rupiah(row.value)}. Pembayaran dilakukan di luar webapp.
            </p>
            <label className="mt-3 block text-[11px] font-bold">
                Tanggal bayar
                <TextInput type="date" value={form.data.paid_at} onChange={(e) => form.setData('paid_at', e.target.value)} className="mt-1" />
            </label>
            <FieldError message={form.errors.paid_at} />
            <label className="mt-3 block text-[11px] font-bold">
                Bukti bayar
                <TextInput
                    value={form.data.proof}
                    onChange={(e) => form.setData('proof', e.target.value)}
                    placeholder="Mis. nomor transfer"
                    className="mt-1"
                />
            </label>
            <FieldError message={form.errors.proof} />
            <div className="mt-4 flex justify-end gap-2">
                <Btn variant="outline" onClick={onClose}>
                    Batal
                </Btn>
                <Btn
                    disabled={form.processing}
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
            <p className="mt-1 text-[12px] text-black/55">Hanya sebelum dibayar. Wajib beralasan dan tercatat di log.</p>
            <label className="mt-3 block text-[11px] font-bold">
                Jumlah voucher ditukar
                <TextInput type="number" min={0} value={form.data.count} onChange={(e) => form.setData('count', e.target.value)} className="mt-1" />
            </label>
            <FieldError message={form.errors.count} />
            <label className="mt-3 block text-[11px] font-bold">
                Alasan koreksi
                <TextInput value={form.data.reason} onChange={(e) => form.setData('reason', e.target.value)} className="mt-1" />
            </label>
            <FieldError message={form.errors.reason} />
            <div className="mt-4 flex justify-end gap-2">
                <Btn variant="outline" onClick={onClose}>
                    Batal
                </Btn>
                <Btn
                    disabled={form.processing}
                    onClick={() => form.post(`/admin/mitra/${row.id}/koreksi`, { preserveScroll: true, onSuccess: onClose })}
                >
                    Simpan koreksi
                </Btn>
            </div>
        </Modal>
    );
}

function AddPartner({ types, areas, onClose }: { types: Option[]; areas: { id: number; name: string }[]; onClose: () => void }) {
    const form = useForm({ name: '', type: 'umum', area_id: '', whatsapp: '' });
    return (
        <Modal open onClose={onClose}>
            <h3 className="text-[15px] font-extrabold">Tambah mitra</h3>
            <div className="mt-3 space-y-3">
                <label className="block text-[11px] font-bold">
                    Nama mitra
                    <TextInput value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} className="mt-1" />
                    <FieldError message={form.errors.name} />
                </label>
                <label className="block text-[11px] font-bold">
                    Jenis
                    <SelectInput value={form.data.type} onChange={(e) => form.setData('type', e.target.value)} options={types} className="mt-1" />
                </label>
                <label className="block text-[11px] font-bold">
                    Area
                    <SelectInput
                        value={form.data.area_id}
                        onChange={(e) => form.setData('area_id', e.target.value)}
                        placeholder="Tanpa area"
                        options={areas.map((a) => ({ value: a.id, label: a.name }))}
                        className="mt-1"
                    />
                </label>
                <label className="block text-[11px] font-bold">
                    Nomor WhatsApp
                    <TextInput
                        value={form.data.whatsapp}
                        onChange={(e) => form.setData('whatsapp', e.target.value.replace(/\D/g, '').slice(0, 13))}
                        placeholder="08xx"
                        className="mt-1"
                    />
                    <FieldError message={form.errors.whatsapp} />
                </label>
            </div>
            <p className="mt-3 text-[11px] text-black/50">PIN 4 angka dibuat otomatis dan ditampilkan sekali setelah disimpan.</p>
            <div className="mt-4 flex justify-end gap-2">
                <Btn variant="outline" onClick={onClose}>
                    Batal
                </Btn>
                <Btn disabled={form.processing} onClick={() => form.post('/admin/mitra', { preserveScroll: true, onSuccess: onClose })}>
                    Simpan
                </Btn>
            </div>
        </Modal>
    );
}

/** A5 Mitra dan pembayaran: rekap mingguan (bayar di luar webapp) dan akun/PIN mitra. */
export default function Mitra({
    tab,
    weekLabel,
    lastWeekLabel,
    running,
    last,
    partners,
    types,
    areas,
}: {
    tab: 'rekap' | 'akun';
    weekLabel: string;
    lastWeekLabel: string;
    running: Running[];
    last: Last[];
    partners: PartnerRow[];
    types: Option[];
    areas: { id: number; name: string }[];
}) {
    const pin = (usePage().props.flash as { pin?: { name: string; pin: string } | null })?.pin;
    const [paying, setPaying] = useState<Last | null>(null);
    const [correcting, setCorrecting] = useState<Last | null>(null);
    const [adding, setAdding] = useState(false);
    const runningTotal = running.reduce((a, r) => ({ count: a.count + r.count, value: a.value + r.value }), { count: 0, value: 0 });

    return (
        <AdminLayout active="mitra" title="Mitra dan pembayaran" subtitle="Rekap mingguan per mitra">
            <PillTabs
                active={tab}
                tabs={[
                    { key: 'rekap', label: 'Rekap mingguan', href: '/admin/mitra' },
                    { key: 'akun', label: 'Akun dan PIN mitra', href: '/admin/mitra?tab=akun' },
                ]}
            />

            {pin && (
                <div className="mt-4 rounded-xl border-2 border-black bg-[#ffe500] p-3 text-[12px]">
                    PIN baru <b>{pin.name}</b>: <span className="font-mono text-[18px] font-extrabold tracking-[0.3em]">{pin.pin}</span>
                    <span className="ml-2 text-black/60">Hanya ditampilkan sekali. Berikan langsung ke mitra.</span>
                </div>
            )}

            {tab === 'rekap' ? (
                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                    <Card title={`Minggu berjalan · ${weekLabel}`}>
                        {running.length ? (
                            <Table head={['Mitra', 'Voucher ditukar', 'Nilai', 'Status']}>
                                {running.map((r) => (
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
                                {last.map((r) => (
                                    <tr key={r.id}>
                                        <Td className="font-bold">{r.name}</Td>
                                        <Td>
                                            {r.count}
                                            {r.correction && <span className="block text-[10px] text-black/45">Koreksi: {r.correction}</span>}
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
                                                <span className="text-[11px] text-black/45">{r.proof}</span>
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
                        <p className="mt-3 text-[11px] text-black/45">
                            Pembayaran dilakukan di luar webapp. Webapp hanya mencatat tanggal dan bukti. Setelah dibayar, rekap tidak bisa diubah,
                            hanya dikoreksi di minggu berikutnya.
                        </p>
                    </Card>
                </div>
            ) : (
                <Card className="mt-4" right={<Btn onClick={() => setAdding(true)}>Tambah mitra</Btn>} title="Akun mitra">
                    {partners.length ? (
                        <Table head={['Mitra', 'Jenis', 'Area', 'WhatsApp', 'Jenis voucher', 'Status', 'Aksi']}>
                            {partners.map((p) => (
                                <tr key={p.id}>
                                    <Td className="font-bold">{p.name}</Td>
                                    <Td>{p.type}</Td>
                                    <Td>{p.area ?? '-'}</Td>
                                    <Td>{p.whatsapp || '-'}</Td>
                                    <Td className="max-w-[220px] truncate text-black/60">{p.voucher_types || '-'}</Td>
                                    <Td>{p.active ? <Chip tone="green">Aktif</Chip> : <Chip tone="gray">Nonaktif</Chip>}</Td>
                                    <Td>
                                        <span className="flex gap-1.5">
                                            <Btn
                                                variant="outline"
                                                onClick={() => router.post(`/admin/mitra/${p.id}/pin`, {}, { preserveScroll: true })}
                                            >
                                                {p.has_pin ? 'Reset PIN' : 'Buat PIN'}
                                            </Btn>
                                            <Btn
                                                variant="ghost"
                                                onClick={() => router.post(`/admin/mitra/${p.id}/status`, {}, { preserveScroll: true })}
                                            >
                                                {p.active ? 'Nonaktifkan' : 'Aktifkan'}
                                            </Btn>
                                        </span>
                                    </Td>
                                </tr>
                            ))}
                        </Table>
                    ) : (
                        <Empty>Belum ada mitra.</Empty>
                    )}
                    <p className="mt-3 text-[11px] text-black/45">Akun mitra hanya dibuat admin. Admin tidak bisa melihat PIN lama, hanya mereset.</p>
                </Card>
            )}

            {paying && <PayDialog row={paying} onClose={() => setPaying(null)} />}
            {correcting && <CorrectDialog row={correcting} onClose={() => setCorrecting(null)} />}
            {adding && <AddPartner types={types} areas={areas} onClose={() => setAdding(false)} />}
        </AdminLayout>
    );
}
