import { AddArea } from '@/features/admin/master';
import { Btn, Card, Chip, Empty, Table, Td, useConfirm } from '@/features/admin/ui';
import AdminLayout from '@/layouts/admin-layout';
import { router } from '@inertiajs/react';
import { useState } from 'react';

type AreaRow = { id: number; name: string; delivery: boolean; outlets: number };

/** Master data > Area (langkah 1): daftar area kos. Warung memilih area yang dicakupnya; area antar untuk hadiah barang. */
export default function MasterArea({ areas }: { areas: AreaRow[] }) {
    const [adding, setAdding] = useState(false);
    const [confirm, confirmDialog] = useConfirm();

    return (
        <AdminLayout active="md-area" title="Area" subtitle="Langkah 1: daftar area kos untuk warung, form daftar peserta, dan alamat hadiah">
            <Card title={`${areas.length} area`} right={<Btn onClick={() => setAdding(true)}>Tambah area</Btn>}>
                {areas.length ? (
                    <Table head={['Area kos', 'Dicakup warung', 'Antar hadiah barang', '']}>
                        {areas.map((a) => (
                            <tr key={a.id}>
                                <Td className="font-bold">{a.name}</Td>
                                <Td>{a.outlets}</Td>
                                <Td>{a.delivery ? <Chip tone="green">Area antar</Chip> : <Chip>Bukan area antar</Chip>}</Td>
                                <Td className="text-right">
                                    <Btn
                                        variant="outline"
                                        onClick={() =>
                                            confirm({
                                                title: a.delivery ? `Hapus ${a.name} dari area antar?` : `Jadikan ${a.name} area antar?`,
                                                message: a.delivery
                                                    ? 'Hadiah barang tidak lagi diantar ke alamat di area ini.'
                                                    : 'Hadiah barang bisa diantar ke alamat di area ini.',
                                                confirmLabel: 'Simpan',
                                                onConfirm: () => router.post(`/admin/master-data/area/${a.id}/antar`, {}, { preserveScroll: true }),
                                            })
                                        }
                                    >
                                        {a.delivery ? 'Hapus dari area antar' : 'Jadikan area antar'}
                                    </Btn>
                                </Td>
                            </tr>
                        ))}
                    </Table>
                ) : (
                    <Empty>Belum ada area.</Empty>
                )}
            </Card>

            {adding && <AddArea onClose={() => setAdding(false)} />}
            {confirmDialog}
        </AdminLayout>
    );
}
