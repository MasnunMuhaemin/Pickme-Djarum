import { Head } from '@inertiajs/react';
import { useEffect } from 'react';

type Board = { code: string; name: string; slots: { position: string; code: string; prize: string }[] };

/** Daftar cetak kode unik: satu halaman per papan. Dialog cetak terbuka otomatis (simpan sebagai PDF). */
export default function DaftarCetak({ boards }: { boards: Board[] }) {
    useEffect(() => {
        const t = window.setTimeout(() => window.print(), 600);
        return () => window.clearTimeout(t);
    }, []);

    return (
        <div className="bg-white text-black">
            <Head title="Daftar cetak kode unik" />
            {boards.map((b) => (
                <section key={b.code} className="p-4 [page-break-after:always] sm:p-8">
                    <h1 className="text-[20px] font-extrabold">
                        {b.code} · {b.name}
                    </h1>
                    <p className="text-[12px] text-black/60">25 hadiah · urut A1 sampai E5 · satu voucher per hadiah</p>
                    <div className="mt-4 overflow-x-auto print:overflow-visible">
                        <table className="w-full min-w-[420px] border-collapse text-[13px]">
                        <thead>
                            <tr className="border-b-2 border-black text-left">
                                <th className="py-1.5">Hadiah</th>
                                <th className="py-1.5">Kode unik</th>
                                <th className="py-1.5">Isi papan</th>
                            </tr>
                        </thead>
                        <tbody>
                            {b.slots.map((s) => (
                                <tr key={s.position} className="border-b border-black/15">
                                    <td className="py-1.5 font-bold">{s.position}</td>
                                    <td className="py-1.5 font-mono font-bold tracking-wider">{s.code}</td>
                                    <td className="py-1.5">{s.prize}</td>
                                </tr>
                            ))}
                        </tbody>
                        </table>
                    </div>
                </section>
            ))}
        </div>
    );
}
