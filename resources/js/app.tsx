import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { ToastProvider } from '@/components/ToastProvider';
import { Toaster } from '@/components/ui/sonner';
import '../css/app.css';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) => {
        const pagePromise = resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        );

        pagePromise.then((module: any) => {
            const originalLayout = module.default.layout;
            module.default.layout = (page: any) => {
                const layout = originalLayout ? originalLayout(page) : page;

                return (
                    <>
                        {layout}
                        <ToastProvider />
                        <Toaster richColors position="top-right" />
                    </>
                );
            };
        });

        return pagePromise;
    },
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(<App {...props} />);
    },
    progress: {
        color: '#c12222',
    },
});
