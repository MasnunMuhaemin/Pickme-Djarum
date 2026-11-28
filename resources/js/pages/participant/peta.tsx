import { lastMenuHref } from '@/features/participant/components/bottom-nav';
import { LimePage } from '@/features/participant/components/lime-page';
import { Sheet } from '@/features/participant/components/ui';
import { cn } from '@/lib/utils';
import type { Map as LeafletMap } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Minus, Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type Outlet = {
    key: string;
    code: string;
    label: string;
    name: string;
    area: string | null;
    left: number;
    total: number;
    lat: number;
    lng: number;
    maps: string;
};
type Partner = { key: string; name: string; voucher: string | null; value: string | null; lat: number; lng: number; maps: string };
type Campus = { name: string; short: string; lat: number; lng: number };
type Filter = 'semua' | 'warung' | 'mitra';
type Picked = { kind: 'warung'; item: Outlet } | { kind: 'mitra'; item: Partner } | null;

const PIN = 'grid place-items-center border-2 border-white font-extrabold shadow-[0_2px_6px_rgba(0,0,0,0.3)]';

/** Peta peserta (desain): pin papan warung (lime), mitra voucher (hitam), dan kampus (kuning). Ketuk pin membuka popup. */
export default function Peta({ outlets, partners, campus }: { outlets: Outlet[]; partners: Partner[]; campus: Campus }) {
    const el = useRef<HTMLDivElement>(null);
    const map = useRef<LeafletMap | null>(null);
    const [filter, setFilter] = useState<Filter>('semua');
    const [picked, setPicked] = useState<Picked>(null);
    // Chevron kembali ke menu utama terakhir (mis. Hadiahku), bukan ke halaman detail seperti voucher.
    const [backTo, setBackTo] = useState('/participant');
    useEffect(() => setBackTo(lastMenuHref()), []);

    useEffect(() => {
        let layer: { remove: () => void } | null = null;
        let cancelled = false;
        // Leaflet butuh window: dimuat di browser saja.
        import('leaflet').then((L) => {
            if (cancelled || !el.current) return;
            if (!map.current) {
                map.current = L.map(el.current, { zoomControl: false, attributionControl: true }).setView([campus.lat, campus.lng], 15);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19,
                    attribution: '&copy; OpenStreetMap',
                }).addTo(map.current);
            }
            const icon = (html: string, size: number) => L.divIcon({ html, className: '', iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
            const group = L.featureGroup();
            L.marker([campus.lat, campus.lng], {
                icon: icon(`<span class="${PIN} size-10 rounded-full bg-[#f2b134] text-[13px] text-black">${campus.short}</span>`, 40),
                keyboard: false,
            })
                .bindTooltip(campus.name, { permanent: true, direction: 'bottom', offset: [0, 18], className: 'peta-label' })
                .addTo(group);
            if (filter !== 'mitra') {
                outlets.forEach((o) =>
                    L.marker([o.lat, o.lng], {
                        icon: icon(`<span class="${PIN} size-9 rounded-full bg-[#8fc31f] text-[12px] text-black">${o.label}</span>`, 36),
                        title: o.name,
                    })
                        .on('click', () => setPicked({ kind: 'warung', item: o }))
                        .addTo(group),
                );
            }
            if (filter !== 'warung') {
                partners.forEach((p) =>
                    L.marker([p.lat, p.lng], {
                        icon: icon(`<span class="${PIN} size-8 rounded-lg bg-[#0b0b0b] text-[12px] text-[#8fc31f]">M</span>`, 32),
                        title: p.name,
                    })
                        .on('click', () => setPicked({ kind: 'mitra', item: p }))
                        .addTo(group),
                );
            }
            group.addTo(map.current);
            layer = group;
            if (group.getLayers().length > 1) map.current.fitBounds(group.getBounds(), { padding: [40, 40], maxZoom: 16 });
        });
        return () => {
            cancelled = true;
            layer?.remove();
        };
    }, [filter, outlets, partners, campus]);

    useEffect(() => () => void map.current?.remove(), []);

    // Tanpa navbar bawah: peta mengisi layar sampai bawah.
    return (
        <LimePage title="Peta" back={backTo} backExact nav="peta" hideBottomNav panelClassName="p-0 md:p-0 [&>div]:flex [&>div]:flex-col">
            <div className="relative isolate min-h-[420px] flex-1 overflow-hidden rounded-t-[2rem] md:rounded-[2rem]">
                <div ref={el} className="absolute inset-0 z-0" aria-label="Peta papan warung dan mitra voucher" />

                <div className="absolute top-4 right-4 left-4 z-[1000] flex gap-2 overflow-x-auto [scrollbar-width:none]">
                    {(
                        [
                            ['semua', 'Semua'],
                            ['warung', 'Papan warung'],
                            ['mitra', 'Mitra voucher'],
                        ] as const
                    ).map(([key, label]) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setFilter(key)}
                            aria-pressed={filter === key}
                            className={cn(
                                'h-10 shrink-0 rounded-full px-4 text-[13px] font-extrabold shadow-[0_2px_8px_rgba(0,0,0,0.12)]',
                                filter === key ? 'bg-[#0b0b0b] text-white' : 'text-ink bg-white',
                            )}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <div className="absolute top-20 right-4 z-[1000] flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.12)]">
                    <button type="button" onClick={() => map.current?.zoomIn()} aria-label="Perbesar" className="grid size-11 place-items-center">
                        <Plus className="size-5" strokeWidth={2.5} />
                    </button>
                    <span className="mx-2 border-t border-[#e3dcb0]" />
                    <button type="button" onClick={() => map.current?.zoomOut()} aria-label="Perkecil" className="grid size-11 place-items-center">
                        <Minus className="size-5" strokeWidth={2.5} />
                    </button>
                </div>

                <div className="absolute right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-[1000] rounded-2xl bg-white px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.12)]">
                    <p className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] font-bold">
                        <span className="flex items-center gap-1.5">
                            <span className="bg-lime size-3 rounded-full" /> Papan warung
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="size-3 rounded-sm bg-[#0b0b0b]" /> Mitra voucher
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="size-3 rounded-full bg-[#f2b134]" /> Kampus
                        </span>
                    </p>
                    <p className="text-ink-soft mt-1 text-[11px]">
                        {outlets.length + partners.length
                            ? 'Ketuk pin untuk lihat info dan buka Google Maps.'
                            : 'Titik warung dan mitra belum diisi admin.'}
                    </p>
                </div>
            </div>

            <Sheet open={picked !== null} onClose={() => setPicked(null)}>
                {picked?.kind === 'warung' && (
                    <div>
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-lime rounded-full bg-[#0b0b0b] px-3 py-1 text-[11px] font-extrabold tracking-wide uppercase">
                                Papan warung
                            </span>
                            <span className="bg-lime rounded-full px-3 py-1 text-[11px] font-extrabold">{picked.item.code}</span>
                        </div>
                        <h2 className="mt-3 text-[24px] leading-tight font-extrabold text-[#0b0b0b]">{picked.item.name}</h2>
                        {picked.item.area && <p className="text-ink-soft mt-1 text-[14px]">{picked.item.area}</p>}
                        <p className="mt-4 text-[14px] font-extrabold">
                            Sisa {picked.item.left} dari {picked.item.total} hadiah
                        </p>
                        <span className="mt-2 block h-2.5 overflow-hidden rounded-full bg-[#e3dcb0]">
                            <span
                                className="bg-lime block h-full rounded-full"
                                style={{ width: `${picked.item.total ? (picked.item.left / picked.item.total) * 100 : 0}%` }}
                            />
                        </span>
                        <SheetActions maps={picked.item.maps} onClose={() => setPicked(null)} />
                    </div>
                )}
                {picked?.kind === 'mitra' && (
                    <div>
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-lime rounded-full bg-[#0b0b0b] px-3 py-1 text-[11px] font-extrabold tracking-wide uppercase">
                                Mitra voucher
                            </span>
                            {picked.item.value && (
                                <span className="bg-lime rounded-full px-3 py-1 text-[11px] font-extrabold">{picked.item.value}</span>
                            )}
                        </div>
                        <h2 className="mt-3 text-[24px] leading-tight font-extrabold text-[#0b0b0b]">{picked.item.name}</h2>
                        <p className="text-ink-soft mt-1 text-[14px]">Tukar voucher di sini.</p>
                        {picked.item.voucher && (
                            <div className="mt-4 rounded-2xl bg-white px-4 py-3">
                                <p className="text-[14px] font-extrabold">{picked.item.voucher}</p>
                                <p className="text-ink-soft mt-0.5 text-[12px]">
                                    Tunjukkan kode voucher ke kasir. Satu kode hanya bisa ditukar satu kali.
                                </p>
                            </div>
                        )}
                        <SheetActions maps={picked.item.maps} onClose={() => setPicked(null)} />
                    </div>
                )}
            </Sheet>
        </LimePage>
    );
}

function SheetActions({ maps, onClose }: { maps: string; onClose: () => void }) {
    return (
        <div className="mt-5 space-y-3">
            <a
                href={maps}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-lime flex h-14 items-center justify-center gap-2 rounded-full text-[15px] font-extrabold"
            >
                <MapPin className="size-5" /> Buka di Google Maps
            </a>
            <button type="button" onClick={onClose} className="border-ink h-14 w-full rounded-full border-2 text-[15px] font-extrabold">
                Tutup
            </button>
        </div>
    );
}
