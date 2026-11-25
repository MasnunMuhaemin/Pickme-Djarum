import { Card } from '@/features/admin/ui';
import AdminLayout from '@/layouts/admin-layout';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';

type Stats = {
    claimsToday: number;
    toDispatch: number;
    fulfillment: number;
    fulfillmentBreakdown: string;
    usedSlots: number;
    totalSlots: number;
};

function Stat({ label, value, hint, href }: { label: string; value: number | string; hint: string; href?: string }) {
    const body = (
        <>
            <p className="text-ink/50 text-[11px] font-semibold">{label}</p>
            <p className="mt-1 text-[30px] leading-none font-extrabold tracking-tight">{value}</p>
            <p className="text-ink/50 mt-2 text-[11px]">{hint}</p>
        </>
    );
    const cls = 'block rounded-xl border border-ink/5 bg-white p-4';
    return href ? (
        <Link href={href} className={cn(cls, 'hover:border-ink/20 transition')}>
            {body}
        </Link>
    ) : (
        <div className={cls}>{body}</div>
    );
}

/** A1 Beranda: ringkasan hari ini dan tautan langsung ke antrean yang menumpuk. */
export default function Beranda({
    stats,
    perArea,
    outletCount,
    attention,
}: {
    stats: Stats;
    perArea: { name: string; used: number; total: number }[];
    outletCount: number;
    attention: { text: string; href: string; danger?: boolean }[];
}) {
    const max = Math.max(1, ...perArea.map((a) => a.used));

    return (
        <AdminLayout active="beranda" title="Beranda" subtitle="Ringkasan hari ini">
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                <Stat label="Klaim masuk hari ini" value={stats.claimsToday} hint="Foto diterima, hadiah langsung jadi milik peserta" />
                <Stat label="Voucher belum dikirim" value={stats.toDispatch} hint="Kirim kodenya lewat WhatsApp" href="/admin/kirim-voucher" />
                <Stat label="Antrean pemenuhan" value={stats.fulfillment} hint={stats.fulfillmentBreakdown} href="/admin/pemenuhan" />
                <Stat label="Slot terpakai" value={stats.usedSlots} hint={`dari ${stats.totalSlots} slot`} href="/admin/papan" />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                <Card title="Slot terpakai per area">
                    <div className="space-y-2.5">
                        {perArea.map((area) => (
                            <div key={area.name} className="grid grid-cols-[90px_minmax(0,1fr)_36px] items-center gap-3 text-[12px]">
                                <span className="truncate font-bold">{area.name}</span>
                                <span className="bg-ink/5 h-3.5 overflow-hidden rounded-full">
                                    <span
                                        className="border-ink bg-lime block h-full rounded-full border"
                                        style={{ width: `${(area.used / max) * 100}%` }}
                                    />
                                </span>
                                <span className="text-right font-bold">{area.used}</span>
                            </div>
                        ))}
                        {perArea.length === 0 && <p className="text-ink/50 text-[12px]">Belum ada titik.</p>}
                    </div>
                    <p className="text-ink/45 mt-3 text-[11px]">
                        Jumlah {stats.usedSlots} dari {stats.totalSlots} slot · {outletCount} titik
                    </p>
                </Card>

                <Card title="Perlu perhatian">
                    <div className="divide-ink/5 divide-y">
                        {attention.map((item) => (
                            <Link
                                key={item.text}
                                href={item.href}
                                className="hover:text-ink/70 flex items-center justify-between gap-3 py-2.5 text-[12px]"
                            >
                                <span className={cn(item.danger && 'font-bold text-[#b42318]')}>{item.text}</span>
                                <ChevronRight className="text-ink/40 size-4 shrink-0" />
                            </Link>
                        ))}
                    </div>
                </Card>
            </div>
        </AdminLayout>
    );
}
