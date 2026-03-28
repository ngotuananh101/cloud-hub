<?php

use App\Http\Controllers\Settings\ProfileController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/home', function () {
        return inertia('home');
    })->name('home');

    Route::get('/settings/account', [ProfileController::class, 'edit'])->name('settings.account');
    Route::patch('/settings/profile', [ProfileController::class, 'updateProfile'])->name('settings.profile');
    Route::put('/settings/password', [ProfileController::class, 'updatePassword'])->name('settings.password');
 
    Route::get('/api/activities', [\App\Http\Controllers\ActivityController::class, 'index'])->name('api.activities');

    Route::post('/cloud-connections', [\App\Http\Controllers\CloudConnectionController::class, 'store'])->name('cloud-connections.store');
    Route::delete('/cloud-connections/{cloudConnection}', [\App\Http\Controllers\CloudConnectionController::class, 'destroy'])->name('cloud-connections.destroy');
});
