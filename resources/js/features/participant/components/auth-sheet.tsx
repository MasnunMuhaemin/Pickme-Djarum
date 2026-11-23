import { Checkbox, DateField, Input, PrimaryButton, Select, Sheet } from '@/features/participant/components/ui';
import { deviceId } from '@/lib/device';
import { Link, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';

type Area = { id: number; name: string };
export type AuthMode = 'login' | 'register' | null;

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
    const register = useForm({ name: '', whatsapp: '', birth_date: '', area_id: '', pin: '', device_id: deviceId() });
    const [loginAgree, setLoginAgree] = useState(false);
    const [registerAgree, setRegisterAgree] = useState(false);

    function submitLogin(e: FormEvent) {
        e.preventDefault();
        login.post('/participant/masuk', { preserveScroll: true });
    }

    function submitRegister(e: FormEvent) {
        e.preventDefault();
        register.post('/participant/daftar', { preserveScroll: true });
    }

    if (mode === 'login') {
        return (
            <Sheet open onClose={onClose} title="Masuk dulu untuk klaim">
                <p className="text-ink-soft text-[12px] leading-relaxed">Supaya hadiah dan kartu cap kamu aman. Lanjut dengan WhatsApp dan PIN.</p>
                <form onSubmit={submitLogin} className="mt-4 space-y-3">
                    <label className="block">
                        <span className="mb-1.5 block text-[11px] font-semibold">Nomor WhatsApp</span>
                        <Input
                            inputMode="tel"
                            value={login.data.whatsapp}
                            onChange={(e) => login.setData('whatsapp', e.target.value)}
                            placeholder="08xx xxxx xxxx"
                        />
                    </label>
                    <label className="block">
                        <span className="mb-1.5 block text-[11px] font-semibold">PIN</span>
                        <Input
                            inputMode="numeric"
                            maxLength={4}
                            value={login.data.pin}
                            onChange={(e) => login.setData('pin', e.target.value)}
                            placeholder="4 angka"
                        />
                    </label>
                    {login.errors.pin && <span className="text-danger block text-[11px]">{login.errors.pin}</span>}
                    <Checkbox checked={loginAgree} onChange={setLoginAgree}>
                        Saya setuju Syarat dan Ketentuan serta Kebijakan Privasi.
                    </Checkbox>
                    <PrimaryButton type="submit" disabled={!loginAgree || login.processing}>
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
                        <Link href="/participant/lupa-pin" className="text-ink font-semibold underline underline-offset-2">
                            Lupa PIN?
                        </Link>
                    </div>
                </form>
            </Sheet>
        );
    }

    if (mode === 'register') {
        return (
            <Sheet open onClose={onClose} title="Daftar peserta">
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
                            value={register.data.whatsapp}
                            onChange={(e) => register.setData('whatsapp', e.target.value)}
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
                        <Input
                            inputMode="numeric"
                            maxLength={4}
                            value={register.data.pin}
                            onChange={(e) => register.setData('pin', e.target.value)}
                            placeholder="4 angka"
                        />
                        {register.errors.pin && <span className="text-danger mt-1 block text-[11px]">{register.errors.pin}</span>}
                    </label>
                    <Checkbox checked={registerAgree} onChange={setRegisterAgree}>
                        Saya setuju Syarat dan Ketentuan serta Kebijakan Privasi.
                    </Checkbox>
                    <PrimaryButton type="submit" disabled={!registerAgree || register.processing}>
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
