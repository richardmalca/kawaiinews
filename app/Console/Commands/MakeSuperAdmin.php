<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class MakeSuperAdmin extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'user:make-superadmin {email : Correo del usuario a convertir en superadmin}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Asigna el rol de superadmin a un usuario existente por su correo electrónico';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $email = $this->argument('email');

        $user = User::where('email', $email)->first();

        if (! $user) {
            $this->error("No se encontró ningún usuario con el correo [{$email}].");

            return self::FAILURE;
        }

        $user->syncRoles(['superadmin']);

        $this->info("El usuario [{$user->email}] ahora es superadmin.");

        return self::SUCCESS;
    }
}
