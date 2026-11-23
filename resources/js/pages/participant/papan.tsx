import { Badge, Checkbox, Input, OutlineButton, PageHeader, PrimaryButton, Sheet } from '@/features/participant/components/ui';
import { boardSlots, pickerCodes } from '@/features/participant/data';
import ParticipantLayout from '@/layouts/participant-layout';
import { cn } from '@/lib/utils';
import { Link, usePage } from '@inertiajs/react';
import { Check, Lock, Pause } from 'lucide-react';
import { useEffect, useState } from 'react';

const disabledCodes = ['A1', 'F6', 'J9', 'N3', 'T9', 'V2'];

export default function Papan() {
    const { url } = usePage();
    const params = new URLSearchParams(url.split('?')[1] ?? '');

    const [paused, setPaused] = useState(params.has('dijeda'));
    const [picker, setPicker] = useState(params.has('pilih'));
    const [login, setLogin] = useState(params.has('masuk'));
    const [selected, setSelected] = useState('C3');
    const [agree, setAgree] = useState(false);

    useEffect(() => {
        const next = new URLSearchParams(url.split('?')[1] ?? '');
        setPaused(next.has('dijeda'));
        setPicker(next.has('pilih'));
        setLogin(next.has('masuk'));
    }, [url]);

    return (
        <ParticipantLayout nav="papan">
            <PageHeader back="/participant" title="Papan W07" right={<Badge>Kartu 4 / 10</Badge>} />

            <div className="bg-night text-cream flex items-center justify-between px-4 py-2.5">
                <div>
                    <p className="text-[11px] font-bold">10.00 - 12.00 WIB</p>
                    <p className="text-cream/70 flex items-center gap-1.5 text-[10px]">
                        <span className="bg-lime size-1.5 rounded-full" />
                        Sedang berjalan
                    </p>
                </div>
                <button onClick={() => setPaused(true)} className="border-cream/25 rounded-full border px-2.5 py-1 text-[10px] font-semibold">
                    Status program
                </button>
            </div>

            <Link
                href="/participant/mahasiswa"
                className="text-ink-soft block px-4 pt-2 text-[10px] font-semibold underline underline-offset-2 lg:px-8"
            >
                Link tiket tracing W07 - Sakinah
            </Link>

            <div className="flex-1 px-4 pt-4 pb-6 lg:mx-auto lg:w-full lg:max-w-[720px] lg:px-8 lg:pt-6 lg:pb-10">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-2xl font-extrabold tracking-tight lg:text-3xl">Papan W07</h2>
                        <p className="text-ink-soft mt-0.5 text-[11px] lg:text-xs">15 tersedia dari 25 slot mingguan.</p>
                    </div>
                    <div className="text-right">
                        <p className="text-ink-soft text-[10px]">Kartu kamu</p>
                        <p className="text-sm font-extrabold">4 / 10</p>
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-5 gap-1.5 lg:gap-2">
                    {boardSlots.map((slot) => (
                        <button
                            key={slot.code}
                            onClick={() => setLogin(true)}
                            className={cn(
                                'flex h-12 flex-col items-center justify-center rounded-xl border text-[11px] font-bold lg:h-16 lg:text-[13px]',
                                slot.taken ? 'border-ink bg-ink text-cream' : 'border-ink/15 bg-cream-soft text-ink',
                                slot.code === 'C3' && 'ring-offset-cream ring-2 ring-[#3b82f6] ring-offset-2',
                            )}
                        >
                            {slot.code}
                            {slot.taken && <Check className="text-lime size-3" />}
                        </button>
                    ))}
                </div>

                <div className="mt-4 rounded-2xl bg-[#fbe3e0] p-3.5 lg:mt-6 lg:p-4">
                    <p className="text-danger text-[12px] font-extrabold lg:text-[13px]">Kamu belum isi slot</p>
                    <p className="text-danger/80 mt-0.5 text-[11px] leading-relaxed">
                        Kamu akan diblokir 10 menit dari papan kalau keluar tanpa klaim.
                    </p>
                </div>

                <PrimaryButton onClick={() => setLogin(true)} className="mt-4">
                    Klaim sekarang
                </PrimaryButton>

                <div className="text-ink-soft mt-4 flex items-center gap-2 text-[10px]">
                    <Lock className="size-3.5" />
                    Sistem yang memilih slot. Slot tidak bisa dibatalkan.
                </div>
            </div>

            <Sheet open={paused} onClose={() => setPaused(false)}>
                <div className="py-2 text-center">
                    <span className="bg-lime mx-auto grid size-16 place-items-center rounded-full">
                        <Pause className="text-ink size-7" />
                    </span>
                    <h2 className="mt-4 text-xl font-extrabold tracking-tight">Program sedang dijeda</h2>
                    <p className="text-ink-soft mt-1 text-[12px] leading-relaxed">
                        Kamu belum bisa daftar. Hadiah dan kartu tetap aman dan bisa dilihat.
                    </p>
                </div>
                <div className="mt-4 space-y-2">
                    <PrimaryButton href="/participant/hadiah">Lihat hadiah</PrimaryButton>
                    <OutlineButton href="/participant/kartu">Kartu dan peringkat</OutlineButton>
                    <button onClick={() => setPaused(false)} className="text-ink-soft w-full py-2 text-[11px] font-bold">
                        Kembali
                    </button>
                </div>
            </Sheet>

            <Sheet open={picker} onClose={() => setPicker(false)} title="Pilih kode">
                <p className="text-ink-soft text-[12px] leading-relaxed">Ketuk satu kode. Hadiah disembunyikan sampai kamu klaim.</p>
                <div className="mt-3 grid grid-cols-4 gap-2">
                    {pickerCodes.map((code) => {
                        const disabled = disabledCodes.includes(code);
                        return (
                            <button
                                key={code}
                                disabled={disabled}
                                onClick={() => setSelected(code)}
                                className={cn(
                                    'h-11 rounded-lg border text-[13px] font-bold',
                                    disabled && 'border-ink/10 bg-cream-deep text-ink/30 line-through',
                                    !disabled && selected === code && 'border-ink bg-ink text-cream',
                                    !disabled && selected !== code && 'border-ink/20 bg-cream-soft text-ink',
                                )}
                            >
                                {code}
                            </button>
                        );
                    })}
                </div>
                <PrimaryButton
                    onClick={() => {
                        setPicker(false);
                        setLogin(true);
                    }}
                    className="mt-4"
                >
                    Kirim kode
                </PrimaryButton>
                <p className="text-ink-soft mt-3 text-[10px] leading-relaxed">
                    Kode yang sudah dipakai tidak bisa dipilih lagi. Hadiah muncul setelah kode dikirim.
                </p>
            </Sheet>

            <Sheet open={login} onClose={() => setLogin(false)} title="Masuk dulu untuk klaim">
                <p className="text-ink-soft text-[12px] leading-relaxed">Supaya hadiah dan kartu cap kamu aman. Lanjut dengan WhatsApp.</p>
                <div className="mt-4 space-y-3">
                    <div>
                        <p className="mb-1.5 text-[11px] font-semibold">Nomor WhatsApp</p>
                        <Input inputMode="tel" placeholder="08xx xxxx xxxx" />
                    </div>
                    <div>
                        <p className="mb-1.5 text-[11px] font-semibold">PIN</p>
                        <Input inputMode="numeric" maxLength={4} placeholder="4 angka" />
                    </div>
                    <Checkbox checked={agree} onChange={setAgree}>
                        Saya setuju Syarat dan Ketentuan serta Kebijakan Privasi.
                    </Checkbox>
                    <PrimaryButton href="/participant/foto" disabled={!agree}>
                        Masuk dan klaim
                    </PrimaryButton>
                    <div className="flex items-center justify-between text-[11px]">
                        <Link href="/participant/daftar" className="font-semibold underline underline-offset-2">
                            Belum punya akun? Daftar
                        </Link>
                        <Link href="/participant/lupa-pin" className="font-semibold underline underline-offset-2">
                            Lupa PIN?
                        </Link>
                    </div>
                </div>
            </Sheet>
        </ParticipantLayout>
    );
}
