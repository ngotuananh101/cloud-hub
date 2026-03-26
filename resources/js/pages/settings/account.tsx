import { useForm, usePage } from '@inertiajs/react';
import { Activity as ActivityIcon, Eye, EyeOff } from 'lucide-react';
import type { FormEventHandler} from 'react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/AppLayout';

interface ActivityLog {
    id: number;
    description: string;
    properties: {
        ip?: string;
        browser?: string;
        platform?: string;
        email?: string;
    };
    created_at: string;
    created_at_human: string;
}

interface Props {
    activities: ActivityLog[];
    status?: string;
}

export default function AccountSettings({ activities }: Props) {
    const { auth } = usePage().props as any;
    const user = auth.user;

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Profile Form
    const {
        data: profileData,
        setData: setProfileData,
        patch: patchProfile,
        processing: profileProcessing,
        errors: profileErrors,
    } = useForm({
        name: user.name,
        email: user.email,
    });

    const updateProfile: FormEventHandler = (e) => {
        e.preventDefault();
        patchProfile(route('settings.profile'), {
            onSuccess: () => toast.success('Profile updated successfully'),
        });
    };

    // Password Form
    const {
        data: passwordData,
        setData: setPasswordData,
        put: putPassword,
        processing: passwordProcessing,
        errors: passwordErrors,
        reset: resetPassword,
    } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword: FormEventHandler = (e) => {
        e.preventDefault();
        putPassword(route('settings.password'), {
            onSuccess: () => {
                toast.success('Password changed successfully');
                resetPassword();
            },
        });
    };

    return (
        <AppLayout title="Account Settings">
            <div className="mb-6">
                <h1 className="text-[26px] font-bold text-slate-900">
                    Account Settings
                </h1>
                <p className="text-[13px] text-slate-500">
                    Manage your digital identity and secure your files across
                    all cloud providers.
                </p>
            </div>

            <Tabs defaultValue="profile" className="w-full">
                <div className="mb-3 border-b border-slate-200">
                    <TabsList
                    variant="line"
                    className="justify-start gap-10"
                >
                    <TabsTrigger
                        value="profile"
                        className="px-0 pb-3 text-[13px] font-medium transition-all data-active:font-bold data-active:text-[#c12222] data-active:after:bg-[#c12222]"
                    >
                        Profile
                    </TabsTrigger>
                    <TabsTrigger
                        value="security"
                        className="px-0 pb-3 text-[13px] font-medium transition-all data-active:font-bold data-active:text-[#c12222] data-active:after:bg-[#c12222]"
                    >
                        Security
                    </TabsTrigger>
                    <TabsTrigger
                        value="activity"
                        className="px-0 pb-3 text-[13px] font-medium transition-all data-active:font-bold data-active:text-[#c12222] data-active:after:bg-[#c12222]"
                    >
                        Activity
                    </TabsTrigger>
                </TabsList>
                </div>

                {/* Profile Tab */}
                <TabsContent value="profile" className="mt-0 outline-none">
                    <Card className="border-0 shadow-sm ring-1 ring-slate-100">
                        <CardHeader>
                            <CardTitle className="text-[16px] font-bold text-slate-900">
                                Profile Information
                            </CardTitle>
                            <CardDescription className="text-[12px]">
                                Update your account's profile information and
                                email address.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={updateProfile} className="space-y-5">
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="name"
                                        className="text-[12px] font-semibold text-slate-700"
                                    >
                                        FULL NAME
                                    </Label>
                                    <Input
                                        id="name"
                                        value={profileData.name}
                                        onChange={(e) =>
                                            setProfileData(
                                                'name',
                                                e.target.value,
                                            )
                                        }
                                        className="h-10 border-slate-200 bg-slate-50/50 text-[13px] outline-none focus-visible:ring-1 focus-visible:ring-[#c12222]"
                                    />
                                    {profileErrors.name && (
                                        <p className="text-[11px] text-red-500">
                                            {profileErrors.name}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="email"
                                        className="text-[12px] font-semibold text-slate-700"
                                    >
                                        EMAIL ADDRESS
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={profileData.email}
                                        onChange={(e) =>
                                            setProfileData(
                                                'email',
                                                e.target.value,
                                            )
                                        }
                                        className="h-10 border-slate-200 bg-slate-50/50 text-[13px] outline-none focus-visible:ring-1 focus-visible:ring-[#c12222]"
                                    />
                                    {profileErrors.email && (
                                        <p className="text-[11px] text-red-500">
                                            {profileErrors.email}
                                        </p>
                                    )}
                                </div>
                                <div className="pt-2">
                                    <Button
                                        disabled={profileProcessing}
                                        className="bg-[#c12222] px-6 text-[12px] font-semibold hover:bg-[#a31c1c]"
                                    >
                                        Update Profile
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security" className="mt-0 outline-none">
                    <Card className="border-0 shadow-sm ring-1 ring-slate-100">
                        <CardHeader>
                            <CardTitle className="text-[16px] font-bold text-slate-900">
                                Password & Security
                            </CardTitle>
                            <CardDescription className="text-[12px]">
                                Ensure your account is using a long, random
                                password to stay secure.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form
                                onSubmit={updatePassword}
                                className="space-y-5"
                            >
                                <div className="space-y-1.5">
                                    <Label
                                        htmlFor="current_password"
                                        className="text-[12px] font-semibold text-slate-700"
                                    >
                                        CURRENT PASSWORD
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="current_password"
                                            type={
                                                showCurrentPassword
                                                    ? 'text'
                                                    : 'password'
                                            }
                                            value={passwordData.current_password}
                                            onChange={(e) =>
                                                setPasswordData(
                                                    'current_password',
                                                    e.target.value,
                                                )
                                            }
                                            className="h-10 border-slate-200 bg-slate-50/50 pr-10 text-[13px] outline-none focus-visible:ring-1 focus-visible:ring-[#c12222]"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-0 top-0 h-10 w-10 text-slate-400 hover:bg-transparent hover:text-slate-600"
                                            onClick={() =>
                                                setShowCurrentPassword(
                                                    !showCurrentPassword,
                                                )
                                            }
                                        >
                                            {showCurrentPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                    {passwordErrors.current_password && (
                                        <p className="text-[11px] text-red-500">
                                            {passwordErrors.current_password}
                                        </p>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label
                                            htmlFor="password"
                                            className="text-[12px] font-semibold text-slate-700"
                                        >
                                            NEW PASSWORD
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="password"
                                                type={
                                                    showPassword
                                                        ? 'text'
                                                        : 'password'
                                                }
                                                value={passwordData.password}
                                                onChange={(e) =>
                                                    setPasswordData(
                                                        'password',
                                                        e.target.value,
                                                    )
                                                }
                                                className="h-10 border-slate-200 bg-slate-50/50 pr-10 text-[13px] outline-none focus-visible:ring-1 focus-visible:ring-[#c12222]"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute right-0 top-0 h-10 w-10 text-slate-400 hover:bg-transparent hover:text-slate-600"
                                                onClick={() =>
                                                    setShowPassword(
                                                        !showPassword,
                                                    )
                                                }
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                        {passwordErrors.password && (
                                            <p className="text-[11px] text-red-500">
                                                {passwordErrors.password}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label
                                            htmlFor="password_confirmation"
                                            className="text-[12px] font-semibold text-slate-700"
                                        >
                                            CONFIRM PASSWORD
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="password_confirmation"
                                                type={
                                                    showConfirmPassword
                                                        ? 'text'
                                                        : 'password'
                                                }
                                                value={
                                                    passwordData.password_confirmation
                                                }
                                                onChange={(e) =>
                                                    setPasswordData(
                                                        'password_confirmation',
                                                        e.target.value,
                                                    )
                                                }
                                                className="h-10 border-slate-200 bg-slate-50/50 pr-10 text-[13px] outline-none focus-visible:ring-1 focus-visible:ring-[#c12222]"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute right-0 top-0 h-10 w-10 text-slate-400 hover:bg-transparent hover:text-slate-600"
                                                onClick={() =>
                                                    setShowConfirmPassword(
                                                        !showConfirmPassword,
                                                    )
                                                }
                                            >
                                                {showConfirmPassword ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-2">
                                    <Button
                                        disabled={passwordProcessing}
                                        className="bg-slate-900 px-6 text-[12px] font-semibold hover:bg-slate-800"
                                    >
                                        Update Password
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Activity Tab */}
                <TabsContent value="activity" className="mt-0 outline-none">
                    <Card className="border-0 shadow-sm ring-1 ring-slate-100">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-[16px] font-bold text-slate-900">
                                    Recent Activity
                                </CardTitle>
                                <CardDescription className="text-[12px]">
                                    View your latest account security and
                                    authentication logs.
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-slate-50/50 text-[11px]">
                                    <TableRow>
                                        <TableHead className="px-6 font-bold text-slate-500 uppercase">
                                            Activity
                                        </TableHead>
                                        <TableHead className="font-bold text-slate-500 uppercase">
                                            Device / IP
                                        </TableHead>
                                        <TableHead className="font-bold text-slate-500 uppercase">
                                            Date / Time
                                        </TableHead>
                                        <TableHead className="pr-6 text-right font-bold text-slate-500 uppercase">
                                            Status
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {activities.length > 0 ? (
                                        activities.map((log) => (
                                            <TableRow
                                                key={log.id}
                                                className="text-[13px]"
                                            >
                                                <TableCell className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-[#c12222]">
                                                            <ActivityIcon className="h-4 w-4" />
                                                        </div>
                                                        <span className="font-semibold text-slate-700">
                                                            {log.description}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <div className="text-slate-600">
                                                        {log.properties
                                                            .browser ||
                                                            'Unknown'}{' '}
                                                        on{' '}
                                                        {log.properties
                                                            .platform ||
                                                            'Unknown'}
                                                    </div>
                                                    <div className="text-[11px] text-slate-400">
                                                        ({log.properties.ip ||
                                                            'Unknown'})
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <div className="text-slate-600">
                                                        {log.created_at_human}
                                                    </div>
                                                    <div className="text-[11px] text-slate-400">
                                                        {log.created_at}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4 pr-6 text-right">
                                                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                                                        Success
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={4}
                                                className="py-12 text-center text-slate-400"
                                            >
                                                No activity recorded yet.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </AppLayout>
    );
}
