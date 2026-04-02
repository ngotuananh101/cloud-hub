<?php

namespace App\Jobs;

use App\Events\ChunkUploadCompleted;
use App\Helpers\CloudHelper;
use App\Models\CloudConnection;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ProcessChunkUpload implements ShouldQueue
{
    use Queueable;

    /**
     * Maximum number of retry attempts.
     */
    public int $tries = 3;

    /**
     * Timeout in seconds (10 min for very large files).
     */
    public int $timeout = 600;

    public function __construct(
        private readonly int $userId,
        private readonly int $connectionId,
        private readonly string $uploadId,
        private readonly string $chunkDir,
        private readonly int $totalChunks,
        private readonly string $filename,
        private readonly string $parentPath,
    ) {}

    public function handle(): void
    {
        $connection = CloudConnection::find($this->connectionId);

        if (! ($connection instanceof CloudConnection) || $connection->user_id !== $this->userId) {
            $this->broadcastResult(false, 'Connection not found or access denied.');
            return;
        }

        // Verify all chunks are still present
        for ($i = 0; $i < $this->totalChunks; $i++) {
            if (! file_exists("{$this->chunkDir}/chunk_{$i}")) {
                $this->cleanupChunkDir();
                $this->broadcastResult(false, "Missing chunk {$i}. Please re-upload.");
                return;
            }
        }

        try {
            $assembledPath = $this->assembleChunks();

            $disk       = $this->getDisk($connection);
            $remotePath = $this->parentPath === '/'
                ? $this->filename
                : rtrim($this->parentPath, '/').'/'.$this->filename;

            $stream = fopen($assembledPath, 'rb');
            $disk->writeStream($remotePath, $stream);

            if (is_resource($stream)) {
                fclose($stream);
            }

            \Illuminate\Support\Facades\File::delete($assembledPath);
            $this->cleanupChunkDir();

            // Invalidate the parent directory cache
            CloudHelper::clearCloudCache($connection, $this->parentPath);

            $this->broadcastResult(true);
        } catch (\Exception $e) {
            $this->cleanupChunkDir();
            $this->broadcastResult(false, $e->getMessage());
        }
    }

    /**
     * Concatenate chunk files into a single assembled file.
     */
    private function assembleChunks(): string
    {
        $assembledPath = "{$this->chunkDir}/{$this->filename}";
        $out = fopen($assembledPath, 'wb');

        for ($i = 0; $i < $this->totalChunks; $i++) {
            $in = fopen("{$this->chunkDir}/chunk_{$i}", 'rb');
            stream_copy_to_stream($in, $out);
            fclose($in);
        }

        fclose($out);

        return $assembledPath;
    }

    /**
     * Get the Flysystem disk for the cloud connection.
     */
    private function getDisk(CloudConnection $connection)
    {
        $credentials = $connection->credentials;
        $settings    = $connection->settings ?? [];
        $config      = array_merge($credentials, $settings);
        $config['driver'] = $connection->provider_id;

        foreach ($config as $key => $value) {
            if ($value === 'true') {
                $config[$key] = true;
            }
            if ($value === 'false') {
                $config[$key] = false;
            }
        }

        if ($connection->provider_id === 's3') {
            $config['bucket'] = $credentials['bucket'] ?? '';
            $config['key']    = $credentials['key'] ?? '';
            $config['secret'] = $credentials['secret'] ?? '';
            $config['region'] = $credentials['region'] ?? 'us-east-1';
        }

        return \Illuminate\Support\Facades\Storage::build($config);
    }

    /**
     * Remove temp chunk directory.
     */
    private function cleanupChunkDir(): void
    {
        if (\Illuminate\Support\Facades\File::isDirectory($this->chunkDir)) {
            \Illuminate\Support\Facades\File::deleteDirectory($this->chunkDir);
        }
    }

    /**
     * Broadcast the result back to the user via Reverb.
     */
    private function broadcastResult(bool $success, ?string $error = null): void
    {
        event(new ChunkUploadCompleted(
            userId:   $this->userId,
            uploadId: $this->uploadId,
            success:  $success,
            filename: $this->filename,
            error:    $error,
        ));
    }

    /**
     * Handle a permanently failed job.
     */
    public function failed(\Throwable $e): void
    {
        $this->cleanupChunkDir();
        $this->broadcastResult(false, 'Upload failed after multiple attempts: '.$e->getMessage());
    }
}
