import { OutlineButton, PrimaryButton } from '@/features/participant/components/ui';
import { DoneBadge, PartnerPage } from '@/features/partner/partner-page';

/** Foto bukti tersimpan. */
export default function Selesai({ code }: { code: string }) {
    return (
        <PartnerPage
            title="Selesai"
            hideNav
            footer={
                <>
                    <PrimaryButton href="/mitra" className="h-12 text-[15px] font-extrabold">
                        Cek kode lain
                    </PrimaryButton>
                    <OutlineButton href="/mitra/rekap" className="h-12 text-[15px] font-extrabold">
                        Lihat rekap
                    </OutlineButton>
                </>
            }
        >
            <div className="pt-6 text-center">
                <DoneBadge />
                <h2 className="mt-6 text-[22px] font-extrabold tracking-tight">Bukti terkirim</h2>
                <p className="mt-1 text-[15px] font-extrabold">Voucher sudah ditukar</p>
                <p className="text-ink-soft mx-auto mt-2 max-w-[300px] text-[13px] leading-relaxed">
                    Foto bukti tersimpan. Kode {code} tidak bisa ditukar lagi.
                </p>
            </div>
        </PartnerPage>
    );
}
