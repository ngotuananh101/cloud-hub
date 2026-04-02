<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ChunkUploadCompleted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly int $userId,
        public readonly string $uploadId,
        public readonly bool $success,
        public readonly string $filename,
        public readonly ?string $error = null,
    ) {}

    /**
     * Broadcast on the user's private channel.
     */
    public function broadcastOn(): Channel
    {
        return new PrivateChannel("uploads.{$this->userId}");
    }

    /**
     * Shape of the data sent to the frontend.
     */
    public function broadcastWith(): array
    {
        return [
            'upload_id' => $this->uploadId,
            'success'   => $this->success,
            'filename'  => $this->filename,
            'error'     => $this->error,
        ];
    }

    public function broadcastAs(): string
    {
        return 'upload.completed';
    }
}
