import { Input, PageHeader, PrimaryButton, Select, Textarea, toWhatsapp, WHATSAPP_MAX } from '@/features/participant/components/ui';
import ParticipantLayout from '@/layouts/participant-layout';
import { useForm } from '@inertiajs/react';
import { MapPin } from 'lucide-react';
import { FormEvent } from 'react';

type Gift = { id: number; type: string; status: string };

export default function Alamat({ gift }: { gift?: Gift }) {
    const form = useForm({ recipient: '', whatsapp: '', area: '', address: '', note: '' });

    function submit(e: FormEvent) {
        e.preventDefault();
        form.post(`/participant/alamat${gift ? `/${gift.id}` : ''}`, { preserveScroll: true });
    }

    return (
        <ParticipantLayout nav="hadiah">
            <PageHeader back="/participant/hadiah" title="Alamat pengiriman" />
            <form onSubmit={submit} className="flex-1 px-4 pb-8 md:mx-auto md:w-full md:max-w-[760px] md:px-8 md:pt-2 md:pb-10">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <label className="block">
                        <span className="text-ink mb-1.5 block text-xs font-semibold">Nama penerima</span>
                        <Input value={form.data.recipient} onChange={(e) => form.setData('recipient', e.target.value)} placeholder="Nama lengkap" />
                        {form.errors.recipient && <span className="text-danger mt-1 block text-[11px]">{form.errors.recipient}</span>}
                    </label>
                    <label className="block">
                        <span className="text-ink mb-1.5 block text-xs font-semibold">Area pengiriman</span>
                        <Select
                            value={form.data.area}
                            onChange={(v) => form.setData('area', v)}
                            options={[
                                { value: 'Sukabirus', label: 'Sukabirus' },
                                { value: 'Sukapura', label: 'Sukapura' },
                            ]}
                            placeholder="Pilih area pengiriman"
                        />
                        {form.errors.area && <span className="text-danger mt-1 block text-[11px]">{form.errors.area}</span>}
                    </label>
                    <label className="block md:col-span-2">
                        <span className="text-ink mb-1.5 block text-xs font-semibold">Nomor WhatsApp</span>
                        <Input
                            inputMode="tel"
                            maxLength={WHATSAPP_MAX}
                            value={form.data.whatsapp}
                            onChange={(e) => form.setData('whatsapp', toWhatsapp(e.target.value))}
                            placeholder="08xx xxxx xxxx"
                        />
                        {form.errors.whatsapp && <span className="text-danger mt-1 block text-[11px]">{form.errors.whatsapp}</span>}
                    </label>
                    <label className="block md:col-span-2">
                        <span className="text-ink mb-1.5 block text-xs font-semibold">Alamat lengkap dan patokan</span>
                        <Textarea
                            value={form.data.address}
                            onChange={(e) => form.setData('address', e.target.value)}
                            placeholder="Jalan, nomor rumah, RT/RW, kelurahan, kecamatan, kota."
                        />
                        {form.errors.address && <span className="text-danger mt-1 block text-[11px]">{form.errors.address}</span>}
                    </label>
                    <div className="md:col-span-2">
                        <p className="mb-1.5 text-xs font-semibold">Titik peta</p>
                        <div className="border-ink/15 relative h-36 overflow-hidden rounded-xl border bg-[#e8e4d4] md:h-52">
                            <div className="absolute inset-0 [background-image:linear-gradient(#c9c4b0_1px,transparent_1px),linear-gradient(90deg,#c9c4b0_1px,transparent_1px)] [background-size:22px_22px] opacity-50" />
                            <span className="bg-ink text-lime absolute top-1/2 left-1/2 grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full shadow-lg">
                                <MapPin className="size-4" />
                            </span>
                        </div>
                    </div>
                    <label className="block md:col-span-2">
                        <span className="text-ink mb-1.5 block text-xs font-semibold">Catatan untuk kurir (opsional)</span>
                        <Textarea
                            value={form.data.note}
                            onChange={(e) => form.setData('note', e.target.value)}
                            placeholder="Contoh: pagar hijau, kirim sore hari."
                        />
                    </label>
                </div>

                <PrimaryButton type="submit" disabled={form.processing} className="mt-5 md:max-w-[260px]">
                    {form.processing ? 'Menyimpan...' : 'Kirim alamat'}
                </PrimaryButton>
            </form>
        </ParticipantLayout>
    );
}
