import { OutlineButton, PrimaryButton } from '@/features/participant/components/ui';
import { Eyebrow, PartnerPage } from '@/features/partner/partner-page';
import { router } from '@inertiajs/react';
import { useState } from 'react';

export type VoucherCard = { code: string; title: string; value: string; holder: string };

/** Kode valid: kartu voucher dan tombol Tukar sekarang. Kode yang tidak bisa ditukar tampil sebagai popup di Cek kode. */
export default function HasilKode({ code, voucher }: { code: string; voucher: VoucherCard }) {
    const [processing, setProcessing] = useState(false);

    return (
        <PartnerPage
            title="Kode valid"
            back="/mitra"
            hideNav
            footer={
                <>
                    <PrimaryButton
                        disabled={processing}
                        onClick={() =>
                            // replace: setelah tukar, tombol kembali browser tidak membuka lagi kartu kode yang sudah ditukar.
                            router.post(
                                `/mitra/kode/${code}/tukar`,
                                {},
                                { replace: true, onStart: () => setProcessing(true), onFinish: () => setProcessing(false) },
                            )
                        }
                        className="h-12 text-[15px] font-extrabold"
                    >
                        {processing ? 'Menukar...' : 'Tukar sekarang'}
                    </PrimaryButton>
                    <OutlineButton href="/mitra" className="h-12 text-[15px] font-extrabold">
                        Batal
                    </OutlineButton>
                </>
            }
        >
            <div className="bg-ink text-cream rounded-3xl p-5">
                <div className="flex items-center justify-between gap-2">
                    <Eyebrow className="text-lime">Voucher valid</Eyebrow>
                    <span className="bg-lime text-ink rounded-full px-2.5 py-1 text-[11px] font-extrabold">Terkirim</span>
                </div>
                <p className="mt-3 text-[20px] leading-tight font-extrabold">{voucher.title}</p>
                <p className="text-lime mt-1 text-[34px] leading-none font-extrabold tracking-tight">{voucher.value}</p>
                <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="min-w-0">
                        <Eyebrow className="text-cream/60">Kode</Eyebrow>
                        <p className="mt-1 font-mono text-[15px] font-extrabold tracking-wider break-all">{voucher.code}</p>
                    </div>
                    <div className="min-w-0">
                        <Eyebrow className="text-cream/60">Nama penukar</Eyebrow>
                        <p className="mt-1 truncate text-[15px] font-extrabold">{voucher.holder}</p>
                    </div>
                </div>
            </div>
        </PartnerPage>
    );
}
