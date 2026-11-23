import { PageHeader } from '@/features/participant/components/ui';
import ParticipantLayout from '@/layouts/participant-layout';
import { Link } from '@inertiajs/react';
import { Camera } from 'lucide-react';
import { useState } from 'react';

export default function FotoBungkus() {
    const [stamp] = useState(() => {
        const now = new Date();
        const time = now.toLocaleTimeString('id-ID', { hour12: false });
        return `${time} · W07 · KLM-0142`;
    });

    return (
        <ParticipantLayout hideBottomNav>
            <PageHeader back="/participant/persetujuan" title="Foto bungkus" />
            <div className="px-4 lg:mx-auto lg:w-full lg:max-w-[600px] lg:px-8">
                <p className="text-ink-soft text-[12px] leading-relaxed">
                    Ambil foto dari kamera langsung. Watermark waktu dan nama titik ditambahkan otomatis.
                </p>
            </div>

            <div className="relative mx-4 mt-3 flex min-h-[420px] flex-1 flex-col items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-b from-[#33352f] via-[#23251f] to-[#121410] px-6 lg:mx-auto lg:mt-4 lg:min-h-[520px] lg:w-full lg:max-w-[600px]">
                <span className="border-cream/70 absolute top-6 left-6 size-8 rounded-tl-lg border-t-[3px] border-l-[3px]" />
                <span className="border-cream/70 absolute top-6 right-6 size-8 rounded-tr-lg border-t-[3px] border-r-[3px]" />
                <span className="border-cream/70 absolute bottom-6 left-6 size-8 rounded-bl-lg border-b-[3px] border-l-[3px]" />
                <span className="border-cream/70 absolute right-6 bottom-6 size-8 rounded-br-lg border-r-[3px] border-b-[3px]" />

                <p className="text-cream/60 absolute top-6 max-w-[240px] text-center text-[10px] leading-relaxed">
                    Letakkan bungkus di dalam kotak. Pastikan kode dan kemasan terlihat jelas.
                </p>

                <div className="w-[210px] rotate-[-3deg] rounded-lg bg-[#c9b795] p-3 shadow-2xl">
                    <div className="rounded-md border border-[#8a7a5e] bg-[#d8c9a9] px-4 py-6 text-center">
                        <p className="text-[10px] font-bold tracking-[0.2em] text-[#6c5b3e]">PICKME</p>
                        <p className="mt-1 text-[26px] leading-none font-extrabold text-[#3f3524]">KLM</p>
                        <p className="mt-2 text-[8px] tracking-widest text-[#6c5b3e]">ISI 20 BATANG</p>
                    </div>
                </div>

                <span className="text-cream/90 absolute bottom-12 left-6 rounded bg-black/45 px-2 py-1 font-mono text-[9px] tracking-wide">
                    {stamp}
                </span>
                <div className="text-cream/80 absolute bottom-6 flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 text-[10px]">
                    <Camera className="size-3.5" />
                    Kamera belakang
                </div>
            </div>

            <div className="flex flex-col items-center gap-2 px-4 py-5">
                <Link
                    href="/participant/slot"
                    aria-label="Ambil foto"
                    className="border-ink/15 grid size-[68px] place-items-center rounded-full border-4 bg-white shadow-lg transition active:scale-95"
                >
                    <span className="bg-ink size-12 rounded-full" />
                </Link>
                <p className="text-ink-soft text-center text-[10px] leading-relaxed">Foto dari luar. Jangan sampai terlipat, blur, atau terpotong.</p>
            </div>
        </ParticipantLayout>
    );
}
