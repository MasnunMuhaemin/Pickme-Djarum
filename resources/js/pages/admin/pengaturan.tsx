import { Btn, Card, Chip, FieldError, Table, Td, TextInput } from '@/features/admin/ui';
import AdminLayout, { type AdminShared, EmergencyDialog } from '@/layouts/admin-layout';
import { useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

type Param = { key: string; label: string; unit: string; min: number; max: number; note: string | null; value: number; stored: string };

const fieldKey = (key: string) => key.replace(/\./g, '__');

/** A7 Pengaturan: Tombol darurat dalam bingkai merah di atas, lalu parameter program. Setiap perubahan tercatat. */
export default function Pengaturan({
    fixed,
    parameters,
    paused,
    pauseReason,
}: {
    fixed: { label: string; value: string; stored: string }[];
    parameters: Param[];
    paused: boolean;
    pauseReason: string | null;
}) {
    const admin = usePage().props.admin as AdminShared;
    const [dialog, setDialog] = useState<'program' | 'outlet' | null>(null);
    const form = useForm<{ values: Record<string, string> }>({
        values: Object.fromEntries(parameters.map((p) => [fieldKey(p.key), String(p.value)])),
    });
    const errors = form.errors as Record<string, string>;
    const dirty = parameters.some((p) => form.data.values[fieldKey(p.key)] !== String(p.value));

    return (
        <AdminLayout active="pengaturan" title="Pengaturan" subtitle="Parameter program · setiap perubahan tercatat di log">
            <section className="rounded-xl border-2 border-[#d0271d] bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="max-w-xl">
                        <h2 className="text-[13px] font-extrabold text-[#b42318]">Tombol darurat</h2>
                        <p className="mt-1 text-[12px] leading-relaxed text-black/60">
                            Jeda memerlukan alasan, konfirmasi dua langkah, dan tercatat di log. Penukaran di mitra tetap berjalan saat jeda.
                        </p>
                        {paused && (
                            <p className="mt-2 text-[12px] font-bold text-[#b42318]">
                                Program sedang dijeda{pauseReason ? `: ${pauseReason}` : ''}. Lanjutkan lewat Tombol Darurat.
                            </p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Btn variant="outline" onClick={() => setDialog('outlet')}>
                            Jeda satu titik
                        </Btn>
                        <Btn variant="red" onClick={() => setDialog('program')}>
                            Jeda seluruh program
                        </Btn>
                    </div>
                </div>
            </section>

            <Card
                className="mt-4"
                right={
                    <Btn disabled={!dirty || form.processing} onClick={() => form.post('/admin/pengaturan', { preserveScroll: true })}>
                        Simpan perubahan
                    </Btn>
                }
                title="Parameter"
            >
                <Table head={['Parameter', 'Nilai', 'Disimpan di']}>
                    {fixed.map((f) => (
                        <tr key={f.label}>
                            <Td>{f.label}</Td>
                            <Td>{f.value}</Td>
                            <Td className="text-black/55">{f.stored}</Td>
                        </tr>
                    ))}
                    {parameters.map((p) => {
                        const key = fieldKey(p.key);
                        return (
                            <tr key={p.key}>
                                <Td>{p.label}</Td>
                                <Td>
                                    <span className="flex flex-wrap items-center gap-2">
                                        <TextInput
                                            type="number"
                                            min={p.min}
                                            max={p.max}
                                            value={form.data.values[key]}
                                            onChange={(e) => form.setData('values', { ...form.data.values, [key]: e.target.value })}
                                            className="w-20"
                                        />
                                        <span className="text-black/55">{p.unit}</span>
                                        {p.note && <Chip tone="yellow">[{p.note}]</Chip>}
                                    </span>
                                    <FieldError message={errors[`values.${key}`]} />
                                </Td>
                                <Td className="text-black/55">{p.stored}</Td>
                            </tr>
                        );
                    })}
                </Table>
            </Card>

            {admin && dialog && <EmergencyDialog open onClose={() => setDialog(null)} admin={admin} initialScope={dialog} />}
        </AdminLayout>
    );
}
