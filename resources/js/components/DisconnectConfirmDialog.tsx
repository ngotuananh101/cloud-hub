import { OctagonAlert, X } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DisconnectConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    providerName: string;
    processing?: boolean;
}

export default function DisconnectConfirmDialog({
    open,
    onOpenChange,
    onConfirm,
    providerName,
    processing,
}: DisconnectConfirmDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-[400px] gap-0 border-0 p-0 sm:rounded-[24px]">
                <div className="relative p-6">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-4 right-4 h-8 w-8 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        onClick={() => onOpenChange(false)}
                    >
                        <X className="h-4 w-4" />
                    </Button>

                    <div className="flex flex-col items-center gap-4 pt-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-red-50">
                            <OctagonAlert className="h-8 w-8 text-[#c12222]" />
                        </div>

                        <div className="space-y-2 text-center">
                            <AlertDialogTitle className="text-[20px] font-bold text-slate-900">
                                Disconnect {providerName}?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-[14px] leading-relaxed text-slate-500">
                                Are you sure you want to disconnect your{' '}
                                <span className="font-semibold text-slate-700">
                                    {providerName}
                                </span>{' '}
                                account? You will no longer be able to access,
                                move, or sync files from this provider through
                                CloudHub. This will not delete any files from{' '}
                                {providerName} itself.
                            </AlertDialogDescription>
                        </div>
                    </div>
                </div>

                <AlertDialogFooter className="flex flex-row items-center gap-3 border-t border-slate-50 bg-slate-50/30 p-6">
                    <AlertDialogCancel asChild>
                        <Button
                            variant="outline"
                            className="h-12 flex-1 rounded-xl border-slate-200 text-[14px] font-bold text-slate-600 hover:bg-slate-50"
                        >
                            Cancel
                        </Button>
                    </AlertDialogCancel>
                    <AlertDialogAction asChild>
                        <Button
                            onClick={(e) => {
                                e.preventDefault();
                                onConfirm();
                            }}
                            disabled={processing}
                            className="h-12 flex-1 rounded-xl bg-[#c12222] text-[14px] font-bold text-white shadow-lg shadow-red-500/10 hover:bg-[#a31c1c]"
                        >
                            {processing
                                ? 'Disconnecting...'
                                : 'Disconnect Service'}
                        </Button>
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
