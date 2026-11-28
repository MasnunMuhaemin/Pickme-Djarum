import { Btn, Card, Empty, SearchInput, Table, Td, useConfirm, useServerSearch } from '@/features/admin/ui';
import AdminLayout from '@/layouts/admin-layout';
import { cn } from '@/lib/utils';
import { Link, router } from '@inertiajs/react';
import { Download, Trash2, X } from 'lucide-react';
import { useState } from 'react';

type Log = { id: number; at: string; actor: string; actor_type: string; action: string; subject: string; detail: string };

/** A8 Log aktivitas: ekspor CSV, hapus per baris, dan bulk action (pilih beberapa log lalu ekspor atau hapus). Penghapusan ikut tercatat. */
export default function LogAktivitas({
    search,
    logs,
    pagination,
}: {
    search: string;
    logs: Log[];
    pagination: { current: number; last: number; total: number };
}) {
    const [confirm, confirmDialog] = useConfirm();
    // Pilihan bulk action hanya untuk log di halaman ini; pindah halaman atau cari mengosongkan pilihan.
    const [selected, setSelected] = useState<number[]>([]);
    const allOnPage = logs.length > 0 && logs.every((log) => selected.includes(log.id));
    const toggle = (id: number) => setSelected((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
    const toggleAll = () => setSelected(allOnPage ? [] : logs.map((log) => log.id));

    function askBulkDelete() {
        confirm({
            title: `Hapus ${selected.length} log terpilih?`,
            message: 'Log yang dihapus tidak bisa dikembalikan. Penghapusan ini dicatat sebagai satu log baru atas nama akunmu.',
            confirmLabel: `Hapus ${selected.length} log`,
            danger: true,
            onConfirm: () => router.post('/admin/log/hapus-massal', { ids: selected }, { preserveScroll: true, onSuccess: () => setSelected([]) }),
        });
    }
    const url = (page: number, q = search) => {
        const p = new URLSearchParams();
        if (q) p.set('q', q);
        if (page > 1) p.set('page', String(page));
        return `/admin/log${p.size ? `?${p}` : ''}`;
    };
    const [q, setQ] = useServerSearch(search, (value) => {
        setSelected([]);
        router.get(url(1, value), {}, { preserveState: true, preserveScroll: true, replace: true });
    });

    function askDelete(log: Log) {
        confirm({
            title: 'Hapus log ini?',
            message: (
                <>
                    <p>
                        {log.at} · {log.actor} · {log.action} · {log.subject}
                    </p>
                    <p className="mt-2">Log yang dihapus tidak bisa dikembalikan. Penghapusan ini dicatat sebagai log baru atas nama akunmu.</p>
                </>
            ),
            confirmLabel: 'Hapus log',
            danger: true,
            onConfirm: () => router.delete(`/admin/log/${log.id}`, { preserveScroll: true }),
        });
    }

    return (
        <AdminLayout active="log" title="Log aktivitas" subtitle="Bisa diekspor CSV · penghapusan log ikut tercatat">
            <Card
                right={
                    <a
                        href="/admin/log/ekspor"
                        className="bg-ink inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[11px] font-bold text-white"
                    >
                        <Download className="size-3.5" />
                        Ekspor CSV
                    </a>
                }
                title={`${pagination.total} catatan`}
            >
                <SearchInput value={q} onChange={setQ} placeholder="Cari pelaku, aksi, peserta, atau kode klaim" className="mb-3" />
                {selected.length > 0 && (
                    <div className="bg-lime-soft mb-3 flex flex-wrap items-center gap-2 rounded-xl px-3 py-2 text-[12px]">
                        <span className="font-extrabold">{selected.length} log dipilih</span>
                        <a
                            href={`/admin/log/ekspor?ids=${selected.join(',')}`}
                            className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-full bg-[#0b0b0b] px-3.5 text-[11px] font-bold text-white"
                        >
                            <Download className="size-3.5" />
                            Ekspor terpilih
                        </a>
                        <Btn variant="red" className="h-8 rounded-full" onClick={askBulkDelete}>
                            <Trash2 className="size-3.5" />
                            Hapus terpilih
                        </Btn>
                        <Btn variant="ghost" className="h-8 rounded-full" onClick={() => setSelected([])}>
                            <X className="size-3.5" />
                            Batal pilih
                        </Btn>
                    </div>
                )}
                {logs.length ? (
                    <Table
                        head={[
                            <input
                                key="all"
                                type="checkbox"
                                checked={allOnPage}
                                onChange={toggleAll}
                                aria-label="Pilih semua log di halaman ini"
                                className="accent-lime-dark size-4 align-middle"
                            />,
                            'Waktu',
                            'Pelaku',
                            'Aksi',
                            'Objek',
                            'Alasan/detail',
                            '',
                        ]}
                    >
                        {logs.map((log) => (
                            <tr key={log.id} className={cn(selected.includes(log.id) && 'bg-lime-soft/50')}>
                                <Td>
                                    <input
                                        type="checkbox"
                                        checked={selected.includes(log.id)}
                                        onChange={() => toggle(log.id)}
                                        aria-label={`Pilih log ${log.action}`}
                                        className="accent-lime-dark size-4 align-middle"
                                    />
                                </Td>
                                <Td className="text-ink/55 whitespace-nowrap">{log.at}</Td>
                                <Td className={cn('font-bold', log.actor_type === 'system' && 'text-ink/50')}>{log.actor}</Td>
                                <Td>{log.action}</Td>
                                <Td>{log.subject}</Td>
                                <Td className="text-ink/55 max-w-[260px] truncate">{log.detail}</Td>
                                <Td className="text-right">
                                    <button
                                        type="button"
                                        onClick={() => askDelete(log)}
                                        aria-label={`Hapus log ${log.action}`}
                                        title="Hapus log"
                                        className="grid size-7 place-items-center rounded-full text-[#b42318] hover:bg-[#fde0dc]"
                                    >
                                        <Trash2 className="size-3.5" />
                                    </button>
                                </Td>
                            </tr>
                        ))}
                    </Table>
                ) : (
                    <Empty>{search ? `Tidak ada log yang cocok dengan "${search}".` : 'Belum ada aktivitas.'}</Empty>
                )}
                {pagination.last > 1 && (
                    <div className="mt-3 flex items-center justify-end gap-2 text-[12px]">
                        {pagination.current > 1 && (
                            <Link
                                href={url(pagination.current - 1)}
                                onClick={() => setSelected([])}
                                className="border-ink/15 rounded-full border px-3 py-1 font-bold"
                            >
                                Sebelumnya
                            </Link>
                        )}
                        <span className="text-ink/50">
                            Halaman {pagination.current} dari {pagination.last}
                        </span>
                        {pagination.current < pagination.last && (
                            <Link
                                href={url(pagination.current + 1)}
                                onClick={() => setSelected([])}
                                className="border-ink/15 rounded-full border px-3 py-1 font-bold"
                            >
                                Berikutnya
                            </Link>
                        )}
                    </div>
                )}
            </Card>

            {confirmDialog}
        </AdminLayout>
    );
}
