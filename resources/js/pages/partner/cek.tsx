import { Input, PrimaryButton, Sheet } from '@/features/participant/components/ui';
import { Eyebrow, PartnerPage } from '@/features/partner/partner-page';
import type { VoucherCard } from '@/pages/partner/kode';
import { useForm } from '@inertiajs/react';
import { Check } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';

type Refused = { state: 'redeemed' | 'cancelled' | 'not_mine' | 'not_ready' | 'unknown' | 'expired'; code: string };

const REASONS: Record<Refused['state'], { title: string; text: string }> = {
    redeemed: { title: 'Kode ini sudah ditukar', text: 'Voucher hanya bisa ditukar satu kali. Jangan layani lagi dengan kode ini.' },
    cancelled: { title: 'Voucher dibatalkan', text: 'Klaim voucher ini ditolak admin. Jangan layani kode ini.' },
    expired: { title: 'Voucher kadaluarsa', text: 'Masa berlakunya sudah lewat, jadi voucher ini tidak bisa ditukar.' },
    not_mine: { title: 'Bukan voucher mitra ini', text: 'Kode ini milik mitra lain. Arahkan peserta ke mitra yang tepat.' },
    not_ready: { title: 'Voucher belum dikirim', text: 'Kode baru bisa ditukar setelah berstatus terkirim. Minta peserta menunggu.' },
    unknown: { title: 'Kode tidak dikenal', text: 'Periksa lagi kodenya, lalu cek ulang.' },
};

/**
 * M2 Cek kode: mitra mengisi kode voucher dari peserta. Kode yang tidak bisa ditukar dan hasil tukar tampil sebagai
 * popup di layar ini; kode valid membuka kartu voucher dengan tombol Tukar sekarang.
 */
export default function CekKode({ result = null, redeemed = null }: { result?: Refused | null; redeemed?: VoucherCard | null }) {
    const form = useForm({ code: '' });
    const [refused, setRefused] = useState(result);
    const [done, setDone] = useState(redeemed);
    useEffect(() => setRefused(result), [result]);
    useEffect(() => setDone(redeemed), [redeemed]);

    function submit(e: FormEvent) {
        e.preventDefault();
        form.post('/mitra/cek');
    }

    /** Tutup popup, kosongkan isian, lalu siap mengetik kode berikutnya. */
    function checkAnother() {
        setRefused(null);
        form.setData('code', '');
        document.getElementById('kode-voucher')?.focus();
    }

    const reason = refused ? (REASONS[refused.state] ?? REASONS.unknown) : null;

    return (
        <PartnerPage title="Cek kode" nav="cek">
            <form onSubmit={submit}>
                <label className="block">
                    <span className="mb-2 block text-[13px] font-extrabold">Kode voucher</span>
                    <Input
                        id="kode-voucher"
                        autoFocus
                        autoComplete="off"
                        autoCapitalize="characters"
                        spellCheck={false}
                        value={form.data.code}
                        onChange={(e) => form.setData('code', e.target.value.toUpperCase())}
                        placeholder="Kode dari peserta"
                        className="font-mono tracking-wider uppercase placeholder:font-sans placeholder:tracking-normal placeholder:normal-case"
                    />
                </label>
                {form.errors.code && <p className="text-danger mt-2 text-[12px] font-semibold">{form.errors.code}</p>}
                <PrimaryButton type="submit" disabled={!form.data.code.trim() || form.processing} className="mt-4 h-12 text-[15px] font-extrabold">
                    {form.processing ? 'Memeriksa...' : 'Cek'}
                </PrimaryButton>
            </form>

            <Sheet open={Boolean(refused)} onClose={checkAnother}>
                {refused && reason && (
                    <div className="py-1">
                        <span className="text-danger grid size-14 place-items-center rounded-full bg-[#fbe3e0] text-[24px] font-extrabold">!</span>
                        <h2 className="mt-4 text-[22px] leading-tight font-extrabold tracking-tight">{reason.title}</h2>
                        <p className="text-ink-soft mt-1.5 text-[13px] leading-relaxed">{reason.text}</p>
                        <div className="border-ink/10 mt-4 rounded-2xl border bg-white px-4 py-2.5">
                            <Eyebrow className="text-ink-soft">Kode</Eyebrow>
                            <p className="mt-0.5 font-mono text-[15px] font-extrabold tracking-wider break-all">{refused.code}</p>
                        </div>
                        <PrimaryButton onClick={checkAnother} className="mt-4 h-12 text-[15px] font-extrabold">
                            Cek kode lain
                        </PrimaryButton>
                    </div>
                )}
            </Sheet>

            <Sheet open={Boolean(done)} onClose={() => setDone(null)}>
                {done && (
                    <div className="py-1">
                        <span className="bg-ink text-cream grid size-14 place-items-center rounded-full">
                            <Check className="size-7" strokeWidth={3.5} />
                        </span>
                        <h2 className="mt-4 text-[22px] leading-tight font-extrabold tracking-tight">Voucher sudah ditukar</h2>
                        <p className="text-ink-soft mt-1.5 text-[13px] leading-relaxed">
                            Layani {done.holder}: {done.title.replace(/^Voucher /, '')} {done.value}. Lalu foto produk yang diberikan sebagai bukti.
                            Kode {done.code} tidak bisa ditukar lagi.
                        </p>
                        <PrimaryButton href={`/mitra/kode/${done.code}/foto`} className="mt-4 h-12 text-[15px] font-extrabold">
                            Foto bukti
                        </PrimaryButton>
                    </div>
                )}
            </Sheet>
        </PartnerPage>
    );
}
