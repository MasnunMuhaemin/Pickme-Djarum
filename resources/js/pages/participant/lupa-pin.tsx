import { LimePage } from '@/features/participant/components/lime-page';
import { OutlineButton } from '@/features/participant/components/ui';
import { router } from '@inertiajs/react';
import { MessageSquare } from 'lucide-react';

const STEPS = ['Hubungi admin', 'Terima PIN sementara', 'Masuk, lalu ganti PIN'];

/** Lupa PIN: admin membuatkan PIN sementara lewat WhatsApp. Nomor peserta dibawa dari form masuk. */
export default function LupaPin({ whatsapp, adminWhatsapp }: { whatsapp?: string | null; adminWhatsapp?: string | null }) {
    const message = `Halo admin Pickme, saya lupa PIN.${whatsapp ? ` Nomor WhatsApp terdaftar: ${whatsapp}.` : ''} Mohon dibuatkan PIN sementara.`;
    const link = adminWhatsapp ? `https://wa.me/${adminWhatsapp}?text=${encodeURIComponent(message)}` : null;

    return (
        <LimePage
            title="Lupa PIN?"
            back="/participant/masuk"
            footer={
                <div className="space-y-2">
                    <OutlineButton href="/participant/masuk" className="border-ink h-14 border-2 text-[16px] font-extrabold">
                        Kembali ke masuk
                    </OutlineButton>
                    {link ? (
                        <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            // Permintaan dicatat untuk admin bila nomornya diketahui.
                            onClick={() => whatsapp && router.post('/participant/lupa-pin', { whatsapp }, { preserveScroll: true })}
                            className="bg-lime text-ink flex h-14 w-full items-center justify-center gap-2 rounded-full text-[16px] font-extrabold shadow-sm transition active:scale-[0.99]"
                        >
                            <MessageSquare className="size-5" /> Hubungi admin
                        </a>
                    ) : (
                        <p className="text-ink-soft text-center text-[12px]">Nomor WhatsApp admin belum diatur.</p>
                    )}
                </div>
            }
        >
            <h2 className="text-[26px] leading-tight font-extrabold tracking-tight">Admin bantu buatkan PIN sementara.</h2>
            <p className="text-ink-soft mt-2 text-[14px] leading-relaxed">
                Hubungi admin lewat nomor WhatsApp yang kamu pakai saat daftar. PIN sementara dipakai sekali untuk masuk, lalu kamu membuat PIN baru.
            </p>

            <ol className="mt-5 space-y-6 rounded-[2rem] bg-white px-6 py-10">
                {STEPS.map((step, i) => (
                    <li key={step} className="flex items-center gap-4">
                        <span className="text-cream grid size-9 shrink-0 place-items-center rounded-full bg-[#0b0b0b] text-[15px] font-extrabold">
                            {i + 1}
                        </span>
                        <span className="text-[16px] font-extrabold">{step}</span>
                    </li>
                ))}
            </ol>
        </LimePage>
    );
}
