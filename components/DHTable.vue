<template>
  <UContainer>
    <div class="flex flex-col">
      <UTable :columns="columns" :rows="model" @contextmenu.stop="contextmenu" :ui="{
        th: {
          padding: 'px-2 py-2'
        },
        td: {
          padding: 'px-2 py-2'
        }
      }">
        <template #name-data="{ row, index }">
          <UInput :model-value="row.name" @update:model-value="updateJoint(index, $event, row.theta, row.a, row.d, row.alpha)"  variant="none"></UInput>
        </template>
        <template #theta-data="{ row, index }">
          <UInput :model-value="row.theta" @update:model-value="updateJoint(index, row.name, $event, row.a, row.d, row.alpha)" variant="none" type="number"></UInput>
        </template>
        <template #a-data="{ row, index }">
          <UInput :model-value="row.a" @update:model-value="updateJoint(index, row.name, row.theta, $event, row.d, row.alpha)" variant="none" type="number"></UInput>
        </template>
        <template #d-data="{ row, index }">
          <UInput :model-value="row.d" @update:model-value="updateJoint(index, row.name, row.theta, row.a, $event, row.alpha)" variant="none" type="number"></UInput>
        </template>
        <template #alpha-data="{ row, index }">
          <UInput :model-value="row.alpha" @update:model-value="updateJoint(index, row.name, row.theta, row.a, row.d, $event)" variant="none" type="number"></UInput>
        </template>
      </UTable>

      <UContextMenu :virtual-element="virtualElement" :model-value="!!contextMenuRow"
        @update:model-value="contextMenuRow = null">
        <UButton color="red" variant="ghost" class="p-2" @click="deleteJoint">
          Delete
        </UButton>
      </UContextMenu>

      <UButton class="self-end" @click="createJoint">Add Joint</UButton>
    </div>
  </UContainer>
</template>

<script setup lang="ts">
import { theme } from '#tailwind-config';
import type { JointParameters } from '@/types/robot.ts';
import { mode } from 'mathjs';

const model = defineModel<JointParameters[]>()

watch(model, (newModel, oldModel) => {
  console.log('changed ')
})

const columns = [{
  key: 'name',
  label: 'Name'
}, {
  key: 'theta',
  label: 'Theta (Rad)'
}, {
  key: 'a',
  label: 'a (m)'
}, {
  key: 'd',
  label: 'd (m)'
}, {
  key: 'alpha',
  label: 'alpha (rad)'
}]

function getJoint(name: string) {
  return model.value!.find(v => v.name == name)
}

function updateJoint(index: number, name: string, theta: number, a: number, d: number, alpha: number) {
  let values = [...model.value!]

  values[index].name = name
  values[index].theta = theta
  values[index].a = a
  values[index].d = d
  values[index].alpha = alpha

  model.value = values
}

function createJoint() {
  let value = 1
  while (!!getJoint(`joint_${value}`)) {
    value++;
  }

  let emptyJoint = {
    name: `joint_${value}`,
    theta: 0,
    a: 0,
    d: 0,
    alpha: 0
  };

  model.value = [
    ...model.value!,
    emptyJoint
  ]
}

const virtualElement = ref({ getBoundingClientRect: () => ({}) })
const contextMenuRow = ref()

function contextmenu(event: MouseEvent, row: any) {
  // Prevent the default context menu
  event.preventDefault()

  virtualElement.value.getBoundingClientRect = () => ({
    width: 0,
    height: 0,
    top: event.clientY,
    left: event.clientX
  })

  contextMenuRow.value = row
}

function deleteJoint() {
  let joints = [...model.value!.filter(v => v.name != contextMenuRow.value.name)]
  model.value = joints

  contextMenuRow.value = null
}
</script>