import {
    Checkbox,
    DateField,
    Input,
    NoticeSheet,
    PinInput,
    PrimaryButton,
    Select,
    Sheet,
    toWhatsapp,
    WHATSAPP_MAX,
} from '@/features/participant/components/ui';
import { deviceId } from '@/lib/device';
import { Link, useForm, usePage } from '@inertiajs/react';
import { FormEvent, useEffect, useState } from 'react';

type Area = { id: number; name: string };
export type AuthMode = 'login' | 'register' | null;

// Isian daftar disimpan sementara (tanpa PIN) supaya tidak hilang saat membuka halaman persetujuan.
const DRAFT_KEY = 'pickme.register-draft';
type RegisterDraft = { name: string; whatsapp: string; birth_date: string; area_id: string };

function readDraft(): Partial<RegisterDraft> {
    try {
        return JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? '{}');
    } catch {
        return {};
    }
}

export function AuthSheet({
    mode,
    onClose,
    onModeChange,
    areas = [],
}: {
    mode: AuthMode;
    onClose: () => void;
    onModeChange: (mode: AuthMode) => void;
    areas?: Area[];
}) {
    const login = useForm({ whatsapp: '', pin: '', device_id: deviceId() });
    const register = useForm({
        name: '',
        whatsapp: '',
        birth_date: '',
        area_id: '',
        ...readDraft(),
        pin: '',
        pin_confirmation: '',
        device_id: deviceId(),
    });
    const [registerAgree, setRegisterAgree] = useState(false);
    // Dari form ini atau dari error halaman (mis. dikirim ulang setelah muat ulang).
    const pageErrors = (usePage().props.errors as Record<string, string> | undefined) ?? {};
    const underage = (register.errors as Record<string, string>).underage ?? pageErrors.underage;
    const pinMismatch = register.data.pin_confirmation.length === 4 && register.data.pin_confirmation !== register.data.pin;

    function submitLogin(e: FormEvent) {
        e.preventDefault();
        login.post('/participant/masuk', { preserveScroll: true });
    }

    function submitRegister(e: FormEvent) {
        e.preventDefault();
        register.post('/participant/daftar', { preserveScroll: true, onSuccess: () => sessionStorage.removeItem(DRAFT_KEY) });
    }

    const { name, whatsapp, birth_date, area_id } = register.data;
    useEffect(() => {
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ name, whatsapp, birth_date, area_id }));
    }, [name, whatsapp, birth_date, area_id]);

    if (mode === 'login') {
        return (
            <Sheet open onClose={onClose} title="Masuk dulu untuk klaim" className="bg-white">
                <p className="text-ink-soft text-[12px] leading-relaxed">Supaya hadiah dan kartu cap kamu aman. Lanjut dengan WhatsApp dan PIN.</p>
                <form onSubmit={submitLogin} className="mt-4 space-y-3">
                    <label className="block">
                        <span className="mb-1.5 block text-[11px] font-semibold">Nomor WhatsApp</span>
                        <Input
                            inputMode="tel"
                            maxLength={WHATSAPP_MAX}
                            value={login.data.whatsapp}
                            onChange={(e) => login.setData('whatsapp', toWhatsapp(e.target.value))}
                            placeholder="08xx xxxx xxxx"
                        />
                    </label>
                    <label className="block">
                        <span className="mb-1.5 block text-[11px] font-semibold">PIN</span>
                        <PinInput
                            value={login.data.pin}
                            onChange={(e) => login.setData('pin', e.target.value.replace(/\D/g, ''))}
                            placeholder="4 angka"
                        />
                    </label>
                    {login.errors.pin && <span className="text-danger block text-[11px]">{login.errors.pin}</span>}
                    <PrimaryButton type="submit" disabled={login.processing}>
                        {login.processing ? 'Memeriksa...' : 'Masuk dan lanjut'}
                    </PrimaryButton>
                    <div className="flex items-center justify-between text-[11px]">
                        <button
                            type="button"
                            onClick={() => onModeChange('register')}
                            className="text-ink font-semibold underline underline-offset-2"
                        >
                            Belum punya akun? Daftar
                        </button>
                        <Link
                            href={login.data.whatsapp ? `/participant/lupa-pin?wa=${login.data.whatsapp}` : '/participant/lupa-pin'}
                            className="text-ink font-semibold underline underline-offset-2"
                        >
                            Lupa PIN?
                        </Link>
                    </div>
                </form>
            </Sheet>
        );
    }

    // Usia belum cukup: data tidak disimpan, isian dikosongkan, popup ditutup bersama form daftar.
    if (mode === 'register' && underage) {
        return (
            <NoticeSheet
                open
                onClose={() => {
                    sessionStorage.removeItem(DRAFT_KEY);
                    register.reset();
                    register.clearErrors();
                    onClose();
                }}
                tone="warn"
                icon="!"
                title="Belum bisa ikut"
                text="Kamu belum memenuhi syarat usia program ini. Data isianmu tidak disimpan."
                stacked
                primary={{ label: 'Tutup' }}
            />
        );
    }

    if (mode === 'register') {
        return (
            <Sheet open onClose={onClose} title="Daftar peserta" className="bg-white">
                <p className="text-ink-soft text-[12px] leading-relaxed">Isi data dasar untuk ikut program. Minimal 21 tahun.</p>
                <form onSubmit={submitRegister} className="mt-4 grid grid-cols-1 gap-3">
                    <label className="block">
                        <span className="mb-1.5 block text-[11px] font-semibold">Nama panggilan</span>
                        <Input value={register.data.name} onChange={(e) => register.setData('name', e.target.value)} placeholder="Nama panggilan" />
                        {register.errors.name && <span className="text-danger mt-1 block text-[11px]">{register.errors.name}</span>}
                    </label>
                    <label className="block">
                        <span className="mb-1.5 block text-[11px] font-semibold">Nomor WhatsApp</span>
                        <Input
                            inputMode="tel"
                            maxLength={WHATSAPP_MAX}
                            value={register.data.whatsapp}
                            onChange={(e) => register.setData('whatsapp', toWhatsapp(e.target.value))}
                            placeholder="08xx xxxx xxxx"
                        />
                        {register.errors.whatsapp && <span className="text-danger mt-1 block text-[11px]">{register.errors.whatsapp}</span>}
                    </label>
                    <label className="block">
                        <span className="mb-1.5 block text-[11px] font-semibold">Tanggal lahir</span>
                        <DateField
                            value={register.data.birth_date}
                            onChange={(v) => register.setData('birth_date', v)}
                            placeholder="Pilih tanggal lahir"
                        />
                        {register.errors.birth_date && <span className="text-danger mt-1 block text-[11px]">{register.errors.birth_date}</span>}
                    </label>
                    <label className="block">
                        <span className="mb-1.5 block text-[11px] font-semibold">Area kos</span>
                        <Select
                            value={register.data.area_id}
                            onChange={(v) => register.setData('area_id', v)}
                            options={areas.map((a) => ({ value: String(a.id), label: a.name }))}
                            placeholder="Pilih area kosmu"
                        />
                        {register.errors.area_id && <span className="text-danger mt-1 block text-[11px]">{register.errors.area_id}</span>}
                    </label>
                    <label className="block">
                        <span className="mb-1.5 block text-[11px] font-semibold">PIN 4 angka</span>
                        <PinInput
                            value={register.data.pin}
                            onChange={(e) => register.setData('pin', e.target.value.replace(/\D/g, ''))}
                            placeholder="4 angka"
                        />
                        {register.errors.pin && <span className="text-danger mt-1 block text-[11px]">{register.errors.pin}</span>}
                    </label>
                    <label className="block">
                        <span className="mb-1.5 block text-[11px] font-semibold">Ulangi PIN</span>
                        <PinInput
                            value={register.data.pin_confirmation}
                            onChange={(e) => register.setData('pin_confirmation', e.target.value.replace(/\D/g, ''))}
                            placeholder="Ketik ulang 4 angka"
                        />
                        {pinMismatch && <span className="text-danger mt-1 block text-[11px]">Ulangi PIN belum sama dengan PIN.</span>}
                    </label>
                    <Checkbox checked={registerAgree} onChange={setRegisterAgree}>
                        Saya setuju{' '}
                        <Link href="/participant/persetujuan" className="text-ink font-semibold underline underline-offset-2">
                            Syarat dan Ketentuan serta Kebijakan Privasi
                        </Link>
                        .
                    </Checkbox>
                    <PrimaryButton type="submit" disabled={!registerAgree || pinMismatch || register.processing}>
                        {register.processing ? 'Menyimpan...' : 'Daftar dan lanjut'}
                    </PrimaryButton>
                    <button
                        type="button"
                        onClick={() => onModeChange('login')}
                        className="text-ink text-[11px] font-semibold underline underline-offset-2"
                    >
                        Sudah punya akun? Masuk
                    </button>
                </form>
            </Sheet>
        );
    }

    return null;
}
