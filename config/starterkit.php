<?php

return [
    'admin_prefix' => env('ADMIN_ROUTE_PREFIX', 'app'),
    'admin_route_name' => env('ADMIN_ROUTE_NAME', 'app'),
    'admin_menu_domain' => env('ADMIN_MENU_DOMAIN', 'app'),

    /*
    |--------------------------------------------------------------------------
    | Registrasi publik
    |--------------------------------------------------------------------------
    | Set false di production agar hanya admin yang membuat akun.
    */
    'registration_enabled' => env('REGISTRATION_ENABLED', true),

    /*
    |--------------------------------------------------------------------------
    | Impersonation timeout (menit, 0 = tanpa batas)
    |--------------------------------------------------------------------------
    */
    'impersonation_timeout_minutes' => (int) env('IMPERSONATION_TIMEOUT_MINUTES', 0),

    /*
    |--------------------------------------------------------------------------
    | Two-factor authentication (TOTP)
    |--------------------------------------------------------------------------
    */
    'two_factor_enabled' => env('TWO_FACTOR_ENABLED', false),

    /*
    |--------------------------------------------------------------------------
    | Konvensi kode modul (validasi saat create/update modul)
    |--------------------------------------------------------------------------
    */
    'module_conventions' => [
        'deprecated_codes' => [],
        'routes' => [],
    ],
];
