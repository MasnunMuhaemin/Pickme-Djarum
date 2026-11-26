import { NoticeSheet } from '@/features/participant/components/ui';
import { Eyebrow, PartnerPage } from '@/features/partner/partner-page';
import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';

type Item = { id: number; destination: string | null; value: string };

/** Nomor HP dipisah per 4 angka supaya mudah dibaca saat mengisi pulsa, mis. 0812 3456 7890. */
const spaced = (phone: string | null) => (phone ?? '-').replace(/(\d{4})(?=\d)/g, '$1 ');

/** M3 Antrean top up (mitra kuota): terlama di atas. Selesai masuk rekap; Nomor salah kembali ke peserta. */
export default function Antrean({ items, maxFailures = 3 }: { items: Item[]; maxFailures?: number }) {
    const status = (usePage().props.flash as { status?: string } | undefined)?.status;
    const [wrong, setWrong] = useState<Item | null>(null);
    const [busy, setBusy] = useState<number | null>(null);

    function act(item: Item, action: 'selesai' | 'nomor-salah') {
        router.post(
            `/mitra/antrean/${item.id}/${action}`,
            {},
            { preserveScroll: true, onStart: () => setBusy(item.id), onFinish: () => setBusy(null) },
        );
    }

    return (
        <PartnerPage title="Antrean top up" nav="antrean">
            {status && <p className="bg-ink text-lime mb-3 rounded-full px-4 py-2.5 text-center text-[12px] font-extrabold">{status}</p>}

            {items.length === 0 ? (
                <div className="pt-10 text-center">
                    <span className="bg-ink text-lime mx-auto grid size-14 place-items-center rounded-full text-[20px] font-extrabold">0</span>
                    <h2 className="mt-4 text-[20px] font-extrabold tracking-tight">Tidak ada permintaan</h2>
                    <p className="text-ink-soft mt-1 text-[13px]">Permintaan baru akan muncul di sini.</p>
                </div>
            ) : (
                <>
                    <p className="text-ink-soft text-[12px]">Terlama di paling atas</p>
                    <div className="mt-2 space-y-3">
                        {items.map((item, i) => (
                            <div key={item.id} className="rounded-3xl bg-white p-4">
                                <div className="flex items-start justify-between gap-2">
                                    <Eyebrow className="text-ink-soft">Nomor HP</Eyebrow>
                                    {i === 0 && <span className="rounded-full bg-[#e9e2bf] px-2.5 py-1 text-[11px] font-extrabold">Terlama</span>}
                                </div>
                                <p className="mt-1 font-mono text-[24px] font-extrabold tracking-wide">{spaced(item.destination)}</p>
                                <p className="text-ink-soft text-[12px]">Nominal {item.value}</p>
                                <div className="mt-3 flex gap-2">
                                    <button
                                        type="button"
                                        disabled={busy === item.id}
                                        onClick={() => act(item, 'selesai')}
                                        className="bg-lime text-ink h-10 flex-1 rounded-full text-[13px] font-extrabold disabled:opacity-50"
                                    >
                                        Selesai
                                    </button>
                                    <button
                                        type="button"
                                        disabled={busy === item.id}
                                        onClick={() => setWrong(item)}
                                        className="border-ink/25 h-10 flex-1 rounded-full border text-[13px] font-extrabold disabled:opacity-50"
                                    >
                                        Nomor salah
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            <NoticeSheet
                open={Boolean(wrong)}
                onClose={() => setWrong(null)}
                icon="?"
                stacked
                title="Nomor salah?"
                text={`Permintaan dikembalikan ke peserta untuk diisi ulang. Setelah ${maxFailures} kali salah, admin akan membantu.`}
                secondary={{ label: 'Batal' }}
                primary={{
                    label: 'Ya, nomor salah',
                    onClick: () => {
                        if (wrong) act(wrong, 'nomor-salah');
                        setWrong(null);
                    },
                }}
            />
        </PartnerPage>
    );
}
