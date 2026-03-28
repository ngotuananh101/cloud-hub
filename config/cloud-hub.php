<?php

return [
    'providers' => [
        'dropbox' => [
            'id' => env('DROPBOX_ID'),
            'secret' => env('DROPBOX_SECRET'),
        ],
        'google' => [
            'id' => env('GOOGLE_ID'),
            'secret' => env('GOOGLE_SECRET'),
        ],
        'onedrive' => [
            'id' => env('ONEDRIVE_ID'),
            'secret' => env('ONEDRIVE_SECRET'),
        ],
        'telegram' => [
            'base_url' => env('TELEGRAM_BASE_URL'),
            'token' => env('TELEGRAM_TOKEN'),
        ],
    ],
];
