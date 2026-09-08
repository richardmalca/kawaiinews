<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        collect(['superadmin', 'admin', 'editor'])->each(
            fn (string $role) => Role::firstOrCreate(['name' => $role])
        );
    }
}
