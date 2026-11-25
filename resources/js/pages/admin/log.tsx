import { Card, Empty, Table, Td } from '@/features/admin/ui';
import AdminLayout from '@/layouts/admin-layout';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { Download } from 'lucide-react';

type Log = { id: number; at: string; actor: string; actor_type: string; action: string; subject: string; detail: string };

/** A8 Log aktivitas: tidak bisa diubah, bisa diekspor CSV. */
export default function LogAktivitas({ logs, pagination }: { logs: Log[]; pagination: { current: number; last: number; total: number } }) {
    return (
        <AdminLayout active="log" title="Log aktivitas" subtitle="Tidak bisa diubah · bisa diekspor CSV">
            <Card
                right={
                    <a
                        href="/admin/log/ekspor"
                        className="inline-flex h-8 items-center gap-1.5 rounded-full bg-black px-3.5 text-[11px] font-bold text-white"
                    >
                        <Download className="size-3.5" />
                        Ekspor CSV
                    </a>
                }
                title={`${pagination.total} catatan`}
            >
                {logs.length ? (
                    <Table head={['Waktu', 'Pelaku', 'Aksi', 'Objek', 'Alasan/detail']}>
                        {logs.map((log) => (
                            <tr key={log.id}>
                                <Td className="whitespace-nowrap text-black/55">{log.at}</Td>
                                <Td className={cn('font-bold', log.actor_type === 'system' && 'text-black/50')}>{log.actor}</Td>
                                <Td>{log.action}</Td>
                                <Td>{log.subject}</Td>
                                <Td className="max-w-[260px] truncate text-black/55">{log.detail}</Td>
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
                                className="rounded-full border border-black/15 px-3 py-1 font-bold"
                            >
                                Sebelumnya
                            </Link>
                        )}
                        <span className="text-black/50">
                            Halaman {pagination.current} dari {pagination.last}
                        </span>
                        {pagination.current < pagination.last && (
                            <Link
                                href={`/admin/log?page=${pagination.current + 1}`}
                                className="rounded-full border border-black/15 px-3 py-1 font-bold"
                            >
                                Berikutnya
                            </Link>
                        )}
                    </div>
                )}
            </Card>
        </AdminLayout>
    );
}
