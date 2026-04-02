<?php

namespace App\Http\Controllers;

use App\Helpers\CloudHelper;
use App\Models\CloudConnection;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
                        'hash' => $isDir ? CloudHelper::encodePath($itemPath) : null,
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
