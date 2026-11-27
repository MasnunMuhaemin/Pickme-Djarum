import { Link } from '@inertiajs/react';
import { ArrowRight, QrCode } from 'lucide-react';

const steps = ['Beli bungkus', 'Foto bungkus', 'Ambil hadiah'];

export function DesktopAside() {
    return (
        <aside className="bg-night text-cream relative sticky top-0 hidden h-dvh w-[340px] shrink-0 flex-col overflow-hidden p-7 lg:flex xl:w-[400px] xl:p-9">
            <div className="bg-lime/10 pointer-events-none absolute -top-24 -right-24 size-72 rounded-full blur-3xl" />

            {/* Logo sama dengan tampilan HP. */}
            <Link href="/participant" className="relative self-start" aria-label="Papan Pick(me)">
                <img src="/images/logo.webp" alt="Papan Pick(me)" className="h-14 w-auto" />
            </Link>

            <div className="relative mt-12 xl:mt-16">
                <p className="text-lime text-[10px] font-bold tracking-[0.25em] uppercase">Program warung</p>
                <h2 className="mt-3 text-[34px] leading-[1.03] font-extrabold tracking-tight xl:text-[42px]">Hadiah nyata dari warung sekitar.</h2>
                <p className="text-cream/60 mt-4 max-w-[290px] text-[13px] leading-relaxed">
                    Tanpa undian. Beli bungkus, foto, lalu ambil satu hadiah di papan mingguan.
                </p>
            </div>

            <div className="relative mt-10 space-y-5">
                {steps.map((step, i) => (
                    <div key={step} className="flex items-center gap-3">
                        <span className="bg-lime text-ink grid size-7 place-items-center rounded-full text-[11px] font-extrabold">{i + 1}</span>
                        <span className="text-[13px] font-semibold">{step}</span>
                        {i < steps.length - 1 && <span className="bg-cream/15 ml-1 h-px flex-1" />}
                    </div>
                ))}
            </div>

            <div className="border-cream/10 bg-cream/5 relative mt-auto rounded-2xl border p-4">
                <div className="flex items-center gap-3">
                    <span className="bg-lime text-ink grid size-10 shrink-0 place-items-center rounded-xl">
                        <QrCode className="size-5" />
                    </span>
                    <div>
                        <p className="text-xs font-bold">Mulai dari papan warung</p>
                        <p className="text-cream/50 mt-0.5 text-[10px]">Scan QR, pilih hadiah, kirim kode.</p>
                    </div>
                </div>
                <Link
                    href="/participant/scan"
                    className="bg-lime text-ink mt-3 flex h-10 items-center justify-center gap-2 rounded-full text-[11px] font-bold"
                >
                    Buka scan QR
                    <ArrowRight className="size-3.5" />
                </Link>
            </div>

            <p className="text-cream/30 relative mt-4 text-[9px] tracking-wide">Demo prototype. Semua data palsu.</p>
        </aside>
    );
}
