<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'
import { CUP_SIZES, CUP_SIZE_LABELS, ROBOT_IDS, type RobotId } from '~/types'

definePageMeta({ layout: 'dev' })

const system = useSystemStore()
const activeRobot = ref<RobotId>('robotA')

const persist = useDebounceFn(() => system.applyParamsChange(), 250)

function resetDefaults() {
  system.resetParamsToDefault()
}

const robotLabels: Record<RobotId, string> = { robotA: 'Robot A — Tasse', robotB: 'Robot B — Café / Lait' }
</script>

<template>
  <div class="flex flex-col gap-6 pb-12">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="font-[family-name:var(--font-display)] text-2xl font-semibold text-slate-50">Réglages fins</h1>
        <p class="text-sm text-slate-400">Ajustez précisément la séquence, la vision et la communication. Les changements sont appliqués immédiatement.</p>
      </div>
      <button type="button" class="tap-target rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800" @click="resetDefaults">
        <Icon name="lucide:undo-2" class="mr-1.5 inline h-4 w-4" /> Valeurs par défaut
      </button>
    </div>

    <!-- Robot motion -->
    <section class="rounded-2xl border border-slate-800 bg-slate-850 p-5">
      <h2 class="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
        <Icon name="lucide:bot" class="h-4 w-4" /> Mouvements robot
      </h2>

      <div class="mb-4 flex gap-2">
        <button
          v-for="id in ROBOT_IDS"
          :key="id"
          type="button"
          class="tap-target rounded-lg px-4 py-2 text-sm font-medium transition"
          :class="activeRobot === id ? 'bg-accent-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'"
          @click="activeRobot = id"
        >
          {{ robotLabels[id] }}
        </button>
      </div>

      <div class="grid gap-6 sm:grid-cols-2">
        <TuningSlider
          v-model="system.params.robots[activeRobot].speedPct"
          label="Vitesse"
          description="Vitesse relative des mouvements du robot"
          :min="10" :max="100" unit="%"
          @update:model-value="persist"
        />
        <TuningSlider
          v-model="system.params.robots[activeRobot].accelerationPct"
          label="Accélération"
          description="Accélération relative des mouvements"
          :min="10" :max="100" unit="%"
          @update:model-value="persist"
        />
      </div>

      <div class="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <p class="mb-2 text-sm font-medium text-slate-200">Décalage point de préhension (mm)</p>
          <div class="grid grid-cols-3 gap-2">
            <div v-for="axis in (['x', 'y', 'z'] as const)" :key="axis">
              <label class="mb-1 block text-xs uppercase text-slate-500">{{ axis }}</label>
              <input
                v-model.number="system.params.robots[activeRobot].pickupOffsetMm[axis]"
                type="number" step="0.5"
                class="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 focus:border-accent-500 focus:outline-none"
                @input="persist"
              >
            </div>
          </div>
        </div>
        <div>
          <p class="mb-2 text-sm font-medium text-slate-200">Décalage point de versement (mm)</p>
          <div class="grid grid-cols-3 gap-2">
            <div v-for="axis in (['x', 'y', 'z'] as const)" :key="axis">
              <label class="mb-1 block text-xs uppercase text-slate-500">{{ axis }}</label>
              <input
                v-model.number="system.params.robots[activeRobot].pourOffsetMm[axis]"
                type="number" step="0.5"
                class="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 focus:border-accent-500 focus:outline-none"
                @input="persist"
              >
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Sequence -->
    <section class="rounded-2xl border border-slate-800 bg-slate-850 p-5">
      <h2 class="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
        <Icon name="lucide:list-ordered" class="h-4 w-4" /> Séquence de service
      </h2>
      <div class="grid gap-6 sm:grid-cols-2">
        <TuningSlider
          v-model="system.params.sequence.pourCoffeeDurationS"
          label="Durée de versement du café" :min="2" :max="20" :step="0.5" unit="s"
          @update:model-value="persist"
        />
        <TuningSlider
          v-model="system.params.sequence.pourMilkDurationS"
          label="Durée de versement du lait" :min="1" :max="10" :step="0.5" unit="s"
          @update:model-value="persist"
        />
        <TuningSlider
          v-model="system.params.sequence.interRobotSafetyDelayS"
          label="Délai de sécurité inter-robots"
          description="Pause imposée entre la fin d'une opération d'un robot et le début de l'autre dans la zone partagée"
          :min="0" :max="5" :step="0.1" unit="s"
          @update:model-value="persist"
        />
      </div>

      <div class="mt-6">
        <p class="mb-2 text-sm font-medium text-slate-200">Volume par taille de tasse (ml)</p>
        <div class="grid grid-cols-3 gap-3">
          <div v-for="size in CUP_SIZES" :key="size">
            <label class="mb-1 block text-xs text-slate-500">{{ CUP_SIZE_LABELS[size] }}</label>
            <input
              v-model.number="system.params.sequence.cupVolumeMl[size]"
              type="number" step="10"
              class="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 focus:border-accent-500 focus:outline-none"
              @input="persist"
            >
          </div>
        </div>
      </div>
    </section>

    <!-- Vision -->
    <section class="rounded-2xl border border-slate-800 bg-slate-850 p-5">
      <h2 class="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
        <Icon name="lucide:scan-eye" class="h-4 w-4" /> Vision
      </h2>
      <div class="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        <TuningSlider
          v-model="system.params.vision.detectionConfidencePct"
          label="Seuil de confiance" :min="50" :max="99" unit="%"
          @update:model-value="persist"
        />
        <TuningSlider
          v-model="system.params.vision.detectionTimeoutS"
          label="Timeout de détection" :min="1" :max="15" :step="0.5" unit="s"
          @update:model-value="persist"
        />
        <TuningSlider
          v-model="system.params.vision.expectedLuxLevel"
          label="Luminosité attendue" :min="100" :max="1000" :step="10" unit="lux"
          @update:model-value="persist"
        />
      </div>
    </section>

    <!-- Communication -->
    <section class="rounded-2xl border border-slate-800 bg-slate-850 p-5">
      <h2 class="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
        <Icon name="lucide:cable" class="h-4 w-4" /> Communication
      </h2>
      <div class="mb-6">
        <p class="mb-2 text-sm font-medium text-slate-200">Mode de liaison</p>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="tap-target rounded-lg px-5 py-2 text-sm font-medium transition"
            :class="system.params.communication.mode === 'digital_io' ? 'bg-accent-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'"
            @click="system.params.communication.mode = 'digital_io'; persist()"
          >
            E/S numériques
          </button>
          <button
            type="button"
            class="tap-target rounded-lg px-5 py-2 text-sm font-medium transition"
            :class="system.params.communication.mode === 'ethernet' ? 'bg-accent-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'"
            @click="system.params.communication.mode = 'ethernet'; persist()"
          >
            Ethernet
          </button>
        </div>
      </div>
      <div class="grid gap-6 sm:grid-cols-2">
        <TuningSlider
          v-model="system.params.communication.commandTimeoutMs"
          label="Timeout commande" :min="200" :max="10000" :step="100" unit="ms"
          @update:model-value="persist"
        />
        <TuningSlider
          v-model="system.params.communication.retryAttempts"
          label="Tentatives de réémission" :min="0" :max="10" unit="×"
          @update:model-value="persist"
        />
      </div>
    </section>

    <!-- Simulation-only controls -->
    <section class="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-5">
      <h2 class="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
        <Icon name="lucide:flask-conical" class="h-4 w-4" /> Simulation (mode démo uniquement)
      </h2>
      <p class="mb-4 text-xs text-slate-500">Ces réglages n'existent que côté HMI pour tester l'interface avant que le superviseur Python réel ne soit branché.</p>
      <div class="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        <TuningSlider
          v-model="system.params.simulation.speedMultiplier"
          label="Vitesse de démo" :min="0.25" :max="5" :step="0.25" unit="×"
          @update:model-value="persist"
        />
        <div class="flex items-center justify-between rounded-lg border border-slate-700 px-4 py-3">
          <div>
            <p class="text-sm font-medium text-slate-200">Pannes aléatoires</p>
            <p class="text-xs text-slate-500">Pour tester la récupération</p>
          </div>
          <ToggleSwitch
            v-model="system.params.simulation.randomFaultsEnabled"
            @update:model-value="persist"
          />
        </div>
        <TuningSlider
          v-model="system.params.simulation.randomFaultChancePct"
          label="Probabilité de panne" :min="0" :max="50" unit="%"
          :disabled="!system.params.simulation.randomFaultsEnabled"
          @update:model-value="persist"
        />
      </div>
    </section>
  </div>
</template>
