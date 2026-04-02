import { usePage } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import {
    CheckCircle2,
    Clock,
    File,
    Loader2,
    Upload,
    X,
    XCircle,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import type { Auth } from '@/types/auth';

// -------------------------------------------------------------------
// Types
// -------------------------------------------------------------------

type FileStatus =
    | 'queued'
    | 'uploading'
    | 'processing'
    | 'done'
    | 'error'
    | 'cancelled';

interface UploadFile {
    id: string;
    file: File;
    status: FileStatus;
    progress: number;
    errorMessage?: string;
    abortController?: AbortController;
}

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    connectionId: number;
    currentHash: string | null;
}

interface BroadcastPayload {
    upload_id: string;
    success: boolean;
    filename: string;
    error?: string;
}

// -------------------------------------------------------------------
// Constants
// -------------------------------------------------------------------

const CHUNK_SIZE = 5 * 1024 * 1024; // 5 MB per chunk

// -------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------

function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatBytes(bytes: number): string {
    if (bytes === 0) {
        return '0 B';
    }

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getCsrfToken(): string {
    return (
        (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)
            ?.content ?? ''
    );
}

// -------------------------------------------------------------------
// Main component
// -------------------------------------------------------------------

export default function UploadModal({
    isOpen,
    onClose,
    connectionId,
    currentHash,
}: UploadModalProps) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const userId = auth.user.id;

    const [files, setFiles] = useState<UploadFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Map uploadId → file.id so the broadcast handler can find the right row
    const uploadIdMapRef = useRef<Record<string, string>>({});

    // ----------------------------------------------------------------
    // Echo: listen for job completion events from Reverb
    // ----------------------------------------------------------------

    useEcho(
        `uploads.${userId}`,
        '.upload.completed',
        (payload: BroadcastPayload) => {
            const fileId = uploadIdMapRef.current[payload.upload_id];

            if (!fileId) {
                return;
            }

            if (payload.success) {
                setFiles((prev) =>
                    prev.map((f) =>
                        f.id === fileId
                            ? {
                                  ...f,
                                  status: 'done' as FileStatus,
                                  progress: 100,
                              }
                            : f,
                    ),
                );
            } else {
                setFiles((prev) =>
                    prev.map((f) =>
                        f.id === fileId
                            ? {
                                  ...f,
                                  status: 'error' as FileStatus,
                                  errorMessage:
                                      payload.error ?? 'Unknown error',
                              }
                            : f,
                    ),
                );
            }

            // Clean up the mapping entry
            delete uploadIdMapRef.current[payload.upload_id];
        },
    );

    // Reset on modal close
    useEffect(() => {
        if (!isOpen) {
            uploadIdMapRef.current = {};
        }
    }, [isOpen]);

    // ----------------------------------------------------------------
    // File management
    // ----------------------------------------------------------------

    const addFiles = useCallback((incoming: FileList | File[]) => {
        const newEntries: UploadFile[] = Array.from(incoming).map((f) => ({
            id: generateId(),
            file: f,
            status: 'queued',
            progress: 0,
        }));

        setFiles((prev) => [...prev, ...newEntries]);
    }, []);

    const removeFile = (id: string) => {
        setFiles((prev) => {
            const target = prev.find((f) => f.id === id);

            if (target?.abortController) {
                target.abortController.abort();
            }

            return prev.filter((f) => f.id !== id);
        });
    };

    const cancelFile = (id: string) => {
        setFiles((prev) =>
            prev.map((f) => {
                if (f.id === id) {
                    f.abortController?.abort();

                    return {
                        ...f,
                        status: 'cancelled' as FileStatus,
                        progress: 0,
                    };
                }

                return f;
            }),
        );
    };

    // ----------------------------------------------------------------
    // Drag & drop
    // ----------------------------------------------------------------

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files.length > 0) {
            addFiles(e.dataTransfer.files);
        }
    };

    // ----------------------------------------------------------------
    // Upload logic
    // ----------------------------------------------------------------

    const uploadSingleFile = async (uploadFile: UploadFile): Promise<void> => {
        const { file } = uploadFile;
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
        const uploadId = generateId();
        const abortController = new AbortController();

        // Register this upload's ID → file.id mapping for the broadcast handler
        uploadIdMapRef.current[uploadId] = uploadFile.id;

        setFiles((prev) =>
            prev.map((f) =>
                f.id === uploadFile.id
                    ? {
                          ...f,
                          status: 'uploading' as FileStatus,
                          abortController,
                      }
                    : f,
            ),
        );

        try {
            for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
                if (abortController.signal.aborted) {
                    throw new DOMException('Aborted', 'AbortError');
                }

                const start = chunkIndex * CHUNK_SIZE;
                const end = Math.min(start + CHUNK_SIZE, file.size);
                const chunk = file.slice(start, end);

                const formData = new FormData();
                formData.append('file', chunk, file.name);
                formData.append('upload_id', uploadId);
                formData.append('chunk_index', String(chunkIndex));
                formData.append('total_chunks', String(totalChunks));
                formData.append('filename', file.name);
                formData.append('path', currentHash ?? '');
                formData.append('_token', getCsrfToken());

                // @ts-expect-error - Ziggy route global
                const url = route('clouds.upload', {
                    connection: connectionId,
                });

                const response = await fetch(url, {
                    method: 'POST',
                    headers: { Accept: 'application/json' },
                    body: formData,
                    signal: abortController.signal,
                });

                if (!response.ok) {
                    const err = await response.json().catch(() => ({}));

                    throw new Error(
                        (err as { error?: string }).error ??
                            `Upload failed (HTTP ${response.status})`,
                    );
                }

                const progress = Math.round(
                    ((chunkIndex + 1) / totalChunks) * 100,
                );

                setFiles((prev) =>
                    prev.map((f) =>
                        f.id === uploadFile.id ? { ...f, progress } : f,
                    ),
                );
            }

            // Last chunk received — backend will dispatch the job
            // Mark as 'processing' (waiting for Reverb event)
            setFiles((prev) =>
                prev.map((f) =>
                    f.id === uploadFile.id
                        ? {
                              ...f,
                              status: 'processing' as FileStatus,
                              progress: 100,
                          }
                        : f,
                ),
            );
        } catch (err: unknown) {
            const isAbort =
                err instanceof DOMException && err.name === 'AbortError';

            setFiles((prev) =>
                prev.map((f) =>
                    f.id === uploadFile.id
                        ? {
                              ...f,
                              status: (isAbort
                                  ? 'cancelled'
                                  : 'error') as FileStatus,
                              errorMessage: isAbort
                                  ? undefined
                                  : (err as Error).message,
                          }
                        : f,
                ),
            );
        }
    };

    const handleUpload = async () => {
        const queued = files.filter((f) => f.status === 'queued');

        if (queued.length === 0) {
            return;
        }

        setIsUploading(true);

        for (const uploadFile of queued) {
            await uploadSingleFile(uploadFile);
        }

        // Don't reload here — let the Reverb broadcast trigger reload per file
        setIsUploading(false);
    };

    const handleCancelAll = () => {
        files.forEach((f) => {
            if (f.status === 'uploading') {
                f.abortController?.abort();
            }
        });

        setIsUploading(false);
    };

    const handleClose = () => {
        if (isUploading) {
            handleCancelAll();
        }

        setFiles([]);
        onClose();
    };

    const handleRetry = (uploadFile: UploadFile) => {
        setFiles((prev) =>
            prev.map((f) =>
                f.id === uploadFile.id
                    ? {
                          ...f,
                          status: 'queued' as FileStatus,
                          progress: 0,
                          errorMessage: undefined,
                      }
                    : f,
            ),
        );
    };

    // ----------------------------------------------------------------
    // Derived state
    // ----------------------------------------------------------------

    const queuedCount = files.filter((f) => f.status === 'queued').length;
    const processingCount = files.filter(
        (f) => f.status === 'processing',
    ).length;
    const doneCount = files.filter((f) => f.status === 'done').length;
    const allDone = files.length > 0 && doneCount === files.length;

    // ----------------------------------------------------------------
    // Render
    // ----------------------------------------------------------------

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            {/*
             * FIX 1: flex flex-col + max-h-[90vh]
             * Biến DialogContent thành flex column có chiều cao tối đa,
             * cho phép phần body scroll thay vì đẩy dialog ra ngoài màn hình.
             */}
            <DialogContent 
                className="flex max-h-[90vh] flex-col gap-0 rounded-2xl border-none p-0 shadow-2xl sm:max-w-[640px]"
                onInteractOutside={(e) => e.preventDefault()}
            >
                {/* Header — cố định, không scroll */}
                <DialogHeader className="shrink-0 border-b border-slate-100 px-6 pt-6 pb-4">
                    <DialogTitle className="text-base font-bold tracking-tight text-slate-800">
                        Upload Files
                    </DialogTitle>
                </DialogHeader>

                {/*
                 * FIX 2: min-h-0 flex-1 overflow-y-auto
                 * min-h-0 bắt buộc để flex child không bỏ qua giới hạn max-h của cha.
                 * flex-1 cho phép phần này chiếm hết không gian còn lại.
                 * overflow-y-auto bật scroll khi nội dung tràn.
                 */}
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
                    {/* Drop zone */}
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={[
                            'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-8 transition-all duration-200',
                            isDragging
                                ? 'border-[#c12222] bg-red-50'
                                : 'border-slate-200 bg-slate-50 hover:border-[#c12222] hover:bg-red-50/40',
                        ].join(' ')}
                    >
                        <div
                            className={[
                                'flex h-10 w-10 items-center justify-center rounded-full transition-colors',
                                isDragging
                                    ? 'bg-red-100'
                                    : 'bg-white shadow-sm',
                            ].join(' ')}
                        >
                            <Upload
                                className={`h-5 w-5 ${isDragging ? 'text-[#c12222]' : 'text-slate-400'}`}
                            />
                        </div>

                        <div className="text-center">
                            <p className="text-[13px] font-semibold text-slate-600">
                                Click to upload or drag and drop
                            </p>
                            <p className="mt-0.5 text-[11px] text-slate-400">
                                Any file type · Chunked in 5 MB pieces
                            </p>
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                                if (e.target.files) {
                                    addFiles(e.target.files);
                                }

                                e.target.value = '';
                            }}
                        />
                    </div>

                    {/* File list */}
                    {files.length > 0 && (
                        <div className="space-y-1">
                            <p className="ml-0.5 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                                Selected Files
                            </p>

                            {/*
                             * ScrollArea vẫn giữ để có thanh cuộn tuỳ chỉnh (custom scrollbar).
                             * max-h-[260px] hoạt động đúng vì parent đã có overflow-y-auto.
                             */}
                            <div className="max-h-[260px] overflow-y-auto">
                                <div className="space-y-2 pb-1">
                                    {files.map((uf) => (
                                        <FileRow
                                            key={uf.id}
                                            uploadFile={uf}
                                            onRemove={() => removeFile(uf.id)}
                                            onCancel={() => cancelFile(uf.id)}
                                            onRetry={() => handleRetry(uf)}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Add more files */}
                    {files.length > 0 && (
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-1.5 text-[12px] font-semibold text-[#c12222] transition-opacity hover:opacity-75"
                        >
                            <span className="flex h-4 w-4 items-center justify-center rounded-full border border-[#c12222] text-[10px] leading-none">
                                +
                            </span>
                            Add more files
                        </button>
                    )}
                </div>

                {/* Footer — cố định, không scroll */}
                <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={handleClose}
                        className="h-10 rounded-xl px-5 text-[13px] font-semibold text-slate-500 hover:bg-slate-50"
                    >
                        {allDone ? 'Close' : 'Cancel'}
                    </Button>

                    {isUploading ? (
                        <Button
                            type="button"
                            onClick={handleCancelAll}
                            className="h-10 rounded-xl bg-slate-800 px-6 text-[13px] font-bold text-white hover:bg-slate-700"
                        >
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Stop All
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            disabled={
                                queuedCount === 0 && processingCount === 0
                            }
                            onClick={handleUpload}
                            className="h-10 rounded-xl bg-[#c12222] px-6 text-[13px] font-bold text-white shadow-md shadow-red-900/10 transition-all hover:bg-[#a31c1c] active:scale-[0.98] disabled:scale-100 disabled:opacity-50"
                        >
                            {processingCount > 0 ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {`Processing (${processingCount})`}
                                </>
                            ) : (
                                <>
                                    <Upload className="mr-2 h-4 w-4" />
                                    {allDone
                                        ? 'Done'
                                        : `Upload${queuedCount > 0 ? ` (${queuedCount})` : ''}`}
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

// -------------------------------------------------------------------
// FileRow sub-component
// -------------------------------------------------------------------

interface FileRowProps {
    uploadFile: UploadFile;
    onRemove: () => void;
    onCancel: () => void;
    onRetry: () => void;
}

function FileRow({ uploadFile, onRemove, onCancel, onRetry }: FileRowProps) {
    const { file, status, progress, errorMessage } = uploadFile;

    const renderStatusLabel = () => {
        switch (status) {
            case 'queued':
                return <span className="text-slate-400">Ready to upload</span>;
            case 'uploading':
                return (
                    <span className="font-semibold text-[#c12222]">
                        {progress}%
                    </span>
                );
            case 'processing':
                return (
                    <span className="flex items-center gap-1 font-semibold text-amber-600">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Processing…
                    </span>
                );
            case 'done':
                return (
                    <span className="font-semibold text-emerald-600">Done</span>
                );
            case 'error':
                return (
                    <span className="font-semibold text-red-500">Failed</span>
                );
            case 'cancelled':
                return <span className="text-slate-400">Cancelled</span>;
            default:
                return null;
        }
    };

    const renderStatusIcon = () => {
        if (status === 'done') {
            return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
        }

        if (status === 'error') {
            return <XCircle className="h-3.5 w-3.5 text-red-500" />;
        }

        if (status === 'processing') {
            return <Clock className="h-3.5 w-3.5 text-amber-500" />;
        }

        return null;
    };

    const renderAction = () => {
        if (status === 'uploading') {
            return (
                <button
                    type="button"
                    onClick={onCancel}
                    title="Cancel"
                    className="flex h-6 w-6 items-center justify-center rounded-full text-slate-300 transition-colors hover:bg-slate-100 hover:text-slate-600"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            );
        }

        if (status === 'error') {
            return (
                <button
                    type="button"
                    onClick={onRetry}
                    title="Retry"
                    className="rounded-md px-2 py-0.5 text-[11px] font-semibold text-[#c12222] transition-colors hover:bg-red-50"
                >
                    Retry
                </button>
            );
        }

        // processing and done: no action available
        if (status === 'queued' || status === 'cancelled') {
            return (
                <button
                    type="button"
                    onClick={onRemove}
                    title="Remove"
                    className="flex h-6 w-6 items-center justify-center rounded-full text-slate-300 transition-colors hover:bg-slate-100 hover:text-slate-600"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            );
        }

        return null;
    };

    return (
        <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
            <div className="flex items-center gap-3">
                {/* File icon */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50">
                    <File className="h-4 w-4 text-slate-400" />
                </div>

                {/*
                 * FIX 3: min-w-0 trên info container
                 * Bắt buộc để truncate hoạt động trong flex child.
                 * Không có min-w-0, flex item sẽ không bao giờ co lại nhỏ hơn
                 * kích thước nội dung, khiến layout bị đẩy ra ngoài.
                 */}
                <div className="min-w-0 flex-1">
                    {/* Filename — truncates khi quá dài */}
                    <p className="truncate text-[13px] font-semibold text-slate-700">
                        {file.name}
                    </p>

                    {/*
                     * FIX 4: min-w-0 overflow-hidden trên dòng metadata
                     * Ngăn error message dài đẩy vỡ layout hàng ngang.
                     */}
                    <div className="mt-0.5 flex min-w-0 items-center gap-2 overflow-hidden">
                        <span className="shrink-0 text-[11px] text-slate-400">
                            {formatBytes(file.size)}
                        </span>

                        <span className="shrink-0 text-slate-300">·</span>

                        <div className="flex shrink-0 items-center gap-1">
                            {renderStatusIcon()}
                            <span className="text-[11px]">
                                {renderStatusLabel()}
                            </span>
                        </div>

                        {/*
                         * FIX 5: flex-1 min-w-0 truncate cho error message
                         * flex-1 cho phép nó chiếm phần còn lại của hàng,
                         * truncate cắt bớt thay vì tràn ra ngoài.
                         */}
                        {errorMessage && (
                            <p className="min-w-0 flex-1 truncate text-[11px] text-red-500">
                                {errorMessage}
                            </p>
                        )}
                    </div>

                    {/* Progress bar — show while uploading, processing, or done */}
                    {(status === 'uploading' ||
                        status === 'processing' ||
                        status === 'done') && (
                        <div className="mt-2">
                            <Progress
                                value={progress}
                                className={[
                                    'h-1',
                                    status === 'done'
                                        ? '*:data-[slot=progress-indicator]:bg-emerald-500'
                                        : status === 'processing'
                                          ? '*:data-[slot=progress-indicator]:bg-amber-500'
                                          : '*:data-[slot=progress-indicator]:bg-[#c12222]',
                                ].join(' ')}
                            />
                        </div>
                    )}
                </div>

                {/* Action button — shrink-0 đảm bảo không bị squish bởi tên file dài */}
                <div className="shrink-0">{renderAction()}</div>
            </div>
        </div>
    );
}
