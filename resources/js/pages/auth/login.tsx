import { Head, useForm } from '@inertiajs/react';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import InputError from '@/components/input-error';

interface LoginForm {
    email: string;
    password: string;
}

interface LoginProps {
    status?: string;
}

const inputClass =
    'h-12 w-full rounded-xl border border-ink/15 bg-white px-4 text-sm text-ink outline-none transition placeholder:text-ink-soft/60 focus:border-ink focus:ring-4 focus:ring-lime/40';

export default function Login({ status }: LoginProps) {
    const { data, setData, post, processing, errors, reset } = useForm<LoginForm>({
        email: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="bg-cream text-ink flex min-h-svh flex-col md:flex-row">
            <Head title="Masuk admin" />

            <section className="bg-night text-cream relative flex shrink-0 flex-col justify-between overflow-hidden px-8 pt-10 pb-12 md:w-1/2 md:p-14">
                {/* Banner ilustrasi kota di panel kiri, digelapkan supaya teks tetap terbaca. */}
                <img src="/images/banner.webp" alt="" aria-hidden className="absolute inset-0 size-full object-cover select-none" />
                <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-[#0d1b15]/55 via-[#0d1b15]/65 to-[#0d1b15]/90" />

                <img src="/images/logo.webp" alt="Papan Pick(me)" className="relative h-14 w-auto self-start md:h-16" />

                <div className="relative mt-10 md:mt-0">
                    <h1 className="font-marker -rotate-3 text-6xl leading-none text-white drop-shadow-[0_4px_0_rgba(0,0,0,0.35)] md:text-8xl">
                        BERBURU
                    </h1>
                    <span aria-hidden className="bg-lime mt-3 block h-2 w-40 -rotate-3 rounded-full md:w-64" />
                    <p className="text-cream/70 mt-6 max-w-sm text-sm leading-relaxed">
                        Panel admin untuk memantau papan, memverifikasi foto, dan mengirim hadiah peserta.
                    </p>
                </div>

                <p className="text-cream/40 relative mt-10 hidden text-[11px] md:block">Khusus tim pengelola program.</p>
            </section>

            <main className="flex flex-1 items-center justify-center px-6 py-10 md:px-14">
                <div className="w-full max-w-sm">
                    <h2 className="text-2xl font-extrabold tracking-tight">Masuk admin</h2>
                    <p className="text-ink-soft mt-1 text-sm">Gunakan email dan kata sandi akun admin Anda.</p>

                    {status && <div className="bg-lime-soft mt-6 rounded-xl px-4 py-3 text-sm font-medium">{status}</div>}

                    <form className="mt-8 grid gap-5" onSubmit={submit}>
                        <div className="grid gap-2">
                            <label htmlFor="email" className="text-xs font-bold">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                required
                                autoFocus
                                autoComplete="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="admin@contoh.com"
                                className={inputClass}
                            />
                            <InputError message={errors.email} />
                        </div>

                        <div className="grid gap-2">
                            <label htmlFor="password" className="text-xs font-bold">
                                Kata sandi
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    autoComplete="current-password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="••••••••"
                                    className={`${inputClass} pr-12`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                                    aria-pressed={showPassword}
                                    className="text-ink-soft hover:text-ink focus-visible:ring-lime/40 absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-xl outline-none focus-visible:ring-4"
                                >
                                    {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                                </button>
                            </div>
                            <InputError message={errors.password} />
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="bg-ink text-cream hover:bg-night focus-visible:ring-lime/50 mt-2 flex h-12 items-center justify-center gap-2 rounded-full text-sm font-extrabold transition focus-visible:ring-4 focus-visible:outline-none disabled:opacity-60"
                        >
                            {processing && <LoaderCircle className="size-4 animate-spin" />}
                            Masuk
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}
