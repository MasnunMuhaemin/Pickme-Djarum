import { usePage } from '@inertiajs/react';

export function useCaps(): number {
    const { props } = usePage();
    const participant = (props.auth as { participant?: { caps?: number } } | undefined)?.participant;

    return participant?.caps ?? 0;
}
