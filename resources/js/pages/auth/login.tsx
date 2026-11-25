import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

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
                <div aria-hidden className="bg-lime/20 absolute -top-24 -right-24 size-72 rounded-full blur-3xl" />
                <div aria-hidden className="bg-lime/10 absolute -bottom-32 -left-20 size-80 rounded-full blur-3xl" />

                <div className="relative flex items-center gap-2">
                    <span className="bg-lime text-ink grid size-8 place-items-center rounded-lg text-[11px] font-extrabold">P</span>
                    <span className="text-xs font-extrabold tracking-tight">PICKME</span>
                </div>

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
                            <input
                                id="password"
                                type="password"
                                required
                                autoComplete="current-password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="••••••••"
                                className={inputClass}
                            />
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
