<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class StoreRapatRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tanggal'      => ['required', 'date_format:Y-m-d'],
            'topik'        => ['required', 'string', 'min:3', 'max:500'],
            'pimpinanRapat'=> ['required', 'string', 'min:2', 'max:255'],
            'notulis'      => ['required', 'string', 'min:2', 'max:255'],
            'waktu'        => ['nullable', 'string', 'max:255'],
            'tempat'       => ['nullable', 'string', 'max:255'],
            'status'       => ['nullable', 'string', 'in:Selesai,Berlangsung,Dijadwalkan'],

            // anggota bisa berupa JSON string (dari SPA) atau array
            'anggota'               => ['nullable'],
            'anggota.*.nama'        => ['nullable', 'string', 'max:255'],
            'anggota.*.jabatan'     => ['nullable', 'string', 'max:255'],
            'anggota.*.asalInstansi'=> ['nullable', 'string', 'max:255'],

            // poin pembahasan
            'poinPembahasan'        => ['nullable'],
            'poinPembahasan.*.isi'  => ['nullable', 'string'],

            // tindak lanjut
            'tindakLanjut'            => ['nullable'],
            'tindakLanjut.*.tugas'    => ['nullable', 'string'],
            'tindakLanjut.*.pic'      => ['nullable', 'string', 'max:255'],
            'tindakLanjut.*.deadline' => ['nullable', 'string', 'max:255'],
            'tindakLanjut.*.selesai'  => ['nullable'],
            'tindakLanjut.*.teks'     => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'tanggal.required'       => 'Tanggal pelaksanaan wajib diisi.',
            'tanggal.date_format'    => 'Format tanggal harus YYYY-MM-DD (contoh: 2024-10-19).',
            'topik.required'         => 'Topik / agenda rapat wajib diisi.',
            'topik.min'              => 'Topik minimal 3 karakter.',
            'topik.max'              => 'Topik maksimal 500 karakter.',
            'pimpinanRapat.required' => 'Nama pimpinan rapat wajib diisi.',
            'pimpinanRapat.min'      => 'Nama pimpinan minimal 2 karakter.',
            'notulis.required'       => 'Nama notulis wajib diisi.',
            'notulis.min'            => 'Nama notulis minimal 2 karakter.',
            'status.in'              => 'Status harus salah satu dari: Selesai, Berlangsung, Dijadwalkan.',
        ];
    }

    /**
     * Kembalikan JSON error agar konsisten dengan respons API.
     */
    protected function failedValidation(Validator $validator): never
    {
        throw new HttpResponseException(
            response()->json([
                'success' => false,
                'pesan'   => 'Validasi gagal. Periksa kembali data yang dimasukkan.',
                'errors'  => $validator->errors(),
            ], 422)
        );
    }
}
