import { Badge, PageHeader, PrimaryButton } from '@/features/participant/components/ui';
import ParticipantLayout from '@/layouts/participant-layout';
import { Check, Coffee, Copy } from 'lucide-react';
import { useState } from 'react';

const code = 'KGR-7M2Q9X';

export default function Voucher() {
    const [copied, setCopied] = useState(false);

    async function copy() {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            setCopied(false);
        }
    }

    return (
        <ParticipantLayout nav="hadiah">
            <PageHeader close="/participant/hadiah" title="Voucher" right={<Badge>Tersedia</Badge>} />
            <div className="flex-1 px-4 pb-8 lg:mx-auto lg:w-full lg:max-w-[560px] lg:px-8 lg:pt-2 lg:pb-10">
                <div className="border-ink/10 bg-cream-soft overflow-hidden rounded-3xl border">
                    <div className="bg-cream-deep flex h-32 items-center justify-between px-5">
                        <Coffee className="text-ink/60 size-10" />
                        <span className="bg-cream/80 rounded-full px-2.5 py-1 text-[11px] font-bold">Rp10.000</span>
                    </div>
                    <div className="p-4">
                        <p className="text-[15px] font-extrabold">Voucher Kopi Grosir</p>
                        <p className="text-ink-soft mt-0.5 text-[10px]">Tunjukkan kode ini ke kasir warung.</p>

                        <div className="border-ink/25 bg-cream mt-4 rounded-xl border border-dashed p-3">
                            <p className="text-ink-soft text-[9px] font-bold tracking-widest uppercase">Kode voucher</p>
                            <div className="mt-1 flex items-center justify-between gap-2">
                                <span className="font-mono text-lg font-extrabold tracking-wide">{code}</span>
                                <button
                                    onClick={copy}
                                    aria-label="Salin kode"
                                    className="bg-ink text-cream flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[10px] font-bold"
                                >
                                    {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
                                    {copied ? 'Tersalin' : 'Salin'}
                                </button>
                            </div>
                        </div>

                        <div className="mt-4 space-y-2 text-[11px]">
                            <div className="flex justify-between">
                                <span className="text-ink-soft">Nilai</span>
                                <span className="font-bold">Rp10.000</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-ink-soft">Berlaku</span>
                                <span className="font-bold">14 hari</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-ink-soft">Status</span>
                                <span className="font-bold">Tersedia</span>
                            </div>
                        </div>
                    </div>
                </div>

                <p className="text-ink-soft mt-3 text-[10px] leading-relaxed">
                    Kode hanya bisa dipakai sekali. Kalau sudah ditukar, voucher tidak bisa dikembalikan.
                </p>

                <PrimaryButton href="/participant/hadiah" className="mt-6">
                    Kembali ke Hadiahku
                </PrimaryButton>
            </div>
        </ParticipantLayout>
    );
}
