'use client';

import type { ColumnDef, PaginationState, OnChangeFn } from '@tanstack/react-table';
import { format, isToday, isYesterday } from 'date-fns';
import {
    Activity as ActivityIcon,
    LogIn,
    RefreshCw,
    ShieldCheck,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';

export type Activity = {
    id: number;
    description: string;
    subject_type: string | null;
    subject_id: number | null;
    causer_type: string | null;
    causer_id: number | null;
    properties: {
        ip?: string;
        browser?: string;
        platform?: string;
        [key: string]: any;
    };
    created_at: string;
};

const getIcon = (description: string) => {
    const desc = description.toLowerCase();

    if (desc.includes('login')) {
        return <LogIn className="h-4 w-4" />;
    }

    if (desc.includes('password') || desc.includes('security')) {
        return <ShieldCheck className="h-4 w-4" />;
    }

    if (desc.includes('sync')) {
        return <RefreshCw className="h-4 w-4" />;
    }

    return <ActivityIcon className="h-4 w-4" />;
};

export const columns: ColumnDef<Activity>[] = [
    {
        accessorKey: 'description',
        header: () => (
            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                Activity
            </span>
        ),
        cell: ({ row }) => {
            const description = row.getValue('description') as string;

            return (
                <div className="flex items-center gap-3 py-1">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-[#c12222]">
                        {getIcon(description)}
                    </div>
                    <span className="text-[14px] font-medium text-slate-900">
                        {description}
                    </span>
                </div>
            );
        },
    },
    {
        accessorKey: 'properties',
        header: () => (
            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                Device/IP
            </span>
        ),
        cell: ({ row }) => {
            const properties = row.original.properties;
            const device = `${properties.browser || 'Unknown'} on ${properties.platform || 'Unknown'}`;
            const ip = properties.ip || 'Unknown';

            return (
                <div className="flex flex-col py-1">
                    <span className="text-[13px] text-slate-600">{device}</span>
                    <span className="text-[12px] text-slate-400">({ip})</span>
                </div>
            );
        },
    },
    {
        accessorKey: 'created_at',
        header: () => (
            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                Date/Time
            </span>
        ),
        cell: ({ row }) => {
            const date = new Date(row.getValue('created_at'));
            let prefix = '';

            if (isToday(date)) {
                prefix = 'Today, ';
            } else if (isYesterday(date)) {
                prefix = 'Yesterday, ';
            } else {
                prefix = format(date, 'MMM d, ');
            }

            const timeStr = prefix + format(date, 'hh:mm a');

            return (
                <span className="text-[13px] text-slate-600">{timeStr}</span>
            );
        },
    },
    {
        id: 'status',
        header: () => (
            <span className="block text-right text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                Status
            </span>
        ),
        cell: () => {
            return (
                <div className="text-right">
                    <Badge
                        variant="outline"
                        className="border-emerald-100 bg-emerald-50 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50"
                    >
                        Success
                    </Badge>
                </div>
            );
        },
    },
];

export function ActivityTable() {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [pageCount, setPageCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 6,
    });

    useEffect(() => {
        let isMounted = true;

        fetch(
            `/api/activities?page=${pagination.pageIndex + 1}&limit=${pagination.pageSize}`,
        )
            .then((res) => res.json())
            .then((data) => {
                if (!isMounted) {
                    return;
                }

                setActivities(data.data || []);
                setPageCount(Math.max(1, data.last_page || 1));

                if (typeof data.current_page === 'number') {
                    setCurrentPage(Math.max(1, data.current_page));
                    setPagination((prev) => ({
                        ...prev,
                        pageIndex: Math.max(0, data.current_page - 1),
                    }));
                }

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
    }, [pagination.pageIndex, pagination.pageSize]);

    const handlePaginationChange: OnChangeFn<PaginationState> = (updater) => {
        setLoading(true);
        setPagination((prev) =>
            typeof updater === 'function' ? updater(prev) : updater,
        );
    };

    return (
        <DataTable
            columns={columns}
            data={activities}
            pageCount={pageCount}
            currentPage={currentPage}
            pagination={pagination}
            onPaginationChange={handlePaginationChange}
            isLoading={loading}
        />
    );
}
