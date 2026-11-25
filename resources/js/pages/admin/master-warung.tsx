import { type AreaOption, OutletDialog, type OutletRow } from '@/features/admin/master';
import { downloadQr } from '@/features/admin/qr';
import { Btn, BtnLink, Card, Chip, Empty, Phone, SearchInput, Table, Td, matches } from '@/features/admin/ui';
import AdminLayout from '@/layouts/admin-layout';
import { Download, Pencil } from 'lucide-react';
import { useState } from 'react';

/**
 * Master data > Warung (langkah terakhir): area kos dan jenis voucher sudah dibuat di menunya; di sini admin
 * memilih area kos yang dicakup warung dan jenis voucher yang masuk ke papannya.
 */
export default function MasterWarung({ outlets, areas, voucherTypes }: { outlets: OutletRow[]; areas: AreaOption[]; voucherTypes: AreaOption[] }) {
    const [editing, setEditing] = useState<OutletRow | null | 'new'>(null);
    const [q, setQ] = useState('');

    return (
        <AdminLayout active="md-warung" title="Warung" subtitle="Langkah 4: pilih area kos dan jenis voucher untuk papan tiap warung">
            <Card title={`${outlets.length} warung`} right={<Btn onClick={() => setEditing('new')}>Tambah warung</Btn>}>
                <SearchInput value={q} onChange={setQ} placeholder="Cari kode, nama, area, atau nomor" className="mb-3" />
                {outlets.length ? (
                    <Table head={['Kode', 'Warung', 'WhatsApp', 'Area kos', 'Voucher di papan', '']}>
                        {outlets
                            .filter((o) => matches(q, o.code, o.name, o.whatsapp, ...o.areas))
                            .map((o) => (
                                <tr key={o.id}>
                                    <Td className="font-extrabold">{o.code}</Td>
                                    <Td>{o.name}</Td>
                                    <Td>
                                        {o.whatsapp ? <Phone value={o.whatsapp} /> : <span className="font-bold text-[#b42318]">Belum diisi</span>}
                                    </Td>
                                    <Td className="whitespace-normal">
                                        <span className="flex max-w-[260px] flex-wrap gap-1">
                                            {o.areas.length ? o.areas.map((a) => <Chip key={a}>{a}</Chip>) : <Chip tone="red">Belum ada area</Chip>}
                                        </span>
                                    </Td>
                                    <Td>
                                        {o.voucher_types.length ? (
                                            <span title={o.voucher_types.join(', ')}>{o.voucher_types.length} jenis dipilih</span>
                                        ) : (
                                            <span className="text-ink/55">Semua jenis</span>
                                        )}
                                    </Td>
                                    <Td className="text-right">
                                        <span className="inline-flex gap-1.5">
                                            {o.wa && (
                                                <BtnLink href={o.wa} external variant="yellow">
                                                    WhatsApp
                                                </BtnLink>
                                            )}
                                            <Btn variant="outline" onClick={() => setEditing(o)}>
                                                <Pencil className="size-3.5" />
                                                Ubah
                                            </Btn>
                                            <Btn variant="ghost" onClick={() => downloadQr(o.qr, o.code)}>
                                                <Download className="size-3.5" />
                                                QR
                                            </Btn>
                                        </span>
                                    </Td>
                                </tr>
                            ))}
                    </Table>
                ) : (
                    <Empty>Belum ada warung.</Empty>
                )}
                <p className="text-ink/45 mt-3 text-[11px]">
                    Urutan: buat Area dan Jenis voucher dulu, lalu pilih di sini. Isi papan tiap warung bisa dilihat di menu Papan dan slot.
                </p>
            </Card>

            {editing && (
                <OutletDialog
                    outlet={editing === 'new' ? null : editing}
                    areas={areas}
                    voucherTypes={voucherTypes}
                    onClose={() => setEditing(null)}
                />
            )}
        </AdminLayout>
    );
}
