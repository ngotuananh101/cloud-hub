import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';

export function ToastProvider() {
    const { flash, errors } = usePage<any>().props;

        useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success, { id: 'flash-success' });
        }

        if (flash?.error) {
            toast.error(flash.error, { id: 'flash-error' });
        }

        if (flash?.info) {
            toast.info(flash.info, { id: 'flash-info' });
        }

        // Generic error toast if validation fails and no specific flash error is set
        if (errors && Object.keys(errors).length > 0 && !flash?.error) {
            toast.error('Có lỗi xảy ra, vui lòng kiểm tra lại thông tin.', {
                id: 'validation-error',
            });
        }
    }, [flash, errors]);

    return null;
}
