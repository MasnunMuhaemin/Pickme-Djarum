<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(CustomerSeeder::class);
        $this->call(DemoParticipantSeeder::class);
        $this->call(DemoLeaderboardSeeder::class);
        $this->call(AdminSeeder::class);
        // Setelah AdminSeeder: butuh jenis voucher Kopi dan Kuota internet.
        $this->call(DemoPartnerSeeder::class);
        $this->call(MysteryPrizeSeeder::class);
    }
}
