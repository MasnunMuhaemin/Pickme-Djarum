import { PARTNER_TYPE_LABEL, PartnerDialog, type PartnerKind } from '@/features/admin/master';
import { Btn, BtnLink, Chip, Empty, Phone, SearchInput, matches, useConfirm } from '@/features/admin/ui';
import AdminLayout from '@/layouts/admin-layout';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { ChevronRight, MessageCircle, Pencil } from 'lucide-react';
import { useState } from 'react';

type PartnerRow = {
    id: number;
    name: string;
    kind: PartnerKind;
    outlet: string | null;
    whatsapp: string | null;
    wa: string | null;
    active: boolean;
    has_pin: boolean;
    types: number;
    type_names: string;
    address: string | null;
    maps_url: string | null;
    location: string;
    last_login: string | null;
};

type Tab = 'mitra' | 'warung';

function initialTab(): Tab {
    const q = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search).get('jenis');
    return q === 'warung' || q === 'outlet' ? 'warung' : 'mitra';
}

/**
 * Master data > Mitra & akun (PRD bagian 8). Tab Mitra berisi mitra voucher dan mitra kuota (dibedakan kolom Jenis);
 * tab Akun warung berisi akun PIN tiap warung titik.
 */
export default function MasterMitra({ partners, freeOutlets }: { partners: PartnerRow[]; freeOutlets: { id: number; name: string }[] }) {
    const [tab, setTab] = useState<Tab>(initialTab);
    const [editing, setEditing] = useState<PartnerRow | null | 'new'>(null);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [q, setQ] = useState('');
    const [confirm, confirmDialog] = useConfirm();
    const isOutlet = tab === 'warung';
    const inTab = partners.filter((p) => (isOutlet ? p.kind === 'outlet' : p.kind !== 'outlet'));
    const rows = inTab.filter((p) => matches(q, p.name, p.whatsapp, p.outlet, PARTNER_TYPE_LABEL[p.kind]));
    const selected = rows.find((p) => p.id === selectedId) ?? rows[0] ?? null;

    function switchTab(next: Tab) {
        setTab(next);
        setQ('');
        // Tab tersimpan di URL supaya setelah simpan admin tetap di tab yang sama.
        window.history.replaceState(window.history.state, '', `${window.location.pathname}?jenis=${next}`);
    }

    function actions(p: PartnerRow) {
        return (
            <>
                <Btn
                    variant="outline"
                    className="w-full justify-center rounded-full border-2"
                    onClick={() =>
                        confirm({
                            title: `${p.has_pin ? 'Reset' : 'Buat'} PIN ${p.name}?`,
                            message: p.has_pin
                                ? 'PIN lama langsung tidak berlaku. Berikan PIN baru ke pemilik akun.'
                                : 'PIN baru akan ditampilkan sekali.',
                            confirmLabel: p.has_pin ? 'Reset PIN' : 'Buat PIN',
                            danger: p.has_pin,
                            onConfirm: () => router.post(`/admin/mitra/${p.id}/pin`, {}, { preserveScroll: true }),
                        })
                    }
                >
                    {p.has_pin ? 'Reset PIN' : 'Buat PIN'}
                </Btn>
                <Btn
                    variant="outline"
                    className={cn('w-full justify-center rounded-full border-2', p.active && 'border-[#d0271d] text-[#b42318]')}
                    onClick={() =>
                        confirm({
                            title: `${p.active ? 'Nonaktifkan' : 'Aktifkan'} ${p.name}?`,
                            message: p.active ? 'Akun ini tidak bisa masuk dan menukar voucher sampai diaktifkan lagi.' : undefined,
                            confirmLabel: p.active ? 'Nonaktifkan' : 'Aktifkan',
                            danger: p.active,
                            onConfirm: () => router.post(`/admin/mitra/${p.id}/status`, {}, { preserveScroll: true }),
                        })
                    }
                >
                    {p.active ? 'Nonaktifkan akun' : 'Aktifkan akun'}
                </Btn>
            </>
        );
    }

    const whatsapp = (p: PartnerRow) => (p.whatsapp ? <Phone value={p.whatsapp} /> : <span className="font-bold text-[#b42318]">Belum diisi</span>);

    return (
        <AdminLayout active="md-mitra" title="Mitra dan pembayaran" subtitle="Akun, PIN, nama toko, dan tautan Google Maps mitra voucher.">
            <div className="flex flex-wrap gap-2">
                {(
                    [
                        ['mitra', 'Mitra', partners.filter((p) => p.kind !== 'outlet').length],
                        ['warung', 'Akun warung', partners.filter((p) => p.kind === 'outlet').length],
                    ] as const
                ).map(([key, label, count]) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => switchTab(key)}
                        className={cn(
                            'flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[12px] font-bold transition',
                            key === tab ? 'bg-ink text-white' : 'border-ink/10 hover:bg-ink/5 border bg-white',
                        )}
                    >
                        {label}
                        <span className={cn('rounded-full px-1.5 text-[10px]', key === tab ? 'bg-lime text-ink' : 'bg-ink/5')}>{count}</span>
                    </button>
                ))}
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[13px] font-extrabold">
                    {inTab.length} {isOutlet ? 'akun warung' : 'mitra'} · {inTab.filter((p) => p.active).length} aktif
                </p>
                <div className="flex flex-wrap items-center gap-2">
                    <SearchInput
                        value={q}
                        onChange={setQ}
                        placeholder={isOutlet ? 'Cari warung atau nama' : 'Cari nama mitra atau nomor'}
                        className="min-w-[140px] flex-1"
                    />
                    <Btn variant="yellow" className="rounded-full" onClick={() => setEditing('new')}>
                        {isOutlet ? 'Tambah akun warung' : 'Tambah mitra'}
                    </Btn>
                </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
                <section className="rounded-2xl bg-white p-3">
                    <div className="text-ink/50 hidden gap-3 px-3 py-2 text-[11px] font-semibold lg:grid lg:grid-cols-[minmax(0,1.5fr)_60px_110px_120px_80px_20px]">
                        <span>{isOutlet ? 'Warung' : 'Mitra'}</span>
                        <span>PIN</span>
                        <span>Terakhir masuk</span>
                        <span>{isOutlet ? 'WhatsApp' : 'Peta Google Maps'}</span>
                        <span>Status</span>
                        <span />
                    </div>
                    {rows.length === 0 && (
                        <Empty>{q ? `Tidak ada yang cocok dengan "${q}".` : isOutlet ? 'Belum ada akun warung.' : 'Belum ada mitra.'}</Empty>
                    )}
                    {rows.map((p) => (
                        <button
                            key={p.id}
                            type="button"
                            onClick={() => setSelectedId(p.id)}
                            className={cn(
                                'grid w-full grid-cols-2 gap-x-3 gap-y-1 rounded-xl px-3 py-3 text-left text-[12px] sm:grid-cols-[minmax(0,1.5fr)_60px_110px_120px_80px_20px] sm:items-center sm:gap-3',
                                selected?.id === p.id ? 'bg-lime' : 'hover:bg-cream/60',
                            )}
                        >
                            <span className="min-w-0">
                                <span className="block truncate text-[13px] font-extrabold">{isOutlet ? (p.outlet ?? p.name) : p.name}</span>
                                <span className="text-ink/50 block truncate text-[10px]">{isOutlet ? p.name : PARTNER_TYPE_LABEL[p.kind]}</span>
                            </span>
                            <span className="font-extrabold tracking-widest">{p.has_pin ? '••••' : '-'}</span>
                            <span className="text-ink/70">{p.last_login ?? 'Belum pernah'}</span>
                            <span>
                                {isOutlet ? whatsapp(p) : p.maps_url ? <Chip tone="green">Terisi</Chip> : <Chip tone="yellow">Belum diisi</Chip>}
                            </span>
                            <span>{p.active ? <Chip tone="green">Aktif</Chip> : <Chip>Nonaktif</Chip>}</span>
                            <ChevronRight className="hidden size-4 sm:block" />
                        </button>
                    ))}
                </section>

                {selected && (
                    <section className="rounded-2xl bg-white p-5">
                        <h2 className="text-[16px] font-extrabold">{isOutlet ? (selected.outlet ?? selected.name) : selected.name}</h2>
                        <p className="text-ink/50 text-[11px]">
                            {PARTNER_TYPE_LABEL[selected.kind]}
                            {selected.type_names ? ` · voucher ${selected.type_names.toLowerCase()}` : ''}
                        </p>
                        <dl className="divide-ink/5 mt-3 divide-y text-[12px]">
                            {(
                                [
                                    [isOutlet ? 'Pemilik/penjaga' : 'Nama toko', selected.name],
                                    ...(isOutlet ? [] : [['Alamat', selected.address ?? '-'] as const]),
                                    ['WhatsApp', selected.whatsapp ? <Phone key="wa" value={selected.whatsapp} /> : '-'],
                                    ['Status', selected.active ? 'Aktif' : 'Nonaktif'],
                                    ['PIN', selected.has_pin ? '••••' : 'Belum dibuat'],
                                    ['Terakhir masuk', selected.last_login ?? 'Belum pernah'],
                                ] as const
                            ).map(([label, value]) => (
                                <div key={label} className="flex justify-between gap-3 py-2">
                                    <dt className="text-ink/55">{label}</dt>
                                    <dd className="text-right font-extrabold">{value}</dd>
                                </div>
                            ))}
                            {!isOutlet && (
                                <div className="flex items-center justify-between gap-3 py-2">
                                    <dt className="text-ink/55">Tautan Google Maps</dt>
                                    <dd>{selected.maps_url ? <Chip tone="green">Terisi</Chip> : <Chip tone="yellow">Belum diisi</Chip>}</dd>
                                </div>
                            )}
                        </dl>
                        {!isOutlet && selected.maps_url && (
                            <>
                                <p className="bg-cream/70 border-ink/10 mt-2 truncate rounded-full border px-4 py-2 text-[11px]">
                                    {selected.maps_url.replace(/^https:\/\//, '')}
                                </p>
                                <BtnLink
                                    href={selected.maps_url}
                                    external
                                    variant="outline"
                                    className="mt-2 w-full justify-center rounded-full border-2"
                                >
                                    Buka di Google Maps
                                </BtnLink>
                            </>
                        )}
                        <div className="mt-3 space-y-2">
                            <Btn variant="yellow" className="w-full justify-center rounded-full" onClick={() => setEditing(selected)}>
                                <Pencil className="size-3.5" />
                                {isOutlet ? 'Edit data akun' : 'Edit data mitra dan tautan peta'}
                            </Btn>
                            {selected.wa ? (
                                <BtnLink href={selected.wa} external variant="outline" className="w-full justify-center rounded-full border-2">
                                    <MessageCircle className="size-3.5" />
                                    WhatsApp mitra
                                </BtnLink>
                            ) : (
                                <p className="text-ink/45 text-center text-[11px]">Isi nomor WhatsApp lewat Edit data untuk menghubungi mitra.</p>
                            )}
                            {actions(selected)}
                        </div>
                        <p className="text-ink/45 mt-3 text-[10px] leading-relaxed">
                            PIN baru ditampilkan sekali ke admin. {isOutlet ? '' : 'Tautan peta dilihat peserta di detail voucher.'}
                        </p>
                    </section>
                )}
            </div>

            {editing && (
                <PartnerDialog
                    partner={editing === 'new' ? null : editing}
                    outletAccount={isOutlet}
                    outlets={freeOutlets}
                    onClose={() => setEditing(null)}
                />
            )}
            {confirmDialog}
        </AdminLayout>
    );
}
