import { LimePage } from '@/features/participant/components/lime-page';
import { Input, PrimaryButton, Select, Textarea } from '@/features/participant/components/ui';
import { useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

type Gift = { id: number; type: string; status: string };
type Defaults = { recipient: string };

/**
 * Alamat pengiriman merchandise dan limited edition: nama penerima (awal dari nama peserta), area dari daftar area
 * pengiriman, alamat lengkap dan patokan, catatan opsional (PRD bagian 14).
 */
export default function Alamat({ gift, defaults, areas = [] }: { gift?: Gift; defaults?: Defaults; areas?: string[] }) {
    const form = useForm({ recipient: defaults?.recipient ?? '', area: '', address: '', note: '' });

    function submit(e?: FormEvent) {
        e?.preventDefault();
        form.post(`/participant/alamat${gift ? `/${gift.id}` : ''}`, { preserveScroll: true });
    }

    return (
        <LimePage
            title="Alamat pengiriman"
            back="/participant/hadiah"
            nav="hadiah"
            hideBottomNav
            footer={
                <PrimaryButton onClick={() => submit()} disabled={form.processing} className="h-13 text-[15px] font-extrabold">
                    {form.processing ? 'Menyimpan...' : 'Kirim alamat'}
                </PrimaryButton>
            }
        >
            <form onSubmit={submit} className="space-y-4">
                <label className="block">
                    <span className="mb-2 block text-[13px] font-extrabold">Nama penerima</span>
                    <Input value={form.data.recipient} onChange={(e) => form.setData('recipient', e.target.value)} placeholder="Nama penerima" />
                    {form.errors.recipient && <span className="text-danger mt-1 block text-[11px]">{form.errors.recipient}</span>}
                </label>
                <div>
                    <span className="mb-2 block text-[13px] font-extrabold">Area</span>
                    <Select
                        value={form.data.area}
                        onChange={(v) => form.setData('area', v)}
                        options={areas.map((area) => ({ value: area, label: area }))}
                        placeholder="Pilih area pengiriman"
                    />
                    {form.errors.area && <span className="text-danger mt-1 block text-[11px]">{form.errors.area}</span>}
                </div>
                <label className="block">
                    <span className="mb-2 block text-[13px] font-extrabold">Alamat lengkap dan patokan</span>
                    <Textarea
                        value={form.data.address}
                        maxLength={200}
                        onChange={(e) => form.setData('address', e.target.value)}
                        placeholder="Jalan, nomor, patokan (10 sampai 200 karakter)"
                    />
                    {form.errors.address && <span className="text-danger mt-1 block text-[11px]">{form.errors.address}</span>}
                </label>
                <label className="block">
                    <span className="mb-2 block text-[13px] font-extrabold">Catatan untuk pengantar (opsional)</span>
                    <Input value={form.data.note} onChange={(e) => form.setData('note', e.target.value)} placeholder="Misal: titip ke satpam" />
                </label>
                <p className="text-ink-soft text-[12px]">Hadiah hanya diantar di area yang tersedia.</p>
            </form>
        </LimePage>
    );
}
