import { ClaimDetails, type ClaimStatus } from '@/features/participant/components/claim-details';
import { Badge, OutlineButton, PageHeader, PrimaryButton } from '@/features/participant/components/ui';
import ParticipantLayout from '@/layouts/participant-layout';
import { X } from 'lucide-react';

/** Klaim yang ditolak admin setelah pemeriksaan. Tidak menambah cap dan tidak dihitung ke batas klaim. */
export default function KlaimDitolak({ claim, caps = 0, adminWhatsapp }: { claim?: ClaimStatus; caps?: number; adminWhatsapp?: string | null }) {
    return (
        <ParticipantLayout title="Klaim ditolak" nav="hadiah">
            <PageHeader back="/participant/hadiah" title="Klaim belum disetujui" right={<Badge>Kartu {caps} / 10</Badge>} />
            <div className="flex-1 px-4 pb-8 md:mx-auto md:w-full md:max-w-[560px] md:px-8 md:pt-2 md:pb-10">
                <div className="border-ink/10 bg-cream-soft overflow-hidden rounded-3xl border">
                    <div className="flex h-28 items-center justify-center bg-[#fbe3e0]">
                        <span className="bg-danger text-cream grid size-14 place-items-center rounded-full">
                            <X className="size-7" />
                        </span>
                    </div>
                    <div className="p-4">
                        <div className="flex items-center justify-between gap-2">
                            <p className="text-[15px] font-extrabold">Klaim ditolak</p>
                            <span className="text-danger rounded-full bg-[#fbe3e0] px-2.5 py-1 text-[11px] font-bold">Ditolak</span>
                        </div>
                        <p className="text-ink-soft mt-1 text-[12px] leading-relaxed">
                            Admin belum bisa menyetujui klaim ini setelah memeriksa foto dan kodenya. Klaim ini tidak menambah cap.
                        </p>
                        {claim && (
                            <div className="mt-2">
                                <ClaimDetails claim={claim} />
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-cream-deep/70 text-ink-soft mt-3 rounded-2xl p-3 text-[11px] leading-relaxed">
                    Merasa ada yang keliru? Hubungi admin lewat WhatsApp dan sebutkan kode klaimmu.
                </div>

                <div className="mt-6 space-y-2">
                    <PrimaryButton href="/participant/hadiah">Kembali ke Hadiahku</PrimaryButton>
                    {adminWhatsapp && (
                        <OutlineButton onClick={() => window.open(`https://wa.me/${adminWhatsapp}`, '_blank', 'noopener')}>
                            Hubungi admin
                        </OutlineButton>
                    )}
                </div>
            </div>
        </ParticipantLayout>
    );
}
