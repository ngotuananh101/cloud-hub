<?php

namespace App\Http\Controllers;

use App\Helpers\DeviceHelper;
use App\Models\CloudConnection;
use App\Models\Provider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CloudConnectionController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'provider_id' => 'required|exists:providers,id',
            'name' => 'required|string|max:255',
            'credentials' => 'required|array',
            'settings' => 'nullable|array',
        ]);

        $provider = Provider::findOrFail($validated['provider_id']);

        // Here you would normally validate the credentials against the provider's driver
        // For now, we'll just save it.

        $connection = CloudConnection::create([
            'user_id' => Auth::id(),
            'provider_id' => $provider->id,
            'name' => $validated['name'],
            'credentials' => $validated['credentials'],
            'settings' => $validated['settings'] ?? [],
            'status' => 'active',
        ]);

        activity('cloud_connection')
            ->causedBy(Auth::user())
            ->performedOn($connection)
            ->withProperties(array_merge(
                DeviceHelper::properties($request),
                [
                    'provider' => $provider->name,
                    'connection_name' => $connection->name,
                ]
            ))
            ->log("Connected cloud storage '{$connection->name}' ({$provider->name})");

        return back()->with('success', "Cloud storage '{$connection->name}' connected successfully!");
    }

    public function destroy(CloudConnection $cloudConnection)
    {
        if ($cloudConnection->user_id !== Auth::id()) {
            abort(403);
        }

        $connectionName = $cloudConnection->name;
        $providerName = $cloudConnection->provider?->name ?? 'Unknown';

        $cloudConnection->delete();

        activity('cloud_connection')
            ->causedBy(Auth::user())
            ->performedOn($cloudConnection)
            ->withProperties(array_merge(
                DeviceHelper::properties(request()),
                [
                    'provider' => $providerName,
                    'connection_name' => $connectionName,
                ]
            ))
            ->log("Removed cloud connection '{$connectionName}' ({$providerName})");

        return back()->with('success', 'Cloud connection removed.');
    }
}
