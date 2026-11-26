import { NoticeSheet, PinInput, PrimaryButton } from '@/features/participant/components/ui';
import { PartnerPage } from '@/features/partner/partner-page';
import { useForm } from '@inertiajs/react';
import { FormEvent, useEffect, useState } from 'react';

/** M1 Masuk mitra: satu isian PIN dari admin. */
export default function MasukMitra({ adminWhatsapp }: { adminWhatsapp?: string | null }) {
    const form = useForm({ pin: '' });
    const [wrong, setWrong] = useState(false);
    const adminLink = adminWhatsapp
        ? `https://wa.me/${adminWhatsapp}?text=${encodeURIComponent('Halo admin Pickme, saya mitra dan lupa PIN. Mohon dibantu.')}`
        : null;

    // "PIN salah" tampil sebagai lembar bawah; pesan lain (mis. terlalu banyak percobaan) tetap di bawah isian.
    useEffect(() => setWrong(form.errors.pin === 'PIN salah.'), [form.errors.pin]);

    function submit(e: FormEvent) {
        e.preventDefault();
        form.post('/mitra/masuk', { onError: () => form.reset('pin') });
    }

    return (
        <PartnerPage title="Masuk mitra">
            <form onSubmit={submit}>
                <label className="block">
                    <span className="mb-2 block text-[13px] font-extrabold">PIN mitra</span>
                    <PinInput
                        autoFocus
                        value={form.data.pin}
                        onChange={(e) => form.setData('pin', e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="PIN dari admin"
                        aria-invalid={Boolean(form.errors.pin)}
                    />
                </label>
                {form.errors.pin && !wrong && <p className="text-danger mt-2 text-[12px] font-semibold">{form.errors.pin}</p>}

                <PrimaryButton
                    type="submit"
                    disabled={form.data.pin.length !== 4 || form.processing}
                    className="mt-4 h-12 text-[15px] font-extrabold"
                >
                    {form.processing ? 'Memeriksa...' : 'Masuk'}
                </PrimaryButton>

                {adminLink && (
                    <a
                        href={adminLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-ink mx-auto mt-4 block w-fit text-[12px] font-semibold underline underline-offset-2"
                    >
                        Lupa PIN? Hubungi admin
                    </a>
                )}
            </form>

            <NoticeSheet
                open={wrong}
                onClose={() => setWrong(false)}
                tone="dark"
                icon="!"
                stacked
                title="PIN salah"
                text="Periksa lagi PIN dari admin. Salah berulang akan membatasi percobaan."
                primary={{ label: 'Coba lagi', onClick: () => setWrong(false) }}
                secondary={adminLink ? { label: 'Hubungi admin', onClick: () => window.open(adminLink, '_blank', 'noopener') } : undefined}
            />
        </PartnerPage>
    );
}
