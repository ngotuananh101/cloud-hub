<?php

use App\Http\Controllers\ActivityController;
use App\Http\Controllers\CloudConnectionController;
use App\Http\Controllers\OAuthController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\TelegramController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/home', function () {
        return inertia('home');
    })->name('home');

    Route::get('/settings/account', [ProfileController::class, 'edit'])->name('settings.account');
    Route::patch('/settings/profile', [ProfileController::class, 'updateProfile'])->name('settings.profile');
    Route::put('/settings/password', [ProfileController::class, 'updatePassword'])->name('settings.password');

    Route::get('/api/activities', [ActivityController::class, 'index'])->name('api.activities');

    Route::post('/cloud-connections', [CloudConnectionController::class, 'store'])->name('cloud-connections.store');
    Route::patch('/cloud-connections/{cloudConnection}', [CloudConnectionController::class, 'update'])->name('cloud-connections.update');
    Route::delete('/cloud-connections/{cloudConnection}', [CloudConnectionController::class, 'destroy'])->name('cloud-connections.destroy');

    // OAuth & Telegram Auth Routes
    Route::get('/oauth/{provider}/redirect', [OAuthController::class, 'redirect'])->name('oauth.redirect');
    Route::get('/oauth/{provider}/callback', [OAuthController::class, 'callback'])->name('oauth.callback');

    Route::post('/telegram/request-code', [TelegramController::class, 'requestCode'])->name('telegram.request-code');
    Route::post('/telegram/login', [TelegramController::class, 'login'])->name('telegram.login');
});
