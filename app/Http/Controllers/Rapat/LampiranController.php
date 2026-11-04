<?php

namespace App\Http\Controllers\Rapat;

use App\Http\Controllers\Controller;
use App\Models\Rapat;
use App\Models\RapatLampiran;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class LampiranController extends Controller
{
    /**
     * Menampilkan daftar berkas lampiran untuk rapat tertentu
     */
    public function index($id)
    {
        try {
            $rapat = Rapat::find($id);
            if (!$rapat) {
                return response()->json(['success' => false, 'pesan' => 'Rapat tidak ditemukan'], 404);
            }

            $lampiran = $rapat->lampiran->map(fn($l) => $l->toApiArray());

            return response()->json([
                'success' => true,
                'data' => $lampiran,
                'total' => $lampiran->count(),
            ]);
        } catch (\Throwable $e) {
            Log::error("Error GET /api/rapat/{$id}/lampiran: " . $e->getMessage());
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Mengunggah berkas lampiran baru ke rapat
     */
    public function store(Request $request, $id)
    {
        try {
            $rapat = Rapat::find($id);
            if (!$rapat) {
                return response()->json(['success' => false, 'pesan' => 'Rapat tidak ditemukan'], 404);
            }

            $validated = $request->validate([
                'berkas' => [
                    'required',
                    'file',
                    'max:10240', // 10 MB batas unggah
                    'mimes:jpg,jpeg,png,webp,pdf,doc,docx,ppt,pptx,xls,xlsx',
                ],
                'kategori' => ['nullable', 'string', 'in:foto,daftar_hadir,materi,dokumen'],
                'keterangan' => ['nullable', 'string', 'max:255'],
            ], [
                'berkas.required' => 'Berkas lampiran wajib dipilih untuk diunggah.',
                'berkas.file' => 'Input harus berupa berkas yang valid.',
                'berkas.max' => 'Ukuran berkas melebihi batas maksimal 10 MB.',
                'berkas.mimes' => 'Format berkas tidak didukung. Format yang diizinkan: JPG, PNG, WEBP, PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX.',
                'kategori.in' => 'Kategori harus salah satu dari: foto, daftar_hadir, materi, dokumen.',
            ]);

            $file = $request->file('berkas');
            $originalName = $file->getClientOriginalName();
            $extension = $file->getClientOriginalExtension() ?: 'bin';
            $storedName = time() . '_' . Str::random(10) . '.' . $extension;

            // Simpan ke disk public pada direktori lampiran/{rapat_id}
            $path = $file->storeAs("lampiran/{$rapat->id}", $storedName, 'public');

            $lampiran = RapatLampiran::create([
                'id'         => (string) Str::ulid(),
                'rapat_id'   => $rapat->id,
                'nama_file'  => $originalName,
                'path'       => $path,
                'ukuran'     => $file->getSize(),
                'tipe_mime'  => $file->getClientMimeType() ?: 'application/octet-stream',
                'kategori'   => $request->input('kategori', 'dokumen'),
                'keterangan' => $request->input('keterangan'),
            ]);

            return response()->json([
                'success' => true,
                'pesan'   => 'Berkas lampiran berhasil diunggah',
                'data'    => $lampiran->toApiArray(),
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'pesan'   => $e->validator->errors()->first(),
                'errors'  => $e->validator->errors(),
            ], 422);
        } catch (\Throwable $e) {
            Log::error("Error upload lampiran rapat {$id}: " . $e->getMessage());
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Mengunduh berkas lampiran dengan header Content-Disposition attachment nama asli
     */
    public function download($rapatId, $lampiranId)
    {
        try {
            $lampiran = RapatLampiran::where('rapat_id', $rapatId)->where('id', $lampiranId)->first();
            if (!$lampiran) {
                return response()->json(['success' => false, 'pesan' => 'Berkas lampiran tidak ditemukan'], 404);
            }

            if (!Storage::disk('public')->exists($lampiran->path)) {
                return response()->json(['success' => false, 'pesan' => 'Fisik berkas tidak ditemukan di media penyimpanan'], 404);
            }

            return Storage::disk('public')->download($lampiran->path, $lampiran->nama_file);
        } catch (\Throwable $e) {
            Log::error("Error download lampiran {$lampiranId}: " . $e->getMessage());
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Menghapus berkas lampiran dari disk dan database
     */
    public function destroy($rapatId, $lampiranId)
    {
        try {
            $lampiran = RapatLampiran::where('rapat_id', $rapatId)->where('id', $lampiranId)->first();
            if (!$lampiran) {
                return response()->json(['success' => false, 'pesan' => 'Berkas lampiran tidak ditemukan'], 404);
            }

            // Hapus fisik berkas dari penyimpanan jika ada
            if (Storage::disk('public')->exists($lampiran->path)) {
                Storage::disk('public')->delete($lampiran->path);
            }

            $lampiran->delete();

            return response()->json([
                'success' => true,
                'pesan'   => 'Berkas lampiran berhasil dihapus',
            ]);
        } catch (\Throwable $e) {
            Log::error("Error hapus lampiran {$lampiranId}: " . $e->getMessage());
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }
}

