import { Field, Input, PageHeader, PrimaryButton, Select, Textarea } from '@/features/participant/components/ui';
import ParticipantLayout from '@/layouts/participant-layout';
import { MapPin } from 'lucide-react';
import { useState } from 'react';

const areas = [
    { value: 'w07', label: 'W07 - Warung Djarum' },
    { value: 'w08', label: 'W08 - Warung Melati' },
];

export default function Alamat() {
    const [area, setArea] = useState('');
    return (
        <ParticipantLayout nav="hadiah">
            <PageHeader back="/participant/hadiah" title="Alamat pengiriman" />
            <div className="flex-1 px-4 pb-8 lg:mx-auto lg:w-full lg:max-w-[760px] lg:px-8 lg:pt-2 lg:pb-10">
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                    <Field label="Nama penerima">
                        <Input defaultValue="Sisa" placeholder="Nama lengkap" />
                    </Field>
                    <Field label="Area pengiriman">
                        <Select value={area} onChange={setArea} options={areas} placeholder="Pilih area pengiriman" />
                    </Field>
                    <Field label="Nomor WhatsApp">
                        <Input inputMode="tel" placeholder="08xx xxxx xxxx" />
                    </Field>
                    <div className="lg:col-span-2">
                        <Field label="Alamat lengkap dan patokan">
                            <Textarea placeholder="Jalan, nomor rumah, RT/RW, kelurahan, kecamatan, kota." />
                        </Field>
                    </div>

                    <div className="lg:col-span-2">
                        <p className="mb-1.5 text-xs font-semibold">Titik peta</p>
                        <div className="border-ink/15 relative h-36 overflow-hidden rounded-xl border bg-[#e8e4d4] lg:h-52">
                            <div className="absolute inset-0 [background-image:linear-gradient(#c9c4b0_1px,transparent_1px),linear-gradient(90deg,#c9c4b0_1px,transparent_1px)] [background-size:22px_22px] opacity-50" />
                            <span className="absolute top-1/3 left-0 h-2 w-full bg-white/60" />
                            <span className="absolute top-0 left-2/3 h-full w-2 bg-white/60" />
                            <span className="bg-ink text-lime absolute top-1/2 left-1/2 grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full shadow-lg">
                                <MapPin className="size-4" />
                            </span>
                        </div>
                        <p className="text-ink-soft mt-1 text-[10px]">Ketuk peta untuk menandai lokasi. Kurir memakai titik ini.</p>
                    </div>

                    <div className="lg:col-span-2">
                        <Field label="Catatan untuk kurir (opsional)">
                            <Textarea placeholder="Contoh: pagar hijau, kirim sore hari." />
                        </Field>
                    </div>
                </div>

                <PrimaryButton href="/participant/terima-kasih" className="mt-5 lg:max-w-[260px]">
                    Kirim alamat
                </PrimaryButton>
            </div>
        </ParticipantLayout>
    );
}
