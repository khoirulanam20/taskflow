<?php

namespace Tests\Unit\Settings;

use App\Models\AppConfig;
use App\Support\Settings\IntegrationConfigService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class IntegrationConfigServiceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.google.client_id' => 'env-client-id',
            'services.google.client_secret' => 'env-client-secret',
            'mail.mailers.smtp.host' => 'env-host',
            'ai.provider' => 'openai',
            'ai.api_key' => 'env-ai-key',
        ]);
    }

    public function test_db_values_override_env_when_present(): void
    {
        AppConfig::singleton()->update([
            'google_client_id' => 'db-client-id',
            'google_client_secret' => 'db-client-secret',
            'mail_host' => 'db-host',
            'ai_provider' => 'anthropic',
            'ai_api_key' => 'db-ai-key',
        ]);

        $service = app(IntegrationConfigService::class);
        $service->forgetCache();
        $service->apply();

        $this->assertSame('db-client-id', config('services.google.client_id'));
        $this->assertSame('db-client-secret', config('services.google.client_secret'));
        $this->assertSame('db-host', config('mail.mailers.smtp.host'));
        $this->assertSame('anthropic', config('ai.provider'));
        $this->assertSame('db-ai-key', config('ai.api_key'));
    }

    public function test_env_fallback_when_db_field_is_empty(): void
    {
        AppConfig::singleton()->update([
            'google_client_id' => null,
            'google_client_secret' => null,
            'mail_host' => null,
            'ai_api_key' => null,
        ]);

        $service = app(IntegrationConfigService::class);
        $service->forgetCache();
        Cache::forget('app_config_applied');
        $service->apply();

        $this->assertSame('env-client-id', config('services.google.client_id'));
        $this->assertSame('env-client-secret', config('services.google.client_secret'));
        $this->assertSame('env-host', config('mail.mailers.smtp.host'));
        $this->assertSame('env-ai-key', config('ai.api_key'));
    }

    public function test_google_oauth_enabled_requires_client_id_and_secret(): void
    {
        config([
            'services.google.client_id' => '',
            'services.google.client_secret' => '',
        ]);

        $this->assertFalse(app(IntegrationConfigService::class)->googleOAuthEnabled());

        config([
            'services.google.client_id' => 'id',
            'services.google.client_secret' => 'secret',
        ]);

        $this->assertTrue(app(IntegrationConfigService::class)->googleOAuthEnabled());
    }
}
