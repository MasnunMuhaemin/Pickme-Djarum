import { OutlineButton, PageHeader, PrimaryButton } from '@/features/participant/components/ui';
import ParticipantLayout from '@/layouts/participant-layout';
import { Link } from '@inertiajs/react';

function FakeQr() {
    const n = 25;
    const cells = [];
    for (let y = 0; y < n; y++) {
        for (let x = 0; x < n; x++) {
            const finder = (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
            let on = false;
            if (finder) {
                const fx = x >= n - 7 ? x - (n - 7) : x;
                const fy = y >= n - 7 ? y - (n - 7) : y;
                on = fx === 0 || fx === 6 || fy === 0 || fy === 6 || (fx >= 2 && fx <= 4 && fy >= 2 && fy <= 4);
            } else {
                on = (x * y + x + y) % 7 < 3;
            }
            if (on) cells.push(<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="#0d1b15" />);
        }
    }
    return (
        <svg viewBox={`0 0 ${n} ${n}`} className="size-full" aria-label="Contoh QR papan">
            {cells}
        </svg>
    );
}

function Corners() {
    return (
        <>
            <span className="border-lime absolute top-0 left-0 size-8 rounded-tl-lg border-t-4 border-l-4" />
            <span className="border-lime absolute top-0 right-0 size-8 rounded-tr-lg border-t-4 border-r-4" />
            <span className="border-lime absolute bottom-0 left-0 size-8 rounded-bl-lg border-b-4 border-l-4" />
            <span className="border-lime absolute right-0 bottom-0 size-8 rounded-br-lg border-r-4 border-b-4" />
        </>
    );
}

export default function Scan() {
    return (
        <ParticipantLayout nav="scan" dark>
            <PageHeader back="/participant" title="Scan QR papan" dark />
            <div className="flex flex-1 flex-col px-5 pb-6 lg:mx-auto lg:grid lg:w-full lg:max-w-[900px] lg:grid-cols-2 lg:items-center lg:gap-12 lg:px-10 lg:pb-10">
                <div>
                    <p className="text-cream/70 text-center text-[12px] lg:text-left lg:text-sm">Arahkan kamera ke QR di papan warung.</p>

                    <div className="relative mx-auto mt-5 aspect-square w-full max-w-[290px] lg:mx-0 lg:max-w-[340px]">
                        <div className="absolute inset-3 rounded-xl bg-white p-3 shadow-[0_0_0_9999px_rgba(0,0,0,0.18)]">
                            <FakeQr />
                        </div>
                        <Corners />
                    </div>
                </div>

                <div>
                    <div className="bg-lime text-ink mt-5 rounded-xl px-3 py-2.5 text-center text-[11px] leading-relaxed font-semibold lg:mt-0 lg:py-4 lg:text-sm">
                        Jika kamera bermasalah, masukkan kode
                        <br />
                        <span className="font-extrabold">KLM-7M2Q9X</span>
                    </div>

                    <p className="text-cream/60 mt-3 text-center text-[10px] leading-relaxed lg:text-left">
                        Belum punya izin kamera? <span className="underline underline-offset-2">Ikuti panduan izin kamera.</span>
                    </p>

                    <Link
                        href="/participant/qr-tidak-dikenal"
                        className="text-lime mt-2 block text-center text-[10px] font-semibold underline underline-offset-2 lg:text-left"
                    >
                        QR tidak terdaftar? Lihat contoh
                    </Link>

                    <div className="mt-auto space-y-2 pt-6 lg:mt-0 lg:pt-8">
                        <PrimaryButton href="/participant/hadiah">Lihat hadiah</PrimaryButton>
                        <OutlineButton href="/participant/kartu" className="border-cream/35 text-cream">
                            Kartu dan peringkat
                        </OutlineButton>
                    </div>
                </div>
            </div>
        </ParticipantLayout>
    );
}
