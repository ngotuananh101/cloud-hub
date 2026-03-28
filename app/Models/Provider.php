<?php

namespace App\Models;

use Database\Factories\ProviderFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Provider extends Model
{
    /** @use HasFactory<ProviderFactory> */
    use HasFactory;

    /**
     * The "type" of the primary key ID.
     *
     * @var string
     */
    protected $keyType = 'string';

    /**
     * Indicates if the IDs are auto-incrementing.
     *
     * @var bool
     */
    public $incrementing = false;

    protected $fillable = [
        'id',
        'name',
        'icon',
        'driver',
        'config_schema',
        'default_config_schema',
        'is_active',
    ];

    protected $casts = [
        'config_schema' => 'json',
        'default_config_schema' => 'json',
        'is_active' => 'boolean',
    ];

    protected $appends = [
        'icon_url',
    ];

    public function getIconUrlAttribute()
    {
        return asset('assets/cloud-icon/'.$this->icon.'.svg');
    }

    public function cloudConnections()
    {
        return $this->hasMany(CloudConnection::class);
    }
}
