<template>
    <div class="flex items-center">
        <label class="flex flex-col items-center w-full px-4 py-6 border-2 border-dashed rounded-lg cursor-pointer"
            :class="`border-${color}-300  bg-${color}-50`">

            <p class="mb-2 text-sm" :class="`text-${color}-500 dark:text-${color}-400`">
                <slot></slot>
            </p>

            <p v-if="description" class="text-xs" :class="`text-${color}-500 dark:text-${color}-400`">{{ description }}</p>

            <input type="file" class="hidden" v-bind="$attrs" @change="emit('change', $event)" />
        </label>
    </div>
</template>

<script setup lang="ts">
const { description, color = 'gray' } = defineProps<{
    description?: string
    color?: string
}>()

const emit = defineEmits(['change'])
</script>