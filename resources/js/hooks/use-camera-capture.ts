import imageCompression from 'browser-image-compression';
import { useEffect, useRef, useState } from 'react';

/**
 * Kamera belakang langsung (tanpa galeri) untuk foto bungkus peserta dan foto bukti mitra.
 * cameraError: 'unsupported' (browser tidak bisa membuka kamera) atau 'denied' (izin ditolak).
 */
export function useCameraCapture(fileName: string) {
    const video = useRef<HTMLVideoElement>(null);
    const stream = useRef<MediaStream | null>(null);
    const [cameraOn, setCameraOn] = useState(false);
    const [cameraError, setCameraError] = useState('');

    useEffect(() => {
        let stopped = false;

        async function start() {
            if (!navigator.mediaDevices?.getUserMedia) {
                setCameraError('unsupported');
                return;
            }
            try {
                const media = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: { ideal: 'environment' } },
                    audio: false,
                });
                if (stopped) {
                    media.getTracks().forEach((track) => track.stop());
                    return;
                }
                stream.current = media;
                if (video.current) {
                    video.current.srcObject = media;
                    await video.current.play();
                }
                setCameraOn(true);
                setCameraError('');
            } catch {
                setCameraError('denied');
            }
        }

        start();
        return () => {
            stopped = true;
            stream.current?.getTracks().forEach((track) => track.stop());
        };
    }, []);

    /** Ambil bingkai kamera (maks 1600 px), lalu kompres sebelum diunggah. */
    function capture(): Promise<File | null> {
        const source = video.current;
        if (!source || !source.videoWidth) return Promise.resolve(null);

        const MAX_SIDE = 1600;
        const scale = Math.min(1, MAX_SIDE / Math.max(source.videoWidth, source.videoHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(source.videoWidth * scale);
        canvas.height = Math.round(source.videoHeight * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return Promise.resolve(null);

        ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
        return new Promise((resolve) =>
            canvas.toBlob(
                async (blob) => {
                    if (!blob) return resolve(null);
                    const raw = new File([blob], fileName, { type: 'image/jpeg' });
                    // Kamera HP bisa 4K: tanpa kompres mudah melewati batas unggah server dan lambat di sinyal lemah.
                    // Gagal kompres (browser lama) tetap memakai bingkai asli yang sudah diperkecil.
                    const photo = await imageCompression(raw, {
                        maxSizeMB: 0.3,
                        maxWidthOrHeight: 1280,
                        fileType: 'image/jpeg',
                        initialQuality: 0.8,
                        useWebWorker: true,
                    }).catch(() => raw);
                    resolve(new File([photo], fileName, { type: 'image/jpeg' }));
                },
                'image/jpeg',
                0.9,
            ),
        );
    }

    return { video, cameraOn, cameraError, setCameraError, capture };
}
