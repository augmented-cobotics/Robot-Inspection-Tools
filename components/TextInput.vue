<template>
    <UInput v-bind="$attrs" v-model="model" :placeholder="props.placeholder">
        <template #trailing>
            <span v-if="props.label" class="text-gray-500 text-xs">{{ props.label }}</span>
        </template>
    </UInput>

    <p v-if="$slots.hint" class="m-1">
        <slot name="hint">

        </slot>
    </p>
</template>

<script setup lang="ts">
const model = defineModel<string | number | undefined>()

const props = defineProps<{
    label?: string,
    placeholder?: string
}>()
</script>