<?php

use App\Http\Middleware\EnsureAdmin;
use App\Http\Middleware\EnsureParticipant;
use App\Http\Middleware\EnsurePartner;
use App\Http\Middleware\EnsureClaimOpen;
use App\Http\Middleware\EnsureConsent;
use App\Http\Middleware\EnsureStudent;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->web(append: [
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
        $middleware->alias([
            'admin' => EnsureAdmin::class,
            'participant' => EnsureParticipant::class,
            'partner' => EnsurePartner::class,
            'student' => EnsureStudent::class,
            'consented' => EnsureConsent::class,
            'claim-open' => EnsureClaimOpen::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
