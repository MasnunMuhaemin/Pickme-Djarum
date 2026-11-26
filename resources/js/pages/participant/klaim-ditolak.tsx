import { CapStrip } from '@/features/participant/components/cap-strip';
import { OutlineButton, PrimaryButton } from '@/features/participant/components/ui';
import type { CapMark } from '@/features/participant/rewards';
import ParticipantLayout from '@/layouts/participant-layout';
import { CircleX, MessageSquare } from 'lucide-react';

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-start justify-between gap-4 py-3">
            <span className="text-ink-soft">{label}</span>
            <span className="text-right font-extrabold">{value}</span>
        </div>
    );
}

/**
 * Klaim yang ditolak admin (desain "Klaim belum disetujui"). Tidak dihitung ke batas klaim harian; nomor capnya
 * tetap terpakai di kartu cap tapi tidak dihitung.
 */
export default function KlaimDitolak({
    claim,
    capTrail = [],
    dailyLimit = 0,
    adminWhatsapp,
}: {
    claim: { claim_code: string; reason: string | null; rejected_at: string | null };
    capTrail?: CapMark[];
    dailyLimit?: number;
    adminWhatsapp?: string | null;
}) {
    const adminLink = adminWhatsapp
        ? `https://wa.me/${adminWhatsapp}?text=${encodeURIComponent(`Halo admin Pickme, klaim saya ${claim.claim_code} ditolak. Mohon bantuannya.`)}`
        : null;

    return (
        <ParticipantLayout title="Klaim belum disetujui" nav="hadiah" hideBottomNav>
            <div className="lime-hero relative px-5 pt-8 pb-14 md:px-8">
                <img
                    src="/images/gurita.webp"
                    alt=""
                    aria-hidden
                    className="pointer-events-none absolute right-3 bottom-[8px] z-10 w-[27%] max-w-[150px] select-none md:right-8 md:w-[22%]"
                />
                <h1 className="relative flex max-w-[78%] items-center gap-3 text-[30px] leading-[1.05] font-extrabold tracking-tight md:text-[38px]">
                    <span className="text-lime grid size-12 shrink-0 place-items-center rounded-full bg-[#0b0b0b]">
                        <CircleX className="size-7" strokeWidth={2.5} />
                    </span>
                    Klaim belum disetujui
                </h1>
            </div>

            <div className="bg-cream relative -mt-7 flex flex-1 flex-col rounded-t-[2rem] px-5 pt-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:px-8">
                <div className="flex-1 md:mx-auto md:w-full md:max-w-[520px]">
                    <div className="overflow-hidden rounded-3xl bg-white">
                        <div className="grid h-32 place-items-center bg-[#0b0b0b]">
                            <CircleX className="text-lime size-12" strokeWidth={2.25} />
                        </div>
                        <div className="px-5 pt-4">
                            <p className="text-[20px] font-extrabold tracking-tight">Klaim ditolak</p>
                            <p className="text-ink-soft mt-0.5 text-[13px]">
                                {dailyLimit > 0 ? `Tidak dihitung ke batas ${dailyLimit} klaim per hari` : 'Tidak dihitung ke batas klaim harian'}
                            </p>
                        </div>
                        {/* Sobekan tiket dengan lubang di kiri dan kanan. */}
                        <div className="relative mt-3">
                            <span aria-hidden className="bg-cream absolute top-1/2 -left-3 size-6 -translate-y-1/2 rounded-full" />
                            <span aria-hidden className="bg-cream absolute top-1/2 -right-3 size-6 -translate-y-1/2 rounded-full" />
                            <div className="border-cream-deep mx-5 border-t-2 border-dashed" />
                        </div>
                        <div className="divide-cream-deep mx-5 divide-y pb-2 text-[13px]">
                            <Row label="Status" value="Ditolak admin" />
                            {claim.reason && <Row label="Alasan" value={claim.reason} />}
                            <Row label="Batas harian" value="Tidak terpakai" />
                            <Row label="Kode klaim" value={claim.claim_code} />
                        </div>
                    </div>

                    <div className="mt-4">
                        <CapStrip trail={capTrail} />
                    </div>
                </div>

                <div className="mt-6 space-y-3 md:mx-auto md:w-full md:max-w-[520px]">
                    <PrimaryButton href="/participant" className="h-14 text-[16px] font-extrabold">
                        Kembali ke papan
                    </PrimaryButton>
                    {adminLink && (
                        <a
                            href={adminLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="border-ink text-ink flex h-14 w-full items-center justify-center gap-2 rounded-full border-2 text-[15px] font-extrabold transition active:scale-[0.99]"
                        >
                            <MessageSquare className="size-5" /> Hubungi admin jika perlu bantuan
                        </a>
                    )}
                    {!adminLink && <OutlineButton href="/participant/hadiah">Kembali ke Hadiahku</OutlineButton>}
                </div>
            </div>
        </ParticipantLayout>
    );
}
