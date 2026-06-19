<?php

namespace App\Models;

use App\Models\Concerns\LogsModelActivity;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\LogOptions;

class AppConfig extends Model
{
    use LogsModelActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return $this->baseActivitylogOptions()
            ->logExcept(['google_client_secret', 'mail_password', 'ai_api_key']);
    }

    public const AI_PROVIDERS = ['openai', 'anthropic', 'custom'];

    protected $fillable = [
        'google_client_id',
        'google_client_secret',
        'google_redirect_uri',
        'mail_mailer',
        'mail_host',
        'mail_port',
        'mail_username',
        'mail_password',
        'mail_encryption',
        'mail_from_address',
        'mail_from_name',
        'ai_provider',
        'ai_api_key',
        'ai_base_url',
        'ai_model',
    ];

    protected function casts(): array
    {
        return [
            'google_client_secret' => 'encrypted',
            'mail_password' => 'encrypted',
            'ai_api_key' => 'encrypted',
            'mail_port' => 'integer',
        ];
    }

    public static function singleton(): self
    {
        return static::query()->firstOrCreate(['id' => 1]);
    }
}
