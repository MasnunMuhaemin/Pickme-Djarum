<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('areas', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->boolean('is_delivery_area')->default(false);
            $table->timestamps();
        });

        Schema::create('outlets', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->foreignId('area_id')->nullable()->constrained('areas')->nullOnDelete();
            $table->string('status')->default('active');
            $table->timestamps();
        });

        Schema::create('boards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('outlet_id')->unique()->constrained('outlets')->cascadeOnDelete();
            $table->string('code')->unique();
            $table->string('week_label')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
        });

        Schema::create('participants', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('whatsapp')->unique();
            $table->date('birth_date');
            $table->foreignId('area_id')->constrained('areas')->restrictOnDelete();
            $table->string('pin_hash');
            $table->unsignedSmallInteger('caps')->default(0);
            $table->timestamp('registered_at')->nullable();
            $table->timestamps();
            $table->index('caps');
        });

        Schema::create('consents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('participant_id')->constrained('participants')->cascadeOnDelete();
            $table->string('version');
            $table->longText('body');
            $table->boolean('is_required_accepted')->default(false);
            $table->boolean('is_optional_accepted')->default(false);
            $table->timestamp('agreed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('slots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('board_id')->constrained('boards')->cascadeOnDelete();
            $table->string('position');
            $table->string('code', 6)->unique();
            $table->string('prize_type');
            $table->string('status')->default('empty');
            $table->foreignId('holder_id')->nullable()->constrained('participants')->nullOnDelete();
            $table->timestamp('held_until')->nullable();
            $table->timestamp('used_at')->nullable();
            $table->timestamps();
            $table->unique(['board_id', 'position']);
            $table->index(['board_id', 'status']);
        });

        Schema::create('claims', function (Blueprint $table) {
            $table->id();
            $table->foreignId('participant_id')->constrained('participants')->cascadeOnDelete();
            $table->foreignId('outlet_id')->constrained('outlets')->restrictOnDelete();
            $table->foreignId('slot_id')->unique()->constrained('slots')->restrictOnDelete();
            $table->string('code', 6);
            $table->string('flag')->nullable();
            $table->string('status')->default('draft');
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();
            $table->index(['participant_id', 'status']);
            $table->index(['outlet_id', 'status']);
            $table->index('created_at');
        });

        Schema::create('claim_photos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('claim_id')->unique()->constrained('claims')->cascadeOnDelete();
            $table->string('path');
            $table->string('perceptual_hash', 16);
            $table->string('hash_version')->default('dhash-64');
            $table->unsignedTinyInteger('brightness');
            $table->timestamps();
        });

        Schema::create('vouchers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('claim_id')->unique()->constrained('claims')->cascadeOnDelete();
            $table->string('code')->unique();
            $table->string('type');
            $table->string('status')->default('pending');
            $table->string('destination')->nullable();
            $table->unsignedTinyInteger('failed_attempts')->default(0);
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->string('reference')->nullable();
            $table->timestamps();
            $table->index(['status', 'type']);
        });

        Schema::create('gifts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('claim_id')->constrained('claims')->cascadeOnDelete();
            $table->string('type');
            $table->string('status')->default('pending_address');
            $table->string('area')->nullable();
            $table->text('address')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->index(['claim_id', 'status']);
        });

        Schema::create('rejects', function (Blueprint $table) {
            $table->id();
            $table->string('reason');
            $table->foreignId('outlet_id')->nullable()->constrained('outlets')->nullOnDelete();
            $table->json('metadata')->nullable();
            $table->timestamp('occurred_at');
            $table->timestamps();
            $table->index('occurred_at');
        });

        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->string('actor_type');
            $table->unsignedBigInteger('actor_id')->nullable();
            $table->string('action');
            $table->string('subject_type');
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->index(['subject_type', 'subject_id']);
        });

        Schema::create('participant_devices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('participant_id')->nullable()->constrained('participants')->nullOnDelete();
            $table->string('device_id')->unique();
            $table->timestamp('first_seen_at');
            $table->timestamp('last_seen_at');
            $table->string('status')->default('active');
            $table->timestamps();
        });

        Schema::create('device_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('participant_id')->nullable()->constrained('participants')->nullOnDelete();
            $table->string('device_id');
            $table->string('event_type');
            $table->string('ip')->nullable();
            $table->string('risk_flag')->nullable();
            $table->string('reason')->nullable();
            $table->timestamp('occurred_at');
            $table->timestamps();
            $table->index(['device_id', 'occurred_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('device_events');
        Schema::dropIfExists('participant_devices');
        Schema::dropIfExists('activity_logs');
        Schema::dropIfExists('rejects');
        Schema::dropIfExists('gifts');
        Schema::dropIfExists('vouchers');
        Schema::dropIfExists('claim_photos');
        Schema::dropIfExists('claims');
        Schema::dropIfExists('slots');
        Schema::dropIfExists('consents');
        Schema::dropIfExists('participants');
        Schema::dropIfExists('boards');
        Schema::dropIfExists('outlets');
        Schema::dropIfExists('areas');
    }
};
