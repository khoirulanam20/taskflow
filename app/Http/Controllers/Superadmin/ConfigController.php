<?php

namespace App\Http\Controllers\Superadmin;

use App\Http\Controllers\Controller;
use App\Models\AppConfig;
use App\Support\Modules\FormModuleAccess;
use App\Support\Settings\IntegrationConfigService;
use Illuminate\Http\RedirectResponse;
use App\Http\Requests\Superadmin\UpdateConfigRequest;
use Inertia\Inertia;
use Inertia\Response;

class ConfigController extends Controller
{
    public function __construct(
        private readonly FormModuleAccess $formAccess,
        private readonly IntegrationConfigService $integrationConfig,
    ) {
    }

    public function index(): Response
    {
        $user = auth()->user();
        $config = AppConfig::query()->first();

        return Inertia::render('Admin/Config/Index', [
            'config' => $this->integrationConfig->toFrontendArray($config),
            'aiProviders' => [
                ['value' => 'openai', 'label' => 'OpenAI'],
                ['value' => 'anthropic', 'label' => 'Anthropic'],
                ['value' => 'custom', 'label' => 'Custom'],
            ],
            'canSave' => $this->formAccess->canSave('config', $user),
        ]);
    }

    public function update(UpdateConfigRequest $request): RedirectResponse
    {
        $payload = $request->validated();

        $config = AppConfig::singleton();

        $data = [
            'google_client_id' => ($payload['google_client_id'] ?? null) ?: null,
            'google_redirect_uri' => ($payload['google_redirect_uri'] ?? null) ?: null,
            'mail_mailer' => ($payload['mail_mailer'] ?? null) ?: 'smtp',
            'mail_host' => ($payload['mail_host'] ?? null) ?: null,
            'mail_port' => $payload['mail_port'] ?? null,
            'mail_username' => ($payload['mail_username'] ?? null) ?: null,
            'mail_encryption' => ($payload['mail_encryption'] ?? null) ?: null,
            'mail_from_address' => ($payload['mail_from_address'] ?? null) ?: null,
            'mail_from_name' => ($payload['mail_from_name'] ?? null) ?: null,
            'ai_provider' => ($payload['ai_provider'] ?? null) ?: null,
            'ai_base_url' => ($payload['ai_base_url'] ?? null) ?: null,
            'ai_model' => ($payload['ai_model'] ?? null) ?: null,
        ];

        if (filled($payload['google_client_secret'] ?? null)) {
            $data['google_client_secret'] = $payload['google_client_secret'];
        }

        if (filled($payload['mail_password'] ?? null)) {
            $data['mail_password'] = $payload['mail_password'];
        }

        if (filled($payload['ai_api_key'] ?? null)) {
            $data['ai_api_key'] = $payload['ai_api_key'];
        }

        $config->fill($data);
        $config->save();

        $this->integrationConfig->forgetCache();
        $this->integrationConfig->apply();

        return back()->with('status', 'config-updated');
    }
}
