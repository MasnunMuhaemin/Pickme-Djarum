import { PageHeader, PrimaryButton } from '@/features/participant/components/ui';
import { uniqueSlotCode, type ClaimVariant } from '@/features/participant/data';
import ParticipantLayout from '@/layouts/participant-layout';
import { Link, router, usePage } from '@inertiajs/react';
import { Check } from 'lucide-react';
import { useState } from 'react';

const variants: { key: ClaimVariant; label: string }[] = [
    { key: 'voucher', label: 'Voucher' },
    { key: 'token', label: 'Token' },
    { key: 'merch', label: 'Merch' },
    { key: 'bensin', label: 'Bensin' },
];

export default function Slot() {
    const { url } = usePage();
    const [code, setCode] = useState('');
    const [error, setError] = useState(new URLSearchParams(url.split('?')[1] ?? '').has('salah'));
    const [variant, setVariant] = useState<ClaimVariant>('voucher');

    function submit() {
        if (code === uniqueSlotCode) {
            setError(false);
            router.visit(`/participant/klaim/berhasil/${variant}`);
        } else {
            setError(true);
        }
    }

    return (
        <ParticipantLayout hideBottomNav>
            <PageHeader back="/participant/foto" title="Ambil slot" />
            <div className="flex-1 px-4 pb-8 lg:mx-auto lg:w-full lg:max-w-[560px] lg:px-8 lg:pt-2 lg:pb-10">
                <p className="text-ink-soft text-[11px] leading-relaxed">
                    Foto tersimpan. Sistem memilih satu slot kosong untukmu. Ambil slot fisik itu, lalu isi kode di baliknya.
                </p>

                <div className="bg-lime text-ink mt-4 rounded-3xl p-4">
                    <div className="flex items-center gap-2">
                        <span className="bg-ink text-lime grid size-7 place-items-center rounded-full">
                            <Check className="size-4" />
                        </span>
                        <p className="text-[15px] font-extrabold">Slot C3 dikunci untukmu</p>
                    </div>
                    <p className="text-ink/75 mt-2 text-[11px] leading-relaxed">
                        Slot tetap ditahan walau kode salah. Kamu bisa mengisi ulang kode di halaman ini.
                    </p>

                    <div className="mt-4 flex items-center gap-2">
                        <span className="bg-cream/70 rounded-lg px-2 py-1 text-[10px] font-bold">Slot</span>
                        <span className="text-xl font-extrabold">C3</span>
                    </div>

                    <label className="mt-4 block">
                        <span className="text-ink/70 text-[10px] font-bold tracking-widest uppercase">Kode 6 karakter</span>
                        <input
                            value={code}
                            onChange={(e) => {
                                setCode(e.target.value.toUpperCase().replace(/[\s-]/g, '').slice(0, 6));
                                setError(false);
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && submit()}
                            placeholder="K7M2QX"
                            autoCapitalize="characters"
                            maxLength={6}
                            className="border-ink bg-cream-soft mt-1.5 h-14 w-full rounded-xl border-2 text-center font-mono text-2xl font-extrabold tracking-[0.3em] outline-none"
                        />
                    </label>
                    <p className="text-ink/60 mt-1 text-[10px]">Huruf besar otomatis. Spasi dan strip diabaikan. Contoh demo: {uniqueSlotCode}</p>
                </div>

                {error && (
                    <div className="text-danger mt-4 rounded-2xl bg-[#fbe3e0] p-3.5 text-[11px] leading-relaxed">
                        Kode tidak sesuai. Coba huruf angka ya, atau ambil di dalam wilayah bukan di papan. Slot C3 tetap ditahan, silakan isi ulang.
                    </div>
                )}

                <PrimaryButton onClick={submit} className="mt-5">
                    Kirim kode
                </PrimaryButton>

                <div className="border-ink/20 mt-6 rounded-xl border border-dashed p-3">
                    <p className="text-ink-soft text-[9px] font-bold tracking-widest uppercase">Demo — jenis hadiah</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {variants.map((item) => (
                            <button
                                key={item.key}
                                onClick={() => setVariant(item.key)}
                                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                                    variant === item.key ? 'bg-ink text-cream' : 'bg-cream-deep text-ink-soft'
                                }`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5 text-[10px] font-semibold">
                    <Link href="/participant/kartu" className="border-ink/20 rounded-full border px-2.5 py-1">
                        Kartu dan peringkat
                    </Link>
                </div>
            </div>
        </ParticipantLayout>
    );
}
