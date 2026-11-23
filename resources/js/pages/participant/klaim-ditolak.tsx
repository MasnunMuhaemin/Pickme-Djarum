import { Badge, OutlineButton, PageHeader, PrimaryButton } from '@/features/participant/components/ui';
import ParticipantLayout from '@/layouts/participant-layout';
import { X } from 'lucide-react';

export default function KlaimDitolak() {
    return (
        <ParticipantLayout nav="hadiah">
            <PageHeader close="/participant/hadiah" title="Klaim belum disetujui" right={<Badge>Kartu 4 / 10</Badge>} />
            <div className="flex-1 px-4 pb-8 lg:mx-auto lg:w-full lg:max-w-[560px] lg:px-8 lg:pt-2 lg:pb-10">
                <div className="border-ink/10 bg-cream-soft overflow-hidden rounded-3xl border">
                    <div className="bg-cream-deep flex h-28 items-center justify-center">
                        <span className="bg-ink text-cream grid size-14 place-items-center rounded-full">
                            <X className="size-7" />
                        </span>
                    </div>
                    <div className="p-4">
                        <p className="text-[14px] font-extrabold">Klaim ditolak</p>
                        <p className="text-ink-soft mt-0.5 text-[10px] leading-relaxed">Admin belum bisa menyetujui klaim ini.</p>
                        <div className="mt-3 space-y-2 text-[11px]">
                            <div className="flex justify-between">
                                <span className="text-ink-soft">Status</span>
                                <span className="text-danger font-bold">Ditolak</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-ink-soft">Batas klarifikasi</span>
                                <span className="font-bold">2 hari kerja</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-ink-soft">Kartu cap</span>
                                <span className="font-bold">Masih 3 dari 10</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-cream-deep/70 text-ink-soft mt-3 rounded-2xl p-3 text-[10px] leading-relaxed">
                    Kamu bisa mengirim klarifikasi lewat admin dalam 2 hari kerja. Setelah itu klaim ditutup.
                </div>

                <div className="mt-6 space-y-2">
                    <PrimaryButton href="/participant/papan">Kembali ke papan</PrimaryButton>
                    <OutlineButton onClick={() => window.open('https://wa.me/6281234567890', '_blank')}>
                        Hubungi admin jika perlu bantuan
                    </OutlineButton>
                </div>
            </div>
        </ParticipantLayout>
    );
}
