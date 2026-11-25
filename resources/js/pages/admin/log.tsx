import { Card, Empty, Table, Td, useConfirm } from '@/features/admin/ui';
import AdminLayout from '@/layouts/admin-layout';
import { cn } from '@/lib/utils';
import { Link, router } from '@inertiajs/react';
import { Download, Trash2 } from 'lucide-react';

type Log = { id: number; at: string; actor: string; actor_type: string; action: string; subject: string; detail: string };

/** A8 Log aktivitas: bisa diekspor CSV dan dihapus per baris (penghapusan ikut tercatat). */
export default function LogAktivitas({ logs, pagination }: { logs: Log[]; pagination: { current: number; last: number; total: number } }) {
    const [confirm, confirmDialog] = useConfirm();

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
                {logs.length ? (
                    <Table head={['Waktu', 'Pelaku', 'Aksi', 'Objek', 'Alasan/detail', '']}>
                        {logs.map((log) => (
                            <tr key={log.id}>
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
                    <Empty>Belum ada aktivitas.</Empty>
                )}
                {pagination.last > 1 && (
                    <div className="mt-3 flex items-center justify-end gap-2 text-[12px]">
                        {pagination.current > 1 && (
                            <Link
                                href={`/admin/log?page=${pagination.current - 1}`}
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
                                href={`/admin/log?page=${pagination.current + 1}`}
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
