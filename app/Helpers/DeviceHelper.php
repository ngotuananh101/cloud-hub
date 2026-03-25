<?php

namespace App\Helpers;

use Illuminate\Http\Request;
use Jenssegers\Agent\Agent;

class DeviceHelper
{
    public static function properties(Request $request): array
    {
        $agent = new Agent();
        $agent->setUserAgent($request->userAgent());

        return [
            'ip' => $request->ip(),
            'browser' => $agent->browser() ?: 'Unknown',
            'browser_version' => $agent->version($agent->browser()) ?: null,
            'platform' => $agent->platform() ?: 'Unknown',
            'platform_version' => $agent->version($agent->platform()) ?: null,
            'device' => $agent->device() ?: 'Desktop',
        ];
    }
}
