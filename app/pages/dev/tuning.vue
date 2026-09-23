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

const robotLabels: Record<RobotId, string> = { robotA: 'Robot A — Coffee pot', robotB: 'Robot B — Glass' }
</script>

<template>
  <div class="flex flex-col gap-6 pb-12">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="font-[family-name:var(--font-display)] text-2xl font-semibold text-slate-50">Fine tuning</h1>
        <p class="text-sm text-slate-400">Precisely adjust the sequence, dosing, vision, and communication. Changes apply immediately.</p>
      </div>
      <button type="button" class="tap-target rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800" @click="resetDefaults">
        <Icon name="lucide:undo-2" class="mr-1.5 inline h-4 w-4" /> Reset to defaults
      </button>
    </div>

    <!-- Robot motion -->
    <section class="rounded-2xl border border-slate-800 bg-slate-850 p-5">
      <h2 class="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
        <Icon name="lucide:bot" class="h-4 w-4" /> Robot motion
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
          label="Speed"
          description="Relative speed of the robot's movements"
          :min="10" :max="100" unit="%"
          @update:model-value="persist"
        />
        <TuningSlider
          v-model="system.params.robots[activeRobot].accelerationPct"
          label="Acceleration"
          description="Relative acceleration of the movements"
          :min="10" :max="100" unit="%"
          @update:model-value="persist"
        />
      </div>

      <div class="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <p class="mb-2 text-sm font-medium text-slate-200">Pickup point offset (mm)</p>
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
          <p class="mb-2 text-sm font-medium text-slate-200">Pour point offset (mm)</p>
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
        <Icon name="lucide:list-ordered" class="h-4 w-4" /> Serving sequence
      </h2>
      <div class="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        <TuningSlider
          v-model="system.params.sequence.weighingTimeS"
          label="Weighing / grab time"
          description="Default mode: Robot A weighing the pot. Stylish mode: both robots grabbing pot + glass."
          :min="0.5" :max="8" :step="0.5" unit="s"
          @update:model-value="persist"
        />
        <TuningSlider
          v-model="system.params.sequence.placingTimeS"
          label="Glass placement time"
          description="Default mode only — Robot B setting the glass on the scale"
          :min="0.5" :max="6" :step="0.5" unit="s"
          @update:model-value="persist"
        />
        <TuningSlider
          v-model="system.params.sequence.deliveryTimeS"
          label="Delivery time"
          description="Robot B serving the glass to the customer"
          :min="0.5" :max="6" :step="0.5" unit="s"
          @update:model-value="persist"
        />
        <TuningSlider
          v-model="system.params.sequence.pourCoffeeDurationS"
          label="Stylish mode pour duration"
          description="Fixed, timed pour used only in Stylish mode (not weighed)"
          :min="2" :max="20" :step="0.5" unit="s"
          @update:model-value="persist"
        />
        <TuningSlider
          v-model="system.params.sequence.pourMilkDurationS"
          label="Milk pour duration" :min="1" :max="10" :step="0.5" unit="s"
          @update:model-value="persist"
        />
        <TuningSlider
          v-model="system.params.sequence.interRobotSafetyDelayS"
          label="Inter-robot safety delay"
          description="Pause enforced between one robot finishing and the other entering the shared zone"
          :min="0" :max="5" :step="0.1" unit="s"
          @update:model-value="persist"
        />
      </div>

      <div class="mt-6">
        <p class="mb-2 text-sm font-medium text-slate-200">Volume label per glass size (ml)</p>
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

    <!-- Dosing (Default mode) -->
    <section class="rounded-2xl border border-slate-800 bg-slate-850 p-5">
      <h2 class="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
        <Icon name="lucide:scale" class="h-4 w-4" /> Scale dosing (Default mode)
      </h2>
      <p class="mb-4 text-xs text-slate-500">Closed-loop pour: Robot A pours until the scale reads the target mass. The pour duration is simulated as target mass ÷ flow rate.</p>

      <div class="mb-6">
        <p class="mb-2 text-sm font-medium text-slate-200">Target mass per glass size (g)</p>
        <div class="grid grid-cols-3 gap-3">
          <div v-for="size in CUP_SIZES" :key="size">
            <label class="mb-1 block text-xs text-slate-500">{{ CUP_SIZE_LABELS[size] }}</label>
            <input
              v-model.number="system.params.dosing.targetMassG[size]"
              type="number" step="5"
              class="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 focus:border-accent-500 focus:outline-none"
              @input="persist"
            >
          </div>
        </div>
      </div>

      <div class="grid gap-6 sm:grid-cols-2">
        <TuningSlider
          v-model="system.params.dosing.flowRateGPerS"
          label="Simulated flow rate" :min="5" :max="80" :step="1" unit="g/s"
          @update:model-value="persist"
        />
        <TuningSlider
          v-model="system.params.dosing.scaleToleranceG"
          label="Scale tolerance" :min="0" :max="20" :step="1" unit="g"
          @update:model-value="persist"
        />
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
          label="Confidence threshold" :min="50" :max="99" unit="%"
          @update:model-value="persist"
        />
        <TuningSlider
          v-model="system.params.vision.detectionTimeoutS"
          label="Detection timeout" :min="1" :max="15" :step="0.5" unit="s"
          @update:model-value="persist"
        />
        <TuningSlider
          v-model="system.params.vision.expectedLuxLevel"
          label="Expected brightness" :min="100" :max="1000" :step="10" unit="lux"
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
        <p class="mb-2 text-sm font-medium text-slate-200">Link mode</p>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="tap-target rounded-lg px-5 py-2 text-sm font-medium transition"
            :class="system.params.communication.mode === 'digital_io' ? 'bg-accent-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'"
            @click="system.params.communication.mode = 'digital_io'; persist()"
          >
            Digital I/O
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
          label="Command timeout" :min="200" :max="10000" :step="100" unit="ms"
          @update:model-value="persist"
        />
        <TuningSlider
          v-model="system.params.communication.retryAttempts"
          label="Retry attempts" :min="0" :max="10" unit="×"
          @update:model-value="persist"
        />
      </div>
    </section>

    <!-- Simulation-only controls -->
    <section class="rounded-2xl border border-dashed border-slate-700 bg-slate-900/60 p-5">
      <h2 class="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
        <Icon name="lucide:flask-conical" class="h-4 w-4" /> Simulation (demo mode only)
      </h2>
      <p class="mb-4 text-xs text-slate-500">These settings only exist on the HMI side, to test the interface before the real Python supervisor is wired up.</p>
      <div class="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        <TuningSlider
          v-model="system.params.simulation.speedMultiplier"
          label="Demo speed" :min="0.25" :max="5" :step="0.25" unit="×"
          @update:model-value="persist"
        />
        <div class="flex items-center justify-between rounded-lg border border-slate-700 px-4 py-3">
          <div>
            <p class="text-sm font-medium text-slate-200">Random faults</p>
            <p class="text-xs text-slate-500">To test recovery</p>
          </div>
          <ToggleSwitch
            v-model="system.params.simulation.randomFaultsEnabled"
            @update:model-value="persist"
          />
        </div>
        <TuningSlider
          v-model="system.params.simulation.randomFaultChancePct"
          label="Fault probability" :min="0" :max="50" unit="%"
          :disabled="!system.params.simulation.randomFaultsEnabled"
          @update:model-value="persist"
        />
      </div>
    </section>
  </div>
</template>
