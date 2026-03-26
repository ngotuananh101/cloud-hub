import {
    ArrowUpRight,
    Cloud,
    HardDrive,
    Server,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { ActivityTable } from '@/components/activity-table';
import type { Activity } from '@/components/activity-table';
import type { PaginationState } from "@tanstack/react-table";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import AppLayout from '@/layouts/AppLayout';
 
const storageData = [
    {
        name: 'Drive',
        icon: HardDrive,
        iconColor: 'text-blue-500',
        iconBg: 'bg-blue-50',
        used: 128,
        total: 910,
        unit: 'GB',
        percent: 25,
        barColor: 'bg-blue-500',
    },
    {
        name: 'OneDrive',
        icon: Cloud,
        iconColor: 'text-sky-500',
        iconBg: 'bg-sky-50',
        used: 842,
        total: 1024,
        unit: 'GB',
        percent: 82,
        barColor: 'bg-sky-500',
    },
    {
        name: 'AWS S3',
        icon: Server,
        iconColor: 'text-orange-500',
        iconBg: 'bg-orange-50',
        used: 4.2,
        total: null,
        unit: 'TB',
        percent: null,
        barColor: null,
        status: 'Active',
    },
    {
        name: 'Dropbox',
        icon: HardDrive,
        iconColor: 'text-indigo-500',
        iconBg: 'bg-indigo-50',
        used: 12,
        total: 200,
        unit: 'GB',
        percent: 60,
        barColor: 'bg-indigo-500',
    },
];
 
export default function Home() {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [pageCount, setPageCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    });
 
    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        fetch(`/api/activities?page=${pagination.pageIndex + 1}&limit=${pagination.pageSize}`)
            .then((res) => res.json())
            .then((data) => {
                if (!isMounted) {
                    return;
                }
                setActivities(data.data || []);
                setPageCount(data.last_page || 0);
                setLoading(false);
            })
            .catch(() => {
                if (isMounted) {
                    setLoading(false);
                }
            });
        return () => {
            isMounted = false;
        };
    }, [pagination]);
 
    return (
        <AppLayout title="Dashboard">
            {/* Page Header */}
            <div className="mb-6 flex items-start justify-between">
                <div>
                    <div className="mb-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                        System Health
                    </div>
                    <h1 className="text-[26px] font-bold text-slate-900">
                        Storage Overview
                    </h1>
                </div>
                <Badge
                    variant="outline"
                    className="mt-2 gap-1.5 border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700"
                >
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    All systems operational
                </Badge>
            </div>

            {/* Storage Cards */}
            <div className="mb-8 grid grid-cols-4 gap-4">
                {storageData.map((storage) => (
                    <Card
                        key={storage.name}
                        className="rounded-xl border-0 shadow-sm ring-1 ring-slate-100"
                    >
                        <CardContent className="p-4">
                            <div className="mb-3 flex items-center justify-between">
                                <div
                                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${storage.iconBg}`}
                                >
                                    <storage.icon
                                        className={`h-4 w-4 ${storage.iconColor}`}
                                    />
                                </div>
                                <span className="text-[11px] font-medium tracking-wide text-slate-400 uppercase">
                                    {storage.name}
                                </span>
                            </div>
                            <div className="mb-2">
                                <span className="text-[22px] font-bold text-slate-900">
                                    {storage.used}
                                </span>
                                {storage.total && (
                                    <span className="text-[12px] text-slate-400">
                                        /{storage.total}
                                        {storage.unit}
                                    </span>
                                )}
                                {storage.status && (
                                    <span className="ml-1.5 text-[12px] text-slate-400">
                                        Unlimited
                                    </span>
                                )}
                            </div>
                            {storage.percent !== null ? (
                                <div className="flex items-center gap-2">
                                    <Progress
                                        value={storage.percent}
                                        className="h-1.5 flex-1 bg-slate-100"
                                    />
                                    <span className="text-[10px] font-semibold text-slate-500">
                                        {storage.percent}% Used
                                    </span>
                                </div>
                            ) : (
                                <Badge
                                    variant="outline"
                                    className="border-emerald-200 bg-emerald-50 text-[10px] font-medium text-emerald-600"
                                >
                                    {storage.status}
                                </Badge>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-3 gap-6">
                {/* Recent Activity */}
                <div className="col-span-2">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-[15px] font-bold text-slate-900">
                            Recent Activity
                        </h2>
                        <Button
                            variant="link"
                            className="h-auto p-0 text-[12px] font-semibold text-blue-600"
                        >
                            View History
                        </Button>
                    </div>
                    <Card className="rounded-xl border-0 shadow-sm ring-1 ring-slate-100">
                        <CardContent className="p-0">
                            {loading ? (
                                <div className="flex h-32 items-center justify-center text-[13px] text-slate-400">
                                    Loading activities...
                                </div>
                            ) : (
                                <ActivityTable 
                                    data={activities} 
                                    pageCount={pageCount}
                                    pagination={pagination}
                                    onPaginationChange={setPagination}
                                />
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Cloud Hub Info */}
                    <Card className="rounded-xl border-0 shadow-sm ring-1 ring-slate-100">
                        <CardHeader className="pt-5 pb-3 text-center">
                            <CardTitle className="text-[15px] font-bold text-slate-900">
                                Cloud Hub
                            </CardTitle>
                            <p className="text-[11px] leading-relaxed text-slate-400">
                                Centralize your data. Connect another provider
                                to manage all files from one dashboard.
                            </p>
                        </CardHeader>
                        <CardContent className="pb-5">
                            <div className="mb-4 flex justify-center gap-5">
                                <div className="flex flex-col items-center gap-1">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                                        <HardDrive className="h-4 w-4 text-blue-500" />
                                    </div>
                                    <span className="text-[9px] font-semibold tracking-wide text-slate-400 uppercase">
                                        Drive
                                    </span>
                                </div>
                                <div className="flex flex-col items-center gap-1">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50">
                                        <Cloud className="h-4 w-4 text-sky-500" />
                                    </div>
                                    <span className="text-[9px] font-semibold tracking-wide text-slate-400 uppercase">
                                        Azure
                                    </span>
                                </div>
                                <div className="flex flex-col items-center gap-1">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50">
                                        <Server className="h-4 w-4 text-orange-500" />
                                    </div>
                                    <span className="text-[9px] font-semibold tracking-wide text-slate-400 uppercase">
                                        AWS
                                    </span>
                                </div>
                            </div>
                            <Button className="w-full rounded-lg bg-slate-900 py-2.5 text-[12px] font-semibold text-white hover:bg-slate-800">
                                Connect Storage
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Total Usage */}
                    <Card className="overflow-hidden rounded-xl border-0 bg-linear-to-br from-[#c12222] to-[#8b1a1a] text-white shadow-lg">
                        <CardContent className="p-5">
                            <div className="mb-1 text-[10px] font-bold tracking-widest uppercase opacity-70">
                                Total Usage
                            </div>
                            <div className="mb-3 text-[28px] font-bold">
                                1.2 TB
                            </div>
                            <p className="mb-3 text-[11px] leading-relaxed opacity-80">
                                You've increased your cloud storage usage by 12%
                                this month. Upgrade for more bandwidth.
                            </p>
                            <Button
                                variant="link"
                                className="h-auto gap-1 p-0 text-[12px] font-semibold text-white hover:no-underline"
                            >
                                Manage Billing
                                <ArrowUpRight className="h-3.5 w-3.5" />
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
