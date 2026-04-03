<?php

namespace App\Http\Controllers;

use App\Helpers\CloudHelper;
use App\Jobs\ProcessChunkUpload;
use App\Models\CloudConnection;
use Carbon\Carbon;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class FileController extends Controller
{
    /**
     * Browse files and folders for a given cloud connection.
     */
    public function index(CloudConnection $connection, $hash = null)
    {
        if ($connection->user_id !== Auth::id()) {
            abort(403);
        }

        $path = CloudHelper::decodePath($hash);

        $files = [];
        $error = null;

        try {
            $files = CloudHelper::rememberCloudContents($connection, $path, function () use ($connection, $path) {
                $disk = $this->getDisk($connection);
                $contents = $disk->listContents($path, false);
                $files = [];

                foreach ($contents as $item) {
                    $isDir = $item->isDir();
                    $itemPath = $item->path();
                    $name = basename($itemPath);

                    // Try to get metadata from the item itself (Flysystem v3 StorageAttributes)
                    $size = $isDir ? null : (method_exists($item, 'fileSize') ? $item->fileSize() : null);
                    $mimeType = $isDir ? null : (method_exists($item, 'mimeType') ? $item->mimeType() : null);
                    $lastModified = $item->lastModified();

                    $files[] = [
                        'id' => md5($itemPath),
                        'name' => $name,
                        'path' => $itemPath,
                        'hash' => CloudHelper::encodePath($itemPath),
                        'type' => $isDir ? 'dir' : 'file',
                        'mime_type' => $mimeType ?? ($isDir ? null : $this->getMimeType($itemPath, $disk)),
                        'size' => $size ?? ($isDir ? null : $this->getFileSize($itemPath, $disk)),
                        'last_modified' => $lastModified ? Carbon::createFromTimestamp($lastModified)->toIso8601String() : $this->getLastModified($itemPath, $disk),
                        'extension' => strtolower(pathinfo($name, PATHINFO_EXTENSION)),
                    ];
                }

                // Sort: Folders first, then alphabetically
                usort($files, function ($a, $b) {
                    if ($a['type'] === $b['type']) {
                        return strcasecmp($a['name'], $b['name']);
                    }

                    return $a['type'] === 'dir' ? -1 : 1;
                });

                return $files;
            }, 3600); // Cache for 1 hour

        } catch (\Exception $e) {
            $error = $e->getMessage();
        }

        return Inertia::render('Browse', [
            'connection' => $connection->load('provider'),
            'currentPath' => $path,
            'currentHash' => $hash,
            'files' => $files,
            'breadcrumbs' => $this->getBreadcrumbs($path),
            'error' => $error,
        ]);
    }

    private function getMimeType(string $path, $disk): ?string
    {
        try {
            return $disk->mimeType($path);
        } catch (\Throwable $e) {
            return 'application/octet-stream';
        }
    }

    private function getFileSize(string $path, $disk): ?int
    {
        try {
            return $disk->size($path);
        } catch (\Throwable $e) {
            return null;
        }
    }

    private function getLastModified(string $path, $disk): ?string
    {
        try {
            $timestamp = $disk->lastModified($path);

            return Carbon::createFromTimestamp($timestamp)->toIso8601String();
        } catch (\Throwable $e) {
            return null;
        }
    }

    private function getBreadcrumbs(string $path): array
    {
        $path = CloudHelper::normalizePath($path);
        $parts = array_filter(explode('/', $path));

        $breadcrumbs = [
            ['name' => 'Root', 'hash' => null],
        ];

        $current = '';
        foreach ($parts as $part) {
            $current = $current === '' ? $part : $current.'/'.$part;
            $breadcrumbs[] = [
                'name' => $part,
                'hash' => CloudHelper::encodePath($current),
            ];
        }

        return $breadcrumbs;
    }

    /**
     * Create a new folder in the specified path.
     */
    public function storeFolder(Request $request, CloudConnection $connection)
    {
        if ($connection->user_id !== Auth::id()) {
            abort(403);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'path' => 'nullable|string',
        ]);

        $parentPath = CloudHelper::decodePath($request->input('path'));
        $folderName = $request->input('name');

        // Clean up the folder name and join with parent path
        $fullPath = $parentPath === '/' ? $folderName : rtrim($parentPath, '/').'/'.$folderName;

        try {
            $disk = $this->getDisk($connection);
            $disk->makeDirectory($fullPath);

            // Clear cache for the parent path so the new folder shows up
            CloudHelper::clearCloudCache($connection, $parentPath);

            return back()->with('success', "Folder '{$folderName}' created successfully.");
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to create folder: '.$e->getMessage());
        }
    }

    /**
     * Delete a file or folder.
     */
    public function destroy(Request $request, CloudConnection $connection)
    {
        if ($connection->user_id !== Auth::id()) {
            abort(403);
        }

        $request->validate([
            'path' => 'required|string',
            'type' => 'required|in:file,dir',
        ]);

        $path = $request->input('path');
        $type = $request->input('type');

        // Path is plain path like 'folder/file.txt' or 'folder'
        $parentPath = dirname($path);
        if ($parentPath === '.' || $parentPath === '\\') {
            $parentPath = '/';
        }

        try {
            $disk = $this->getDisk($connection);

            if ($type === 'dir') {
                $disk->deleteDirectory($path);
            } else {
                $disk->delete($path);
            }

            // Invalidate cache for the parent directory (where the item was deleted)
            CloudHelper::clearCloudCache($connection, $parentPath);

            return back()->with('success', 'Item deleted successfully.');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to delete item: '.$e->getMessage());
        }
    }

    /**
     * Download a file: tries to get direct link (temporaryUrl), otherwise proxies via server.
     */
    public function download(CloudConnection $connection, string $hash)
    {
        if ($connection->user_id !== Auth::id()) {
            abort(403);
        }

        $path = CloudHelper::decodePath($hash);
        $fileName = basename($path);

        try {
            /** @var FilesystemAdapter $disk */
            $disk = $this->getDisk($connection);

            // Try to see if adapter supports temporaryUrl (direct link)
            try {
                $url = $disk->temporaryUrl($path, now()->addHours(1));

                return redirect()->away($url);
            } catch (\Throwable $t) {
                // Ignore and fallback to proxy via server
                Log::warning('Failed to generate temporary URL: '.$t->getMessage());
            }

            // Fallback: proxy download
            if ($disk->exists($path)) {
                return $disk->download($path, $fileName);
            }

            return back()->with('error', 'File not found on storage.');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to generate download: '.$e->getMessage());
        }
    }

    /**
     * Handle chunked file upload.
     *
     * Expects multipart form fields:
     *   - file        : the chunk blob
     *   - upload_id   : a client-generated UUID per upload session
     *   - chunk_index : 0-based index of this chunk
     *   - total_chunks: total number of chunks for the file
     *   - filename    : original file name
     *   - path        : encoded parent path hash
     */
    public function upload(Request $request, CloudConnection $connection)
    {
        if ($connection->user_id !== Auth::id()) {
            abort(403);
        }

        $request->validate([
            'file' => 'required|file',
            'upload_id' => 'required|string|max:64',
            'chunk_index' => 'required|integer|min:0',
            'total_chunks' => 'required|integer|min:1',
            'filename' => 'required|string|max:255',
            'path' => 'nullable|string',
        ]);

        $uploadId = preg_replace('/[^a-zA-Z0-9_-]/', '', $request->input('upload_id'));
        $chunkIndex = (int) $request->input('chunk_index');
        $totalChunks = (int) $request->input('total_chunks');
        $filename = basename($request->input('filename'));
        $parentPath = CloudHelper::decodePath($request->input('path'));

        // Store chunk in local temp directory
        $chunkDir = storage_path("app/chunks/{$uploadId}");
        $chunkPath = "{$chunkDir}/chunk_{$chunkIndex}";

        if (! is_dir($chunkDir)) {
            mkdir($chunkDir, 0755, true);
        }

        // Save the chunk file
        $request->file('file')->move($chunkDir, "chunk_{$chunkIndex}");

        // If this is the last chunk, dispatch background job
        if ($chunkIndex + 1 === $totalChunks) {
            // Verify all chunks are present before dispatching
            for ($i = 0; $i < $totalChunks; $i++) {
                if (! file_exists("{$chunkDir}/chunk_{$i}")) {
                    return response()->json([
                        'error' => "Missing chunk {$i}, please retry.",
                    ], 422);
                }
            }

            ProcessChunkUpload::dispatch(
                userId: Auth::id(),
                connectionId: $connection->id,
                uploadId: $uploadId,
                chunkDir: $chunkDir,
                totalChunks: $totalChunks,
                filename: $filename,
                parentPath: $parentPath,
            );

            return response()->json([
                'message' => "'{$filename}' queued for processing.",
                'upload_id' => $uploadId,
                'queued' => true,
            ]);
        }

        return response()->json([
            'message' => "Chunk {$chunkIndex} received.",
            'received' => $chunkIndex + 1,
            'total' => $totalChunks,
        ]);
    }

    /**
     * Concatenate all chunk files into a single assembled file.
     */
    private function assembleChunks(string $chunkDir, int $totalChunks, string $filename): string
    {
        $assembledPath = "{$chunkDir}/{$filename}";
        $out = fopen($assembledPath, 'wb');

        for ($i = 0; $i < $totalChunks; $i++) {
            $chunkPath = "{$chunkDir}/chunk_{$i}";
            $in = fopen($chunkPath, 'rb');
            stream_copy_to_stream($in, $out);
            fclose($in);
        }

        fclose($out);

        return $assembledPath;
    }

    /**
     * Remove the temporary chunk directory and its contents.
     */
    private function cleanupChunkDir(string $dir): void
    {
        if (! is_dir($dir)) {
            return;
        }

        foreach (glob("{$dir}/*") as $file) {
            if (is_file($file)) {
                unlink($file);
            }
        }

        rmdir($dir);
    }

    /**
     * Build the filesystem disk based on connection credentials.
     */
    private function getDisk(CloudConnection $connection)
    {
        $credentials = $connection->credentials;
        $settings = $connection->settings ?? [];
        $config = array_merge($credentials, $settings);
        $config['driver'] = $connection->provider_id;

        // Normalize boolean strings
        foreach ($config as $key => $value) {
            if ($value === 'true') {
                $config[$key] = true;
            }
            if ($value === 'false') {
                $config[$key] = false;
            }
        }

        // Special handling for drivers that use different key names internally
        if ($connection->provider_id === 's3') {
            $config['bucket'] = $credentials['bucket'] ?? '';
            $config['key'] = $credentials['key'] ?? '';
            $config['secret'] = $credentials['secret'] ?? '';
            $config['region'] = $credentials['region'] ?? 'us-east-1';
        }

        return Storage::build($config);
    }
}
