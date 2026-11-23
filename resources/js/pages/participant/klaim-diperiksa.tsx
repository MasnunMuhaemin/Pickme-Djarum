import { ClaimDetails, type ClaimStatus } from '@/features/participant/components/claim-details';
import { OutlineButton, PageHeader, PrimaryButton } from '@/features/participant/components/ui';
import ParticipantLayout from '@/layouts/participant-layout';
import { Clock } from 'lucide-react';

/**
 * Klaim yang ditangguhkan untuk pemeriksaan admin. Alasan tanda tidak ditampilkan (PRD P7); target keputusan
 * paling lama 1×24 jam (PRD bagian 6). Cap dan hadiah baru dibuat setelah disetujui.
 */
export default function KlaimDiperiksa({ claim, adminWhatsapp }: { claim?: ClaimStatus; adminWhatsapp?: string | null }) {
    return (
        <ParticipantLayout title="Sedang diperiksa" nav="hadiah">
            <PageHeader back="/participant/hadiah" title="Sedang diperiksa admin" />
            <div className="flex-1 px-4 pb-8 md:mx-auto md:w-full md:max-w-[560px] md:px-8 md:pt-2 md:pb-10">
                <div className="bg-night text-cream rounded-3xl p-5">
                    <span className="bg-lime-soft grid size-12 place-items-center rounded-full">
                        <Clock className="text-ink size-6" />
                    </span>
                    <h2 className="mt-4 text-lg font-extrabold tracking-tight">Klaim sedang diperiksa</h2>
                    <p className="text-cream/65 mt-1 text-[12px] leading-relaxed">
                        Admin memeriksa klaimmu paling lama 1×24 jam. Kamu tidak perlu mengirim ulang foto.
                    </p>
                </div>

                <div className="border-ink/10 bg-cream-soft mt-4 rounded-2xl border p-4">
                    <p className="text-[12px] font-bold">Status klaim</p>
                    <div className="mt-3">
                        <div className="flex gap-3">
                            <div className="flex flex-col items-center">
                                <span className="bg-lime grid size-5 place-items-center rounded-full">
                                    <span className="bg-ink size-2 rounded-full" />
                                </span>
                                <span className="bg-ink/15 h-8 w-px" />
                            </div>
                            <div className="pb-4">
                                <p className="text-[12px] font-bold">Menunggu pemeriksaan</p>
                                <p className="text-ink-soft text-[11px]">Foto dan kode slotmu sudah tercatat.</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <span className="border-ink/20 bg-cream grid size-5 place-items-center rounded-full border" />
                            <div>
                                <p className="text-ink-soft text-[12px] font-bold">Cap dan hadiah</p>
                                <p className="text-ink-soft text-[11px]">Cap bertambah dan hadiah muncul di Hadiahku setelah disetujui.</p>
                            </div>
                        </div>
                    </div>
                    {claim && (
                        <div className="border-ink/10 mt-3 border-t pt-1">
                            <ClaimDetails claim={claim} />
                        </div>
                    )}
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
