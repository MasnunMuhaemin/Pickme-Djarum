import { OutlineButton, PageHeader, PrimaryButton } from '@/features/participant/components/ui';
import ParticipantLayout from '@/layouts/participant-layout';
import { Clock } from 'lucide-react';

type ClaimStatus = { id: number; status: string; submitted_at?: string | null; slot?: { position: string } } | null;

export default function KlaimDiperiksa({ claim }: { claim?: ClaimStatus }) {
    return (
        <ParticipantLayout nav="hadiah">
            <PageHeader back="/participant/hadiah" title="Sedang diperiksa admin" />
            <div className="flex-1 px-4 pb-8 md:mx-auto md:w-full md:max-w-[560px] md:px-8 md:pt-2 md:pb-10">
                <div className="bg-night text-cream rounded-3xl p-5">
                    <span className="bg-lime-soft grid size-12 place-items-center rounded-full">
                        <Clock className="text-ink size-6" />
                    </span>
                    <h2 className="mt-4 text-lg font-extrabold tracking-tight">Klaim sedang diperiksa</h2>
                    <p className="text-cream/65 mt-1 text-[11px] leading-relaxed">
                        Klaim akan selesai dalam 1-2 hari kerja. Kamu tidak perlu mengirim ulang foto.
                    </p>
                </div>

                <div className="border-ink/10 bg-cream-soft mt-4 rounded-2xl border p-4">
                    <p className="text-[11px] font-bold">Status klaim</p>
                    <div className="mt-3 space-y-0">
                        <div className="flex gap-3">
                            <div className="flex flex-col items-center">
                                <span className="bg-lime grid size-5 place-items-center rounded-full">
                                    <span className="bg-ink size-2 rounded-full" />
                                </span>
                                <span className="bg-ink/15 h-8 w-px" />
                            </div>
                            <div className="pb-4">
                                <p className="text-[12px] font-bold">Pending</p>
                                <p className="text-ink-soft text-[10px]">Menunggu pemeriksaan admin.</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <span className="border-ink/20 bg-cream grid size-5 place-items-center rounded-full border" />
                            <div>
                                <p className="text-ink-soft text-[12px] font-bold">Hadiah</p>
                                <p className="text-ink-soft text-[10px]">Hadiah aktif setelah disetujui.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {claim?.slot && <p className="text-ink-soft mt-3 text-center text-[11px]">Slot {claim.slot.position} sedang menunggu pemeriksaan.</p>}

                <div className="mt-6 space-y-2">
                    <PrimaryButton href="/participant/hadiah">Lihat hadiah</PrimaryButton>
                    <OutlineButton onClick={() => window.open('https://wa.me/6281234567890', '_blank')}>
                        Hubungi admin jika perlu bantuan
                    </OutlineButton>
                    <p className="pt-2 text-center">
                        <a href="/participant/papan" className="text-ink-soft text-[11px] font-semibold underline underline-offset-2">
                            Kembali ke papan
                        </a>
                    </p>
                </div>
            </div>
        </ParticipantLayout>
    );
}
