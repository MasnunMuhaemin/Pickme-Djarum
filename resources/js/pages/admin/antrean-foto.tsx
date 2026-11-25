import { Btn, Card, Chip, Empty, SelectInput } from '@/features/admin/ui';
import AdminLayout from '@/layouts/admin-layout';
import { cn } from '@/lib/utils';
import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

type QueueItem = { id: number; name: string; outlet: string; time: string; flags: string[] };
type ClaimDetail = {
    id: number;
    claim_code: string;
    status: 'pending' | 'approved' | 'rejected' | string;
    outlet: string;
    time: string;
    photo_url: string | null;
    participant: string;
    history: string;
    flags: string[];
    slot: string | null;
    decided: { by: string | null; at: string | null; reason: string | null } | null;
    can_undo: boolean;
};

function flagTone(flag: string): 'red' | 'yellow' | 'green' {
    if (/mirip|berbeda|lebih dari|lama/i.test(flag)) return 'red';
    if (/pertama/i.test(flag)) return 'green';
    return 'yellow';
}

/** A2 Antrean foto: daftar klaim bertanda di kiri, rincian dan keputusan di kanan. */
export default function AntreanFoto({ queue, claim, rejectReasons }: { queue: QueueItem[]; claim: ClaimDetail | null; rejectReasons: string[] }) {
    const errors = usePage().props.errors as Record<string, string>;
    const [reason, setReason] = useState('');
    const [busy, setBusy] = useState(false);

    function act(path: string, data: Record<string, string> = {}) {
        if (!claim) return;
        setBusy(true);
        router.post(`/admin/antrean-foto/${claim.id}/${path}`, data, {
            preserveScroll: true,
            onFinish: () => setBusy(false),
            onSuccess: () => setReason(''),
        });
    }

    return (
        <AdminLayout active="antrean-foto" title="Antrean foto" subtitle={`${queue.length} klaim bertanda · target diputuskan paling lama 1×24 jam`}>
            <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
                <div className="space-y-2">
                    {queue.map((item) => (
                        <Link
                            key={item.id}
                            href={`/admin/antrean-foto?claim=${item.id}`}
                            preserveScroll
                            className={cn(
                                'block rounded-xl border bg-white p-3 transition',
                                claim?.id === item.id ? 'border-black bg-[#fffbd6]' : 'border-black/5 hover:border-black/20',
                            )}
                        >
                            <div className="flex items-center justify-between text-[12px]">
                                <span className="font-extrabold">
                                    {item.name} · {item.outlet}
                                </span>
                                <span className="text-black/45">{item.time}</span>
                            </div>
                            <div className="mt-1.5 flex flex-wrap gap-1">
                                {item.flags.map((f) => (
                                    <Chip key={f} tone={flagTone(f)}>
                                        {f}
                                    </Chip>
                                ))}
                            </div>
                        </Link>
                    ))}
                    {queue.length === 0 && <Empty>Tidak ada klaim bertanda. Antrean kosong.</Empty>}
                </div>

                <Card>
                    {claim ? (
                        <div>
                            <div className="relative grid h-[340px] place-items-center overflow-hidden rounded-xl bg-[#2a2a2a]">
                                {claim.photo_url ? (
                                    <img src={claim.photo_url} alt={`Foto bungkus ${claim.claim_code}`} className="size-full object-contain" />
                                ) : (
                                    <span className="text-[12px] text-white/50">Foto tidak tersedia</span>
                                )}
                                <span className="absolute bottom-3 left-3 rounded bg-[#ffe500] px-2 py-0.5 font-mono text-[10px] font-bold">
                                    {claim.time} · {claim.outlet} · {claim.claim_code}
                                </span>
                            </div>

                            <dl className="mt-3 divide-y divide-black/5 text-[12px]">
                                {[
                                    ['Peserta', claim.participant],
                                    ['Riwayat', claim.history],
                                    ['Tanda', claim.flags.join(', ') || '-'],
                                    ['Slot dituju', claim.slot ?? '-'],
                                ].map(([label, value]) => (
                                    <div key={label} className="flex justify-between gap-4 py-2">
                                        <dt className="text-black/50">{label}</dt>
                                        <dd className="text-right font-bold">{value}</dd>
                                    </div>
                                ))}
                            </dl>

                            {claim.status === 'pending' ? (
                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                    <Btn variant="black" disabled={busy} onClick={() => act('setujui')}>
                                        Setujui
                                    </Btn>
                                    <Btn variant="outline" disabled={busy || !reason} onClick={() => act('tolak', { reason })}>
                                        Tolak
                                    </Btn>
                                    <SelectInput
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="Alasan penolakan (wajib saat Tolak)"
                                        options={rejectReasons.map((r) => ({ value: r, label: r }))}
                                        className="max-w-[280px] rounded-full"
                                    />
                                    <Btn variant="ghost" disabled>
                                        Urungkan
                                    </Btn>
                                </div>
                            ) : (
                                <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-black/[0.03] p-3 text-[12px]">
                                    <Chip tone={claim.status === 'approved' ? 'green' : 'red'}>
                                        {claim.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                                    </Chip>
                                    <span className="text-black/60">
                                        {claim.decided?.by ? `oleh ${claim.decided.by} · ${claim.decided.at}` : ''}
                                        {claim.decided?.reason ? ` · ${claim.decided.reason}` : ''}
                                    </span>
                                    <Btn variant="outline" className="ml-auto" disabled={busy || !claim.can_undo} onClick={() => act('urungkan')}>
                                        Urungkan
                                    </Btn>
                                </div>
                            )}
                            {(errors.reason || errors.undo) && (
                                <p className="mt-2 text-[11px] font-semibold text-[#b42318]">{errors.reason ?? errors.undo}</p>
                            )}
                            <p className="mt-3 text-[11px] text-black/45">Urungkan aktif setelah ada keputusan, selama hadiah belum diproses.</p>
                        </div>
                    ) : (
                        <Empty>Pilih klaim di kiri untuk melihat rinciannya.</Empty>
                    )}
                </Card>
            </div>
        </AdminLayout>
    );
}
