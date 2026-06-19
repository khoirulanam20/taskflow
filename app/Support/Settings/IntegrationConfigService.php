<?php

namespace App\Support\Settings;

use App\Models\AppConfig;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;

class IntegrationConfigService
{
    private const CACHE_KEY = 'app_config_applied';

    public function apply(): void
    {
        if (! $this->tableExists()) {
            return;
        }

        if (Cache::get(self::CACHE_KEY) === true) {
            return;
        }

        $config = AppConfig::query()->first();

        if (! $config) {
            Cache::forever(self::CACHE_KEY, true);

            return;
        }

        $this->applyGoogle($config);
        $this->applyMail($config);
        $this->applyAi($config);

        Cache::forever(self::CACHE_KEY, true);
    }

    public function forgetCache(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    public function googleOAuthEnabled(): bool
    {
        $clientId = config('services.google.client_id');
        $clientSecret = config('services.google.client_secret');

        return filled($clientId) && filled($clientSecret);
    }

    /**
     * @return array<string, mixed>
     */
    public function toFrontendArray(?AppConfig $config): array
    {
        return [
            'google_client_id' => $config?->google_client_id ?? '',
            'google_redirect_uri' => $config?->google_redirect_uri ?? '',
            'has_google_client_secret' => filled($config?->google_client_secret),
            'mail_mailer' => $config?->mail_mailer ?? 'smtp',
            'mail_host' => $config?->mail_host ?? '',
            'mail_port' => $config?->mail_port ?? '',
            'mail_username' => $config?->mail_username ?? '',
            'mail_encryption' => $config?->mail_encryption ?? '',
            'mail_from_address' => $config?->mail_from_address ?? '',
            'mail_from_name' => $config?->mail_from_name ?? '',
            'has_mail_password' => filled($config?->mail_password),
            'ai_provider' => $config?->ai_provider ?? '',
            'ai_base_url' => $config?->ai_base_url ?? '',
            'ai_model' => $config?->ai_model ?? '',
            'has_ai_api_key' => filled($config?->ai_api_key),
        ];
    }

    private function applyGoogle(AppConfig $config): void
    {
        config([
            'services.google.client_id' => $config->google_client_id ?: config('services.google.client_id'),
            'services.google.client_secret' => $config->google_client_secret ?: config('services.google.client_secret'),
            'services.google.redirect' => $config->google_redirect_uri ?: config('services.google.redirect'),
        ]);
    }

    private function applyMail(AppConfig $config): void
    {
        $mailer = $config->mail_mailer ?: config('mail.default', 'smtp');

        config([
            'mail.default' => $mailer,
            'mail.mailers.smtp.host' => $config->mail_host ?: config('mail.mailers.smtp.host'),
            'mail.mailers.smtp.port' => $config->mail_port ?: config('mail.mailers.smtp.port'),
            'mail.mailers.smtp.username' => $config->mail_username ?: config('mail.mailers.smtp.username'),
            'mail.mailers.smtp.password' => $config->mail_password ?: config('mail.mailers.smtp.password'),
            'mail.mailers.smtp.encryption' => $config->mail_encryption ?: config('mail.mailers.smtp.encryption'),
            'mail.from.address' => $config->mail_from_address ?: config('mail.from.address'),
            'mail.from.name' => $config->mail_from_name ?: config('mail.from.name'),
        ]);
    }

    private function applyAi(AppConfig $config): void
    {
        config([
            'ai.provider' => $config->ai_provider ?: config('ai.provider'),
            'ai.api_key' => $config->ai_api_key ?: config('ai.api_key'),
            'ai.base_url' => $config->ai_base_url ?: config('ai.base_url'),
            'ai.model' => $config->ai_model ?: config('ai.model'),
        ]);
    }

    private function tableExists(): bool
    {
        try {
            return Schema::hasTable('app_configs');
        } catch (\Throwable) {
            return false;
        }
    }
}
