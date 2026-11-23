export function deviceId(): string {
    const key = 'lotre_device_id';
    let id = localStorage.getItem(key);
    if (!id) {
        id = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `device-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        localStorage.setItem(key, id);
    }
    return id;
}
