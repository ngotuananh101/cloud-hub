<?php

namespace App\Http\Controllers;

use App\Helpers\DeviceHelper;
use App\Models\CloudConnection;
use App\Models\Provider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Exception;

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

        // Check connection for non-OAuth providers
        $this->validateConnection(
            $provider->id, 
            $validated['credentials'], 
            $validated['settings'] ?? []
        );

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

    public function update(Request $request, CloudConnection $cloudConnection)
    {
        if ($cloudConnection->user_id !== Auth::id()) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'credentials' => 'nullable|array',
            'settings' => 'nullable|array',
        ]);

        $oldName = $cloudConnection->name;
        
        $updateData = [
            'name' => $validated['name'],
        ];

        // Only update credentials if provided
        if (!empty($validated['credentials'])) {
            $updateData['credentials'] = array_merge(
                $cloudConnection->getRawOriginal('credentials') ? json_decode(decrypt($cloudConnection->getRawOriginal('credentials')), true) : [],
                $validated['credentials']
            );
        }

        if (isset($validated['settings'])) {
            $updateData['settings'] = array_merge($cloudConnection->settings ?? [], $validated['settings']);
        }

        if (!empty($validated['credentials']) || isset($validated['settings'])) {
            $this->validateConnection(
                $cloudConnection->provider?->id,
                array_merge(
                    $cloudConnection->getRawOriginal('credentials') ? json_decode(decrypt($cloudConnection->getRawOriginal('credentials')), true) : [],
                    $validated['credentials'] ?? []
                ),
                array_merge($cloudConnection->settings ?? [], $validated['settings'] ?? [])
            );
        }

        $cloudConnection->update($updateData);

        activity('cloud_connection')
            ->causedBy(Auth::user())
            ->performedOn($cloudConnection)
            ->withProperties(array_merge(
                DeviceHelper::properties($request),
                [
                    'provider' => $cloudConnection->provider?->name ?? 'Unknown',
                    'old_name' => $oldName,
                    'new_name' => $validated['name'],
                ]
            ))
            ->log("Updated cloud connection '{$oldName}' ({$cloudConnection->provider?->name})");

        return back()->with('success', 'Cloud connection updated successfully!');
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

    private function validateConnection(string $providerId, array $credentials, array $settings = [])
    {
        $oauthProviders = ['google', 'onedrive', 'dropbox'];
        if (in_array($providerId, $oauthProviders)) {
            return;
        }

        $config = array_merge($credentials, $settings);
        $config['driver'] = $providerId;

        // Special handling for drivers that use different key names internally
        if ($providerId === 's3') {
            $config['bucket'] = $credentials['bucket'] ?? '';
            $config['key'] = $credentials['key'] ?? '';
            $config['secret'] = $credentials['secret'] ?? '';
            $config['region'] = $credentials['region'] ?? 'us-east-1';
        }

        try {
            $disk = Storage::build($config);
            // Attempt to list files as a connection check
            // We use a low limit or just check the first item for speed
            $disk->files('/');
        } catch (Exception $e) {
            abort(422, "Connection check failed: {$e->getMessage()}");
        }
    }
}
