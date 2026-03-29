<?php

namespace App\Http\Controllers;

use App\Helpers\DeviceHelper;
use App\Models\Provider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class OAuthController extends Controller
{
    /**
     * Redirect the user to the provider's OAuth 2.0 authorization page.
     */
    public function redirect(Request $request, string $providerId)
    {
        Provider::where('is_active', true)->findOrFail($providerId);

        return match ($providerId) {
            'dropbox' => $this->redirectToDropbox($request),
            'google' => $this->redirectToGoogle($request),
            'onedrive' => $this->redirectToOneDrive($request),
            default => abort(404, 'Provider OAuth flow not supported yet.'),
        };
    }

    /**
     * Handle the callback from the provider after the user authorizes the app.
     */
    public function callback(Request $request, string $providerId)
    {
        $provider = Provider::where('is_active', true)->findOrFail($providerId);

        // Verify CSRF state
        $state = $request->get('state');
        if (! $state || $state !== $request->session()->pull('oauth_state')) {
            return redirect()->route('home')->withErrors(['oauth' => 'Invalid state parameter. Authentication failed.']);
        }

        if ($request->has('error')) {
            return redirect()->route('home')->withErrors(['oauth' => $request->get('error_description', 'Authorization denied.')]);
        }

        $code = $request->get('code');

        return match ($providerId) {
            'dropbox' => $this->handleDropboxCallback($request, $provider, $code),
            'google' => $this->handleGoogleCallback($request, $provider, $code),
            'onedrive' => $this->handleOneDriveCallback($request, $provider, $code),
            default => abort(404, 'Provider OAuth callback not supported yet.'),
        };
    }

    protected function redirectToDropbox(Request $request)
    {
        $clientId = config('cloud-hub.providers.dropbox.id');
        $redirectUri = route('oauth.callback', ['provider' => 'dropbox']);
        $state = Str::random(40);

        $request->session()->put('oauth_state', $state);
        $request->session()->put('oauth_connection_name', $request->query('name', 'Dropbox ('.now()->format('Y-m-d').')'));
        $request->session()->put('oauth_connection_id', $request->query('connection_id'));

        $url = 'https://www.dropbox.com/oauth2/authorize?'.http_build_query([
            'client_id' => $clientId,
            'response_type' => 'code',
            'redirect_uri' => $redirectUri,
            'state' => $state,
            'token_access_type' => 'offline',
        ]);

        return redirect($url);
    }

    protected function redirectToGoogle(Request $request)
    {
        $clientId = config('cloud-hub.providers.google.id');
        $redirectUri = route('oauth.callback', ['provider' => 'google']);
        $state = Str::random(40);

        $request->session()->put('oauth_state', $state);
        $request->session()->put('oauth_connection_name', $request->query('name', 'Google Drive ('.now()->format('Y-m-d').')'));
        $request->session()->put('oauth_connection_id', $request->query('connection_id'));

        $url = 'https://accounts.google.com/o/oauth2/v2/auth?'.http_build_query([
            'client_id' => $clientId,
            'response_type' => 'code',
            'redirect_uri' => $redirectUri,
            'state' => $state,
            'scope' => 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
            'access_type' => 'offline',
            'prompt' => 'consent',
        ]);

        return redirect($url);
    }

    protected function redirectToOneDrive(Request $request)
    {
        $clientId = config('cloud-hub.providers.onedrive.id');
        $redirectUri = route('oauth.callback', ['provider' => 'onedrive']);
        $state = Str::random(40);

        $request->session()->put('oauth_state', $state);
        $request->session()->put('oauth_connection_name', $request->query('name', 'OneDrive ('.now()->format('Y-m-d').')'));
        $request->session()->put('oauth_connection_id', $request->query('connection_id'));

        $url = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize?'.http_build_query([
            'client_id' => $clientId,
            'response_type' => 'code',
            'redirect_uri' => $redirectUri,
            'state' => $state,
            'scope' => 'files.readwrite.all offline_access User.Read',
            'response_mode' => 'query',
        ]);

        return redirect($url);
    }

    protected function handleDropboxCallback(Request $request, Provider $provider, string $code)
    {
        $clientId = config('cloud-hub.providers.dropbox.id');
        $clientSecret = config('cloud-hub.providers.dropbox.secret');
        $redirectUri = route('oauth.callback', ['provider' => 'dropbox']);

        $requestClient = Http::asForm();
        if (app()->environment('local')) {
            $requestClient = $requestClient->withoutVerifying();
        }

        $response = $requestClient->post('https://api.dropboxapi.com/oauth2/token', [
            'code' => $code,
            'grant_type' => 'authorization_code',
            'client_id' => $clientId,
            'client_secret' => $clientSecret,
            'redirect_uri' => $redirectUri,
        ]);

        if ($response->failed()) {
            return redirect()->route('home')->withErrors(['oauth' => 'Failed to obtain access token from Dropbox.']);
        }

        $data = $response->json();
        $accessToken = $data['access_token'];
        $refreshToken = $data['refresh_token'] ?? null;

        $quotaTotal = null;
        $quotaUsed = null;

        $spaceRequest = Http::withToken($accessToken);
        if (app()->environment('local')) {
            $spaceRequest = $spaceRequest->withoutVerifying();
        }

        $spaceResponse = $spaceRequest->withBody('null', 'application/json')
            ->post('https://api.dropboxapi.com/2/users/get_space_usage');

        if ($spaceResponse->successful()) {
            $spaceData = $spaceResponse->json();
            $quotaUsed = $spaceData['used'] ?? null;
            if (isset($spaceData['allocation']['allocated'])) {
                $quotaTotal = $spaceData['allocation']['allocated'];
            } elseif (isset($spaceData['allocation']['team']['allocated'])) {
                $quotaTotal = $spaceData['allocation']['team']['allocated'];
            }
        }

        $connectionName = $request->session()->pull('oauth_connection_name', 'Dropbox ('.now()->format('Y-m-d').')');
        $connectionId = $request->session()->pull('oauth_connection_id');

        $updateData = [
            'provider_id' => $provider->id,
            'name' => $connectionName,
            'credentials' => [
                'access_token' => $accessToken,
                'refresh_token' => $refreshToken,
                'expires_at' => isset($data['expires_in']) ? now()->addSeconds($data['expires_in'])->timestamp : null,
            ],
            'quota_total' => $quotaTotal,
            'quota_used' => $quotaUsed,
            'status' => 'active',
        ];

        if ($connectionId) {
            $connection = $request->user()->cloudConnections()->findOrFail($connectionId);
            $connection->update($updateData);
        } else {
            $connection = $request->user()->cloudConnections()->create($updateData);
        }

        activity('cloud_connection')
            ->causedBy($request->user())
            ->performedOn($connection)
            ->withProperties(array_merge(
                DeviceHelper::properties($request),
                [
                    'provider' => $provider->name,
                    'connection_name' => $connection->name,
                ]
            ))
            ->log(($connectionId ? 'Updated' : 'Connected')." cloud storage '{$connection->name}' ({$provider->name})");

        return redirect()->route('home')->with('success', 'Dropbox connected successfully.');
    }

    protected function handleGoogleCallback(Request $request, Provider $provider, string $code)
    {
        $clientId = config('cloud-hub.providers.google.id');
        $clientSecret = config('cloud-hub.providers.google.secret');
        $redirectUri = route('oauth.callback', ['provider' => 'google']);

        $requestClient = Http::asForm();
        if (app()->environment('local')) {
            $requestClient = $requestClient->withoutVerifying();
        }

        $response = $requestClient->post('https://oauth2.googleapis.com/token', [
            'code' => $code,
            'grant_type' => 'authorization_code',
            'client_id' => $clientId,
            'client_secret' => $clientSecret,
            'redirect_uri' => $redirectUri,
        ]);

        if ($response->failed()) {
            Log::error('Google OAuth Token Error: '.$response->body());

            return redirect()->route('home')->withErrors(['oauth' => 'Failed to obtain access token from Google.']);
        }

        $data = $response->json();
        $accessToken = $data['access_token'];
        $refreshToken = $data['refresh_token'] ?? null;

        $quotaTotal = null;
        $quotaUsed = null;

        $spaceRequest = Http::withToken($accessToken);
        if (app()->environment('local')) {
            $spaceRequest = $spaceRequest->withoutVerifying();
        }

        $spaceResponse = $spaceRequest->get('https://www.googleapis.com/drive/v3/about', [
            'fields' => 'storageQuota',
        ]);

        if ($spaceResponse->successful()) {
            $spaceData = $spaceResponse->json();
            if (isset($spaceData['storageQuota'])) {
                $quotaTotal = $spaceData['storageQuota']['limit'] ?? null;
                $quotaUsed = $spaceData['storageQuota']['usage'] ?? null;
            }
        }

        $connectionName = $request->session()->pull('oauth_connection_name', 'Google Drive ('.now()->format('Y-m-d').')');
        $connectionId = $request->session()->pull('oauth_connection_id');

        $updateData = [
            'provider_id' => $provider->id,
            'name' => $connectionName,
            'credentials' => [
                'access_token' => $accessToken,
                'refresh_token' => $refreshToken,
                'expires_at' => isset($data['expires_in']) ? now()->addSeconds($data['expires_in'])->timestamp : null,
            ],
            'quota_total' => $quotaTotal,
            'quota_used' => $quotaUsed,
            'status' => 'active',
        ];

        if ($connectionId) {
            $connection = $request->user()->cloudConnections()->findOrFail($connectionId);
            $connection->update($updateData);
        } else {
            $connection = $request->user()->cloudConnections()->create($updateData);
        }

        activity('cloud_connection')
            ->causedBy($request->user())
            ->performedOn($connection)
            ->withProperties(array_merge(
                DeviceHelper::properties($request),
                [
                    'provider' => $provider->name,
                    'connection_name' => $connection->name,
                ]
            ))
            ->log(($connectionId ? 'Updated' : 'Connected')." cloud storage '{$connection->name}' ({$provider->name})");

        return redirect()->route('home')->with('success', 'Google Drive connected successfully.');
    }

    protected function handleOneDriveCallback(Request $request, Provider $provider, string $code)
    {
        $clientId = config('cloud-hub.providers.onedrive.id');
        $clientSecret = config('cloud-hub.providers.onedrive.secret');
        $redirectUri = route('oauth.callback', ['provider' => 'onedrive']);

        $requestClient = Http::asForm();
        if (app()->environment('local')) {
            $requestClient = $requestClient->withoutVerifying();
        }

        $response = $requestClient->post('https://login.microsoftonline.com/common/oauth2/v2.0/token', [
            'client_id' => $clientId,
            'client_secret' => $clientSecret,
            'code' => $code,
            'redirect_uri' => $redirectUri,
            'grant_type' => 'authorization_code',
        ]);

        if ($response->failed()) {
            Log::error('OneDrive OAuth Token Error: '.$response->body());

            return redirect()->route('home')->withErrors(['oauth' => 'Failed to obtain access token from Microsoft.']);
        }

        $data = $response->json();
        $accessToken = $data['access_token'];
        $refreshToken = $data['refresh_token'] ?? null;

        $quotaTotal = null;
        $quotaUsed = null;

        $driveRequest = Http::withToken($accessToken);
        if (app()->environment('local')) {
            $driveRequest = $driveRequest->withoutVerifying();
        }

        $driveResponse = $driveRequest->get('https://graph.microsoft.com/v1.0/me/drive');

        if ($driveResponse->successful()) {
            $driveData = $driveResponse->json();
            if (isset($driveData['quota'])) {
                $quotaTotal = $driveData['quota']['total'] ?? null;
                $quotaUsed = $driveData['quota']['used'] ?? null;
            }
        }

        $connectionName = $request->session()->pull('oauth_connection_name', 'OneDrive ('.now()->format('Y-m-d').')');
        $connectionId = $request->session()->pull('oauth_connection_id');

        $updateData = [
            'provider_id' => $provider->id,
            'name' => $connectionName,
            'credentials' => [
                'client_id' => $clientId,
                'client_secret' => $clientSecret,
                'refresh_token' => $refreshToken,
                'root' => 'me',
                'access_token' => $accessToken,
                'expires_at' => isset($data['expires_in']) ? now()->addSeconds($data['expires_in'])->timestamp : null,
            ],
            'quota_total' => $quotaTotal,
            'quota_used' => $quotaUsed,
            'status' => 'active',
        ];

        if ($connectionId) {
            $connection = $request->user()->cloudConnections()->findOrFail($connectionId);
            $connection->update($updateData);
        } else {
            $connection = $request->user()->cloudConnections()->create($updateData);
        }

        activity('cloud_connection')
            ->causedBy($request->user())
            ->performedOn($connection)
            ->withProperties(array_merge(
                DeviceHelper::properties($request),
                [
                    'provider' => $provider->name,
                    'connection_name' => $connection->name,
                ]
            ))
            ->log(($connectionId ? 'Updated' : 'Connected')." cloud storage '{$connection->name}' ({$provider->name})");

        return redirect()->route('home')->with('success', 'OneDrive connected successfully.');
    }
}
