<?php

namespace Database\Factories;

use App\Models\CloudConnection;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CloudConnection>
 */
class CloudConnectionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => \App\Models\User::factory(),
            'provider_id' => 'google', // Default to google or a random one from DB
            'name' => $this->faker->name() . "'s Drive",
            'credentials' => ['access_token' => 'eye...'],
            'settings' => [],
            'status' => 'active',
            'quota_total' => 15 * 1024 * 1024 * 1024, // 15GB
            'quota_used' => $this->faker->numberBetween(0, 15) * 1024 * 1024 * 1024,
        ];
    }
}
