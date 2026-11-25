import {
    Btn,
    BtnLink,
    Card,
    Chip,
    DateInput,
    Empty,
    FieldError,
    Hint,
    Modal,
    Phone,
    PillTabs,
    Req,
    RequiredNote,
    SearchInput,
    Table,
    Td,
    TextInput,
    matches,
} from '@/features/admin/ui';
import AdminLayout from '@/layouts/admin-layout';
import { router, useForm } from '@inertiajs/react';
import { Copy } from 'lucide-react';
import { useState } from 'react';

type Person = { id: number; name: string; whatsapp: string };
type Token = Person & { value: string; destination: string | null; failed: number; max: number; status: string };
type Fuel = Person & { value: string; status: string; handed: string | null; wa: string | null };
type Good = {
    id: number;
    name: string;
    prize: string;
    area: string | null;
    address: string | null;
    status: string;
    shipped_at: string | null;
    completed_at: string | null;
};
type Help = Person & { value: string; destination: string | null; failed: number; max: number; wa: string | null };

function Who({ p }: { p: Person }) {
    return (
        <div>
            <p className="font-extrabold">{p.name}</p>
            <Phone value={p.whatsapp} className="text-ink/45 text-[10px]" />
        </div>
    );
}

function TokenRow({ row }: { row: Token }) {
    const [reference, setReference] = useState('');
    const [failOpen, setFailOpen] = useState(false);
    const fail = useForm({ reason: '' });
    const ready = row.status === 'pending_process';

    return (
        <tr>
            <Td>
                <Who p={row} />
            </Td>
            <Td className="font-bold">{row.value}</Td>
            <Td>
                {row.destination ? (
                    <span className="flex items-center gap-2">
                        <span className="font-mono">{row.destination}</span>
                        <Btn variant="outline" className="h-6 px-2 text-[10px]" onClick={() => navigator.clipboard?.writeText(row.destination ?? '')}>
                            <Copy className="size-3" />
                            Salin
                        </Btn>
                    </span>
                ) : (
                    <Chip>{row.status === 'rejected' ? 'Menunggu isi ulang' : 'Menunggu nomor'}</Chip>
                )}
            </Td>
            <Td>
                {row.failed}/{row.max}
            </Td>
            <Td>
                <TextInput
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="No. referensi agregator *"
                    aria-label="Nomor referensi agregator (wajib untuk Berhasil)"
                    disabled={!ready}
                    className="w-44 rounded-full"
                />
            </Td>
            <Td>
                <span className="flex gap-1.5">
                    <Btn
                        variant="black"
                        disabled={!ready || !reference.trim()}
                        onClick={() => router.post(`/admin/pemenuhan/token/${row.id}/berhasil`, { reference }, { preserveScroll: true })}
                    >
                        Berhasil
                    </Btn>
                    <Btn variant="outline" disabled={!ready} onClick={() => setFailOpen(true)}>
                        Gagal
                    </Btn>
                </span>
                <Modal open={failOpen} onClose={() => setFailOpen(false)}>
                    <h3 className="text-[15px] font-extrabold">Tandai gagal · {row.name}</h3>
                    <p className="text-ink/55 mt-1 text-[12px]">
                        Hitungan gagal bertambah ({row.failed + 1}/{row.max}). Peserta diminta mengisi ulang nomor; setelah batas, masuk Perlu bantuan
                        admin.
                    </p>
                    <RequiredNote />
                    <label className="mt-3 block text-[11px] font-bold">
                        Alasan gagal
                        <Req />
                        <TextInput value={fail.data.reason} onChange={(e) => fail.setData('reason', e.target.value)} className="mt-1" />
                        <Hint>Mis. nomor meter tidak terdaftar di PLN. Peserta diminta mengisi ulang nomornya.</Hint>
                    </label>
                    <FieldError message={fail.errors.reason} />
                    <div className="mt-4 flex justify-end gap-2">
                        <Btn variant="outline" onClick={() => setFailOpen(false)}>
                            Batal
                        </Btn>
                        <Btn
                            variant="red"
                            disabled={!fail.data.reason.trim() || fail.processing}
                            onClick={() =>
                                fail.post(`/admin/pemenuhan/token/${row.id}/gagal`, { preserveScroll: true, onSuccess: () => setFailOpen(false) })
                            }
                        >
                            Tandai gagal
                        </Btn>
                    </div>
                </Modal>
            </Td>
        </tr>
    );
}

function FuelRow({ row }: { row: Fuel }) {
    const [open, setOpen] = useState(false);
    const form = useForm({ date: new Date().toISOString().slice(0, 10), recipient: row.name });
    const statusChip =
        row.status === 'pending' ? (
            <Chip tone="yellow">Menunggu</Chip>
        ) : row.status === 'contacted' ? (
            <Chip tone="green">Dihubungi</Chip>
        ) : (
            <Chip tone="black">Diserahkan</Chip>
        );

    return (
        <tr>
            <Td>
                <Who p={row} />
            </Td>
            <Td className="font-bold">{row.value}</Td>
            <Td>{statusChip}</Td>
            <Td>
                {row.status === 'handed_over' ? (
                    <span className="text-ink/55">{row.handed}</span>
                ) : (
                    <span className="flex flex-wrap gap-1.5">
                        {row.status === 'pending' && row.wa && (
                            <a
                                href={row.wa}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => router.post(`/admin/pemenuhan/bensin/${row.id}/hubungi`, {}, { preserveScroll: true })}
                                className="bg-lime inline-flex h-8 items-center rounded-full px-3.5 text-[11px] font-bold whitespace-nowrap"
                            >
                                Hubungi lewat WhatsApp
                            </a>
                        )}
                        <Btn variant={row.status === 'contacted' ? 'black' : 'outline'} onClick={() => setOpen(true)}>
                            {row.status === 'contacted' ? 'Serahkan' : 'Catat tanggal dan penerima'}
                        </Btn>
                    </span>
                )}
                <Modal open={open} onClose={() => setOpen(false)}>
                    <h3 className="text-[15px] font-extrabold">Serahkan bensin tunai · {row.value}</h3>
                    <RequiredNote />
                    <label className="mt-3 block text-[11px] font-bold">
                        Tanggal serah
                        <Req />
                        <DateInput value={form.data.date} onChange={(v) => form.setData('date', v)} className="mt-1" />
                        <Hint>Tanggal uang diserahkan ke peserta. Tidak boleh setelah hari ini.</Hint>
                    </label>
                    <FieldError message={form.errors.date} />
                    <label className="mt-3 block text-[11px] font-bold">
                        Nama penerima
                        <Req />
                        <TextInput value={form.data.recipient} onChange={(e) => form.setData('recipient', e.target.value)} className="mt-1" />
                        <Hint>Nama orang yang menerima uang, mis. sesuai KTM.</Hint>
                    </label>
                    <FieldError message={form.errors.recipient} />
                    <div className="mt-4 flex justify-end gap-2">
                        <Btn variant="outline" onClick={() => setOpen(false)}>
                            Batal
                        </Btn>
                        <Btn
                            variant="black"
                            disabled={!form.data.date || !form.data.recipient.trim() || form.processing}
                            onClick={() =>
                                form.post(`/admin/pemenuhan/bensin/${row.id}/serahkan`, { preserveScroll: true, onSuccess: () => setOpen(false) })
                            }
                        >
                            Simpan
                        </Btn>
                    </div>
                </Modal>
            </Td>
        </tr>
    );
}

const goodStatus: Record<string, { label: string; tone: 'yellow' | 'green' | 'blue' | 'gray' }> = {
    pending_address: { label: 'Menunggu alamat', tone: 'yellow' },
    ready_to_ship: { label: 'Siap kirim', tone: 'green' },
    shipping: { label: 'Diantar', tone: 'blue' },
    done: { label: 'Selesai', tone: 'gray' },
};

/** A3 Antrean pemenuhan: token listrik, bensin tunai, merch dan LE. */
export default function Pemenuhan({
    tab,
    counts,
    tokens,
    fuel,
    goods,
    help,
}: {
    tab: 'token' | 'bensin' | 'barang';
    counts: { token: number; bensin: number; barang: number };
    tokens: Token[];
    fuel: Fuel[];
    goods: Good[];
    help: Help[];
}) {
    const [q, setQ] = useState('');
    const find = (row: { name: string; whatsapp: string }, ...extra: (string | null)[]) => matches(q, row.name, row.whatsapp, ...extra);
    const subtitle =
        tab === 'token'
            ? 'Token listrik diproses manual ke agregator'
            : tab === 'bensin'
              ? 'Admin menghubungi peserta lalu mencatat serah terima'
              : 'Admin mengirim sendiri ke alamat pengiriman';

    return (
        <AdminLayout active="pemenuhan" title="Antrean pemenuhan" subtitle={subtitle}>
            <PillTabs
                active={tab}
                tabs={[
                    { key: 'token', label: 'Token listrik', href: '/admin/pemenuhan?tab=token', count: counts.token },
                    { key: 'bensin', label: 'Bensin tunai', href: '/admin/pemenuhan?tab=bensin', count: counts.bensin },
                    { key: 'barang', label: 'Merch dan LE', href: '/admin/pemenuhan?tab=barang', count: counts.barang },
                ]}
            />

            <Card className="mt-4">
                <SearchInput value={q} onChange={setQ} placeholder="Cari nama, nomor, atau hadiah peserta" className="mb-3" />
                {tab === 'token' &&
                    (tokens.length ? (
                        <Table head={['Peserta', 'Nilai', 'Nomor tujuan', 'Gagal', 'Hasil', '']}>
                            {tokens
                                .filter((row) => find(row, row.destination, row.value))
                                .map((row) => (
                                    <TokenRow key={row.id} row={row} />
                                ))}
                        </Table>
                    ) : (
                        <Empty>Tidak ada token listrik yang menunggu.</Empty>
                    ))}
                {tab === 'bensin' &&
                    (fuel.length ? (
                        <Table head={['Peserta', 'Nilai tunai', 'Status', 'Aksi']}>
                            {fuel
                                .filter((row) => find(row, row.value))
                                .map((row) => (
                                    <FuelRow key={row.id} row={row} />
                                ))}
                        </Table>
                    ) : (
                        <Empty>Tidak ada bensin tunai yang menunggu.</Empty>
                    ))}
                {tab === 'barang' &&
                    (goods.length ? (
                        <Table head={['Peserta', 'Hadiah', 'Area', 'Status', 'Aksi']}>
                            {goods
                                .filter((row) => matches(q, row.name, row.prize, row.area, row.address))
                                .map((row) => (
                                    <tr key={row.id}>
                                        <Td className="font-extrabold">{row.name}</Td>
                                        <Td>{row.prize}</Td>
                                        <Td>{row.area ?? '-'}</Td>
                                        <Td>
                                            <Chip tone={goodStatus[row.status]?.tone ?? 'gray'}>{goodStatus[row.status]?.label ?? row.status}</Chip>
                                        </Td>
                                        <Td>
                                            {row.status === 'ready_to_ship' && (
                                                <Btn
                                                    onClick={() =>
                                                        router.post(`/admin/pemenuhan/barang/${row.id}/kirim`, {}, { preserveScroll: true })
                                                    }
                                                >
                                                    Kirim
                                                </Btn>
                                            )}
                                            {row.status === 'shipping' && (
                                                <Btn
                                                    onClick={() =>
                                                        router.post(`/admin/pemenuhan/barang/${row.id}/selesai`, {}, { preserveScroll: true })
                                                    }
                                                >
                                                    Selesai
                                                </Btn>
                                            )}
                                            {row.status === 'pending_address' && (
                                                <Btn variant="outline" disabled>
                                                    Kirim
                                                </Btn>
                                            )}
                                            {row.status === 'done' && <span className="text-ink/50 text-[11px]">{row.completed_at}</span>}
                                        </Td>
                                    </tr>
                                ))}
                        </Table>
                    ) : (
                        <Empty>Tidak ada merchandise atau limited edition.</Empty>
                    ))}
                <p className="text-ink/45 mt-3 text-[11px]">
                    {tab === 'barang'
                        ? 'Status: menunggu alamat, siap kirim, diantar, selesai. Tanggal kirim dicatat.'
                        : tab === 'bensin'
                          ? 'Status: menunggu, dihubungi, diserahkan. Tanggal dan penerima tercatat di log.'
                          : 'Berhasil wajib nomor referensi agregator. Gagal wajib beralasan dan menambah hitungan.'}
                </p>
            </Card>

            {help.length > 0 && (
                <Card
                    className="mt-4"
                    title={
                        <span className="flex items-center gap-2">
                            <Chip tone="red">Perlu bantuan admin</Chip>
                            <span className="font-semibold">
                                {help.length} permintaan sudah gagal {help[0].max} kali. Hubungi peserta lewat WhatsApp.
                            </span>
                        </span>
                    }
                >
                    <Table head={['Peserta', 'Nilai', 'Nomor tujuan', 'Gagal', 'Aksi']}>
                        {help
                            .filter((row) => find(row, row.destination, row.value))
                            .map((row) => (
                                <tr key={row.id}>
                                    <Td>
                                        <Who p={row} />
                                    </Td>
                                    <Td className="font-bold">{row.value}</Td>
                                    <Td className="font-mono">{row.destination ?? '-'}</Td>
                                    <Td>
                                        {row.failed}/{row.max}
                                    </Td>
                                    <Td>
                                        {row.wa && (
                                            <BtnLink href={row.wa} variant="yellow" external>
                                                Hubungi lewat WhatsApp
                                            </BtnLink>
                                        )}
                                    </Td>
                                </tr>
                            ))}
                    </Table>
                </Card>
            )}
        </AdminLayout>
    );
}
