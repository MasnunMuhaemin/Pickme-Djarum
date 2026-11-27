/** Data dari ClaimStatusController::present(). */
export type ClaimStatus = {
    id: number;
    status: string;
    claim_code: string;
    outlet?: string | null;
    slot?: string | null;
    submitted_at?: string | null;
} | null;

export function ClaimDetails({ claim }: { claim: NonNullable<ClaimStatus> }) {
    const rows = [
        ['Kode klaim', claim.claim_code],
        ['Titik', claim.outlet],
        ['Hadiah', claim.slot],
        ['Dikirim', claim.submitted_at],
    ].filter((row): row is [string, string] => Boolean(row[1]));

    return (
        <div className="divide-ink/8 divide-y text-[12px]">
            {rows.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 py-2">
                    <span className="text-ink-soft">{label}</span>
                    <span className="font-bold">{value}</span>
                </div>
            ))}
        </div>
    );
}
