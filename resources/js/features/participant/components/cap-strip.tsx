import { RejectedCap } from '@/features/participant/components/ui';
import { type CapMark, capSlots, STAR } from '@/features/participant/rewards';
import { cn } from '@/lib/utils';
import { Check, Gift } from 'lucide-react';

/**
 * Kartu cap hitam ringkas (desain "CAP KAMU"): jumlah cap, cap bergerigi lime untuk yang dihitung, nomor klaim yang
 * ditolak dengan cincin lime, dan nomor kosong bergaris putus-putus. Dipakai di Klaim berhasil dan Klaim ditolak.
 */
export function CapStrip({ trail, total = 10 }: { trail: CapMark[]; total?: number }) {
    const slots = capSlots(trail, 5, total);
    return (
        <div className="rounded-2xl bg-[#0b0b0b] px-3.5 py-3">
            <div className="flex items-center justify-between gap-2">
                <p className="text-lime text-[11px] font-extrabold tracking-[0.12em] uppercase">Cap kamu</p>
                <p className="text-cream text-[12px] font-extrabold">
                    {slots.caps} dari {total} cap
                </p>
            </div>
            <div className="mt-2.5 grid grid-cols-10 gap-1">
                {slots.marks.map((mark, i) =>
                    mark === 'rejected' ? (
                        <RejectedCap key={i} number={i + 1} className="aspect-square text-[11px]" />
                    ) : mark === 'cap' && i + 1 === slots.giftAt ? (
                        <span
                            key={i}
                            className="grid aspect-square place-items-center rounded-full bg-white text-[#0b0b0b] ring-2 ring-[#8fcf3a] motion-safe:animate-[gift-glow_1.8s_ease-in-out_infinite]"
                        >
                            <Gift className="size-[55%]" />
                        </span>
                    ) : mark === 'cap' ? (
                        <span key={i} className="motion-safe:animate-[cap-glow_1.8s_ease-in-out_infinite]" style={{ animationDelay: `${i * 180}ms` }}>
                            <span className={cn('bg-lime grid aspect-square place-items-center text-[#0b0b0b]', STAR)}>
                                <Check className="size-[55%]" strokeWidth={3.5} />
                            </span>
                        </span>
                    ) : (
                        <span
                            key={i}
                            className="text-cream/50 border-cream/30 grid aspect-square place-items-center rounded-full border border-dashed text-[9px] font-bold"
                        >
                            {i + 1}
                        </span>
                    ),
                )}
            </div>
        </div>
    );
}
