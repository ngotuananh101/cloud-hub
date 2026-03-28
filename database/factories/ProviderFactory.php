<?php

namespace Database\Factories;

use App\Models\Provider;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Provider>
 */
class ProviderFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'id' => $this->faker->unique()->slug(1),
            'name' => $this->faker->company(),
            'icon' => 'brand-google',
            'driver' => 'google',
            'config_schema' => [],
            'default_config_schema' => [],
            'is_active' => true,
        ];
    }
}
