import { Head, Link, usePage } from '@inertiajs/react';
import {
    Bell,
    CirclePlus,
    Cloud,
    HelpCircle,
    LayoutDashboard,
    LogOut,
    Settings,
    Settings2,
    Upload,
} from 'lucide-react';
import React, { useEffect } from 'react';
import { route } from 'ziggy-js';
import ConnectCloudModal from '@/components/ConnectCloudModal';
import EditConnectionModal from '@/components/EditConnectionModal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

interface AppLayoutProps {
    title: string;
    children: React.ReactNode;
}

interface AuthUser {
    name: string;
    email: string;
    avatar: string;
}

interface Provider {
    id: string;
    name: string;
    icon: string;
    icon_url: string;
    driver: string;
    config_schema: Record<string, any>;
}

interface CloudConnection {
    id: number;
    provider_id: string;
    name: string;
    provider: Provider;
    settings?: Record<string, any>;
    credentials?: Record<string, any>;
}

export default function AppLayout({ title, children }: AppLayoutProps) {
    const { auth, cloudConnections } = usePage<{
        auth: { user: AuthUser };
        cloudConnections: CloudConnection[];
    }>().props;

    const user = auth.user;
    const [isConnectModalOpen, setIsConnectModalOpen] = React.useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
    const [selectedConnection, setSelectedConnection] =
        React.useState<CloudConnection | null>(null);

    useEffect(() => {
        const handleOpenModal = () => setIsConnectModalOpen(true);
        window.addEventListener('open-connect-cloud-modal', handleOpenModal);

        return () =>
            window.removeEventListener(
                'open-connect-cloud-modal',
                handleOpenModal,
            );
    }, []);

    const sidebarNav = [
        {
            label: '',
            items: [
                {
                    name: 'Dashboard',
                    icon: LayoutDashboard,
                    route: 'home',
                },
            ],
        },
        {
            label: 'CONNECTED STORAGE',
            items: cloudConnections.map((conn) => ({
                id: conn.id,
                name: conn.name,
                icon_url: conn.provider.icon_url,
                route: 'clouds.browse',
            })),
        },
        {
            label: 'SYSTEM',
            items: [
                { name: 'Settings', icon: Settings, route: 'settings.account' },
            ],
        },
    ];

    const initials = user.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <>
            <Head title={title} />
            <div className="flex h-screen bg-[#f8f8f9]">
                {/* Sidebar */}
                <aside className="flex w-[230px] shrink-0 flex-col border-r border-slate-200 bg-white">
                    {/* Logo */}
                    <div className="flex items-center gap-2.5 px-5 py-5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#c12222]">
                            <Cloud className="h-4 w-4 text-white" />
                        </div>
                        <div>
                            <div className="text-[13px] font-bold text-slate-900">
                                CloudHub
                            </div>
                            <div className="text-[10px] tracking-wider text-slate-400 uppercase">
                                The Digital Curator
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto px-3 py-4">
                        {sidebarNav.map((group, index) => (
                            <div key={group.label || index} className="mb-5">
                                {group.label && (
                                    <div className="mb-2 px-2 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                                        {group.label}
                                    </div>
                                )}
                                <ul className="space-y-0.5">
                                    {group.items.length > 0 ? (
                                        group.items.map((item: any) => {
                                            const isActive =
                                                item.route === 'clouds.browse'
                                                    ? route().current(
                                                          'clouds.browse',
                                                          {
                                                              connection:
                                                                  item.id,
                                                          },
                                                      )
                                                    : item.route
                                                      ? route().current(
                                                            item.route + '*',
                                                          )
                                                      : false;

                                            return (
                                                <li key={item.id ? `conn-${item.id}` : item.name}>
                                                    <div className="group relative flex items-center justify-between">
                                                        <Link
                                                            href={
                                                                item.route === 'clouds.browse'
                                                                    ? route(item.route, { connection: item.id })
                                                                    : item.route
                                                                        ? route(item.route)
                                                                        : '#'
                                                            }
                                                            className={`flex flex-1 items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                                                                isActive
                                                                    ? 'bg-[#c12222]/8 text-[#c12222]'
                                                                    : 'text-slate-600 group-hover:bg-slate-50 group-hover:text-slate-900'
                                                            }`}
                                                        >
                                                            {item.icon ? (
                                                                <item.icon className="h-4 w-4" />
                                                            ) : (
                                                                <img
                                                                    src={(item as any).icon_url}
                                                                    className="h-4 w-4 rounded-sm"
                                                                />
                                                            )}
                                                            <span className="truncate">{item.name}</span>
                                                        </Link>

                                                        {group.label === 'CONNECTED STORAGE' && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="absolute right-1.5 h-7 w-7 text-slate-400 opacity-0 transition-opacity hover:bg-slate-200 hover:text-slate-600 group-hover:opacity-100"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    const connection = cloudConnections.find(c => c.id === item.id);
                                                                    if (connection) {
                                                                        setSelectedConnection(connection);
                                                                        setIsEditModalOpen(true);
                                                                    }
                                                                }}
                                                            >
                                                                <Settings2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </li>
                                            );
                                        })
                                    ) : group.label === 'CONNECTED STORAGE' ? (
                                        <li className="px-3 py-2 text-[11px] italic text-slate-400">
                                            No accounts connected
                                        </li>
                                    ) : null}
                                </ul>
                            </div>
                        ))}
                    </nav>

                    {/* Add New Cloud */}
                    <div className="px-3 pb-3">
                        <Button
                            onClick={() => setIsConnectModalOpen(true)}
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#c12222] py-5 text-[13px] font-semibold text-white shadow-sm hover:bg-[#a31c1c]"
                        >
                            <CirclePlus className="h-4 w-4" />
                            Add New Cloud
                        </Button>
                    </div>

                    <Separator />

                    {/* Bottom links */}
                    <div className="px-3 py-3">
                        <ul className="space-y-0.5">
                            <li>
                                <span className="flex cursor-default items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-slate-500">
                                    <HelpCircle className="h-4 w-4" />
                                    Help
                                </span>
                            </li>
                            <li>
                                <Link
                                    href={route('logout')}
                                    method="post"
                                    as="button"
                                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Logout
                                </Link>
                            </li>
                        </ul>
                    </div>
                </aside>

                {/* Main Content */}
                <div className="flex flex-1 flex-col overflow-hidden">
                    {/* Top Header */}
                    <header className="flex h-[60px] shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
                        <div className="flex items-center gap-3">
                            <Input
                                type="text"
                                placeholder="Search..."
                                className="h-9 w-[320px] rounded-lg border-0 bg-slate-50/80 px-4 text-[12px] ring-1 ring-slate-200 ring-inset placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[#c12222] focus-visible:ring-inset"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="relative h-9 w-9 text-slate-500 hover:text-slate-700"
                            >
                                <Bell className="h-[18px] w-[18px]" />
                            </Button>
                            <Button className="flex items-center gap-2 rounded-lg bg-[#c12222] px-4 py-2 text-[12px] font-semibold text-white shadow-sm hover:bg-[#a31c1c]">
                                <Upload className="h-3.5 w-3.5" />
                                Upload
                            </Button>
                            <Avatar className="h-8 w-8 cursor-pointer ring-2 ring-slate-100">
                                <AvatarImage
                                    src={user.avatar}
                                    alt={user.name}
                                />
                                <AvatarFallback className="bg-[#c12222] text-[10px] font-bold text-white">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                    </header>

                    <main className="flex flex-1 flex-col overflow-hidden p-6">
                        {children}
                    </main>
                </div>
            </div>

            <ConnectCloudModal
                open={isConnectModalOpen}
                onOpenChange={setIsConnectModalOpen}
            />

            <EditConnectionModal
                connection={selectedConnection}
                open={isEditModalOpen}
                onOpenChange={setIsEditModalOpen}
            />
        </>
    );
}
