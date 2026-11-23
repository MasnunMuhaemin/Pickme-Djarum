<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'whatsapp' => ['required', 'string'],
            'pin' => ['required', 'digits:4'],
            'device_id' => ['sometimes', 'string', 'max:64'],
        ];
    }

    public function messages(): array
    {
        return [
            'whatsapp.required' => 'Nomor atau PIN belum cocok.',
            'pin.required' => 'Nomor atau PIN belum cocok.',
            'pin.digits' => 'Nomor atau PIN belum cocok.',
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->whatsapp) {
            $number = preg_replace('/\D/', '', (string) $this->whatsapp);
            if (str_starts_with($number, '62')) {
                $number = '0'.substr($number, 2);
            }
            $this->merge(['whatsapp' => $number]);
        }
    }
}
