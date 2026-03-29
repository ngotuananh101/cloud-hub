import { usePage } from '@inertiajs/react';
import { ArrowUpRight, Plus } from 'lucide-react';
import React from 'react';

import { ActivityTable } from '@/components/activity-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import AppLayout from '@/layouts/AppLayout';

const formatBytes = (bytes: number | null, decimals = 2) => {
    if (bytes === null || bytes === undefined || bytes === 0) {
        return '0 GB';
    }

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const val = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));

    return `${val} ${sizes[i]}`;
};

export default function Home() {
    const { cloudConnections, providers } = usePage<{
        cloudConnections: any[];
        providers: any[];
    }>().props;

    const openConnectModal = () => {
        window.dispatchEvent(new CustomEvent('open-connect-cloud-modal'));
    };

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
                {cloudConnections.length > 0
                    ? cloudConnections.slice(0, 4).map((conn) => {
                          const percent = conn.quota_total
                              ? (conn.quota_used / conn.quota_total) * 100
                              : 0;

                          return (
                              <Card
                                  key={conn.id}
                                  className="rounded-xl border-0 shadow-sm ring-1 ring-slate-100"
                              >
                                  <CardContent className="p-4">
                                      <div className="mb-3 flex items-center justify-between">
                                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50">
                                              <img
                                                  src={conn.provider.icon_url}
                                                  alt={conn.provider.name}
                                                  className="h-5 w-5"
                                              />
                                          </div>
                                          <Badge
                                              variant="outline"
                                              className="border-emerald-200 bg-emerald-50 text-[9px] font-bold text-emerald-600 uppercase"
                                          >
                                              {conn.status}
                                          </Badge>
                                      </div>
                                      <div className="mb-1 truncate text-[14px] font-bold text-slate-800">
                                          {conn.name}
                                      </div>
                                      <div className="mb-3 text-[10px] text-slate-400">
                                          Joined{' '}
                                          {new Date(
                                              conn.created_at,
                                          ).toLocaleDateString()}
                                      </div>
                                      <div className="mb-2">
                                          <span className="text-[18px] font-bold text-slate-900">
                                              {formatBytes(conn.quota_used)}
                                          </span>
                                          <span className="ml-1 text-[11px] text-slate-400">
                                              / {formatBytes(conn.quota_total)}
                                          </span>
                                      </div>
                                      {conn.quota_total ? (
                                          <div className="flex items-center gap-2">
                                              <Progress
                                                  value={percent}
                                                  className="h-1.5 flex-1 bg-slate-100"
                                              />
                                              <span className="text-[10px] font-semibold text-slate-500">
                                                  {Math.round(percent)}%
                                              </span>
                                          </div>
                                      ) : (
                                          <div className="h-1.5 w-full rounded-full bg-slate-100" />
                                      )}
                                  </CardContent>
                              </Card>
                          );
                      })
                    : Array.from({ length: 4 }).map((_, i) => (
                          <Card
                              key={i}
                              onClick={openConnectModal}
                              className="ring-dashed cursor-pointer rounded-xl border-0 bg-slate-50/50 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
                          >
                              <CardContent className="flex h-full flex-col items-center justify-center p-6 text-center">
                                  <Plus className="mb-2 h-6 w-6 text-slate-300" />
                                  <span className="text-[11px] font-medium text-slate-400">
                                      Add cloud to track usage
                                  </span>
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
                            <ActivityTable />
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
                                {providers.slice(0, 3).map((provider) => (
                                    <div
                                        key={provider.id}
                                        className="flex flex-col items-center gap-1"
                                    >
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50">
                                            <img
                                                src={provider.icon_url}
                                                alt={provider.name}
                                                className="h-5 w-5"
                                            />
                                        </div>
                                        <span className="text-[9px] font-semibold tracking-wide text-slate-400 uppercase">
                                            {provider.name.split(' ')[0]}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <Button
                                onClick={openConnectModal}
                                className="w-full rounded-lg bg-slate-900 py-2.5 text-[12px] font-semibold text-white hover:bg-slate-800"
                            >
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
