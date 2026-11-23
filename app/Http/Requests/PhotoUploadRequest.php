<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PhotoUploadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'photo' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ];
    }

    public function messages(): array
    {
        return [
            'photo.required' => 'Ambil foto bungkus dulu.',
            'photo.image' => 'Ambil foto bungkus dulu.',
            'photo.max' => 'Ukuran foto terlalu besar. Maksimal 5 MB.',
        ];
    }
}
