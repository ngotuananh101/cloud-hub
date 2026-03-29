import { useForm } from '@inertiajs/react';
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface NewFolderModalProps {
    isOpen: boolean;
    onClose: () => void;
    connectionId: number;
    currentHash: string | null;
}

export default function NewFolderModal({
    isOpen,
    onClose,
    connectionId,
    currentHash,
}: NewFolderModalProps) {
    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({
            name: '',
            path: currentHash,
        });

    useEffect(() => {
        if (isOpen) {
            reset();
            clearErrors();
            setData('path', currentHash);
        }
    }, [isOpen, currentHash, reset, clearErrors, setData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // @ts-expect-error - Ziggy route global
        post(route('clouds.folders.store', { connection: connectionId }), {
            onSuccess: () => {
                onClose();
                reset();
            },
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="rounded-lg border-none p-6 shadow-2xl sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-base font-bold text-slate-800">
                        New Folder
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-3">
                        <Label
                            htmlFor="name"
                            className="ml-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase"
                        >
                            FOLDER NAME
                        </Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="Enter folder name"
                            className="h-12 rounded-lg border-slate-100 bg-slate-50/50 px-4 text-[14px] ring-[#c12222] transition-all focus:border-[#c12222] focus:ring-1"
                            autoFocus
                        />
                        {errors.name && (
                            <p className="ml-1 text-[12px] text-red-500">
                                {errors.name}
                            </p>
                        )}
                    </div>
                    <DialogFooter className="flex items-center justify-end gap-3 pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="h-11 rounded-xl px-6 text-[14px] font-semibold text-slate-500 hover:bg-slate-50"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing || !data.name.trim()}
                            className="h-11 rounded-xl bg-[#c12222] px-8 text-[14px] font-bold text-white shadow-lg shadow-red-900/10 transition-all hover:bg-[#a31c1c] active:scale-[0.98] disabled:scale-100 disabled:opacity-50"
                        >
                            {processing ? 'Creating...' : 'Create Folder'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
