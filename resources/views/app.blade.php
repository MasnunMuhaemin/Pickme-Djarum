<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-title" content="PICKME">
        <meta name="apple-mobile-web-app-status-bar-style" content="default">
        <link rel="manifest" href="/manifest.webmanifest">

        <title inertia>{{ config('app.name', 'PICKME') }}</title>
        <meta name="description" content="Beli bungkus, foto, ambil slot. Hadiah langsung dari warung.">
        <meta name="theme-color" content="#8fc31f">

        {{-- Favicon dari logo Papan Pick(me). --}}
        <link rel="icon" href="/favicon.ico" sizes="48x48">
        <link rel="icon" href="/favicon.png" type="image/png" sizes="512x512">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600|permanent-marker:400" rel="stylesheet" />

        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
