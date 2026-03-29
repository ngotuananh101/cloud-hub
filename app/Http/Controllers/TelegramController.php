<?php

namespace App\Http\Controllers;

use App\Helpers\DeviceHelper;
use App\Models\CloudConnection;
use App\Models\Provider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TelegramController extends Controller
{
    protected string $baseUrl;
    protected string $token;

    public function __construct()
    {
        $this->baseUrl = rtrim(config('cloud-hub.providers.telegram.base_url'), '/');
        $this->token = config('cloud-hub.providers.telegram.token');
    }

    /**
     * Get the session ID for the current user.
     */
    protected function getSessionId(): string
    {
        return 'user_' . Auth::id();
    }

    /**
     * Step 1: Request a code from Telegram.
     */
    public function requestCode(Request $request)
    {
        $request->validate([
            'phone' => 'required|string',
        ]);

        try {
            $response = Http::withHeaders([
                'X-Token' => $this->token,
                'X-Session-ID' => $this->getSessionId(),
            ])->post("{$this->baseUrl}/request-code", [
                'phone' => $request->phone,
            ]);

            if ($response->failed()) {
                Log::error('Telegram Request Code Error: ' . $response->body());
                return response()->json([
                    'message' => $response->json('detail', 'Failed to request code from Telegram.'),
                ], $response->status());
            }

            return response()->json($response->json());
        } catch (\Exception $e) {
            Log::error('Telegram Request Code Exception: ' . $e->getMessage());
            return response()->json(['message' => 'Connection to Telegram microservice failed.'], 500);
        }
    }

    /**
     * Step 2: Login and create the connection.
     */
    public function login(Request $request)
    {
        $request->validate([
            'phone' => 'required|string',
            'code' => 'required|string',
            'password' => 'nullable|string',
            'name' => 'required|string|max:255',
        ]);

        $sessionId = $this->getSessionId();

        try {
            $response = Http::withHeaders([
                'X-Token' => $this->token,
                'X-Session-ID' => $sessionId,
            ])->post("{$this->baseUrl}/login", [
                'phone' => $request->phone,
                'code' => $request->code,
                'password' => $request->password,
            ]);

            $result = $response->json();

            if ($response->failed() || !($result['success'] ?? false)) {
                return response()->json([
                    'message' => $result['message'] ?? 'Login failed. Please check your code.',
                    'detail' => $result['detail'] ?? '',
                ], 422);
            }

            // Authentication successful, create/update cloud connection
            $provider = Provider::where('id', 'telegram')->firstOrFail();

            $connection = CloudConnection::updateOrCreate(
                [
                    'user_id' => Auth::id(),
                    'provider_id' => 'telegram',
                    'name' => $request->name,
                ],
                [
                    'credentials' => [
                        'session_id' => $sessionId,
                    ],
                    'status' => 'active',
                ]
            );

            // Trigger activity log
            activity('cloud_connection')
                ->causedBy(Auth::user())
                ->performedOn($connection)
                ->withProperties(array_merge(
                    DeviceHelper::properties($request),
                    [
                        'provider' => 'Telegram',
                        'connection_name' => $connection->name,
                    ]
                ))
                ->log("Connected Telegram storage '{$connection->name}'");

            return response()->json([
                'success' => true,
                'message' => 'Telegram connected successfully!',
            ]);
        } catch (\Exception $e) {
            Log::error('Telegram Login Exception: ' . $e->getMessage());
            return response()->json(['message' => 'An error occurred during Telegram login.'], 500);
        }
    }
}
