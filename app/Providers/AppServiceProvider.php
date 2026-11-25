<?php

namespace App\Providers;

use App\Support\ProgramParameters;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Parameter program yang diubah admin di A7 Pengaturan menimpa config/participant.php.
        ProgramParameters::apply();
    }
}
