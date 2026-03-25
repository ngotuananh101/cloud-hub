<?php

use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/home', function () {
        return inertia('home');
    })->name('home');
});
