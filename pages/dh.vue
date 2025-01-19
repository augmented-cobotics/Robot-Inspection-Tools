<template>
  <div class="h-full">
    <div class="flex h-full">
      <div style="width: 1000px" class="flex flex-col">
        <UCard class="m-4">
          <template #header>
            <h1 class="font-bold">DH Parameters</h1>
          </template>

          <DHTable v-model="items" />
        </UCard>

        <UCard class="m-4">
          <template #header>
            <div class="flex">
              <h1 class="font-bold">Transform Inspection</h1>
              <USelect class="ml-auto" v-model="inspectEndItem" :options="itemsNames"></USelect>
            </div>
          </template>

          <div class="flex gap-12 justify-between">
            <div>
              <p class="font-bold">Transform</p>
              <div class="grid grid-rows-4 grid-flow-col gap-4 mt-2">
                <span v-for="i in 16">{{ inspectEndTransform.elements[i - 1].toFixed(4) }}</span>
              </div>
            </div>
            <div>
              <p class="font-bold">Position</p>
              <div class="grid grid-cols-3 gap-4 mt-2">
                <span>{{ inspectEndPosition.x.toFixed(4) }}</span>
                <span>{{ inspectEndPosition.y.toFixed(4) }}</span>
                <span>{{ inspectEndPosition.z.toFixed(4) }}</span>
              </div>
            </div>
            <div>
              <p class="font-bold">Quaternion</p>
              <div class="grid grid-cols-4 gap-4 mt-2">
                <span>{{ inspectEndQuaternion.x.toFixed(4) }}</span>
                <span>{{ inspectEndQuaternion.y.toFixed(4) }}</span>
                <span>{{ inspectEndQuaternion.z.toFixed(4) }}</span>
                <span>{{ inspectEndQuaternion.w.toFixed(4) }}</span>
              </div>
            </div>
          </div>
        </UCard>
      </div>
      <div id="myChart" class="flex-1 h-full">

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { JointParameters } from '@/types/robot';
import { useUrlSearchParams } from '@vueuse/core'
import { i } from 'mathjs';

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { compute } from 'three/tsl';

/*

*/

THREE.Object3D.DEFAULT_UP = new THREE.Vector3(0, 0, 1);

const items = ref<JointParameters[]>([])
const params = useUrlSearchParams('hash')

const itemsNames = computed(() => items.value.map(i => i.name))

onMounted(() => {
  if (!params.parameters) {
    return
  }

  let base64 = params.parameters as string
  let json = atob(base64)
  let data = JSON.parse(json)

  items.value = data
})

watch(items, (newItems, oldItems) => {
  let json = JSON.stringify(newItems)
  let base64 = btoa(json)

  params.parameters = base64
})

/*

*/

const inspectEndItem = ref<string | undefined>()

const inspectEndTransform = computed(() => {
  let transform = new THREE.Matrix4()

  for (let i = 0; i < items.value.length; i++) {
    let item = items.value[i]

    const dh = dhToMatrix(item.d, item.theta, item.a, item.alpha)

    transform = transform.multiply(dh)

    if (item.name == inspectEndItem.value) {
      break;
    }
  }

  return transform
})

const inspectEndPosition = computed(() => new THREE.Vector3().setFromMatrixPosition(inspectEndTransform.value))
const inspectEndQuaternion = computed(() => new THREE.Quaternion().setFromRotationMatrix(inspectEndTransform.value))

/*

*/

watch([items, inspectEndItem], () => {
  const element = document.getElementById("myChart")
  if (!element) {
    console.error("No element")
    return
  }

  const canvasWidth = element.clientWidth;
  const canvasHeight = element.clientHeight;

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
  renderer.setSize(canvasWidth, canvasHeight);

  element.innerHTML = ''
  element.appendChild(renderer.domElement);

  const camera = new THREE.PerspectiveCamera(45, canvasWidth / canvasHeight, 0.1, 10000);
  camera.position.set(1, 1, 1);

  const ambientLight = new THREE.AmbientLight(0x7c7c7c, 3.0);

  const light = new THREE.DirectionalLight(0xFFFFFF, 3.0);
  light.position.set(1, 1, -1);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xeeeeee);

  scene.add(ambientLight);
  scene.add(light);

  const grid = new THREE.GridHelper(3, 30)
  grid.rotateX(Math.PI / 2);

  scene.add(grid);

  let transform = new THREE.Matrix4()

  const lineMaterial = new THREE.LineDashedMaterial({ color: 0x000000 });
  const cylinderMaterial = new THREE.MeshStandardMaterial({ color: 0xFFAAAA, opacity: 0.4, transparent: true });
  const cylinderInspectMaterial = new THREE.MeshStandardMaterial({ color: 0xFF3333, opacity: 0.7, transparent: true });

  function drawCylinder(inspected: boolean, transform: THREE.Matrix4) {
    const cylinderGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.09);
    const cylinder = new THREE.Mesh(cylinderGeometry, inspected ? cylinderInspectMaterial : cylinderMaterial);

    const rotation = transform.clone().multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2))
    cylinder.rotation.setFromRotationMatrix(rotation)
    cylinder.position.setFromMatrixPosition(transform)

    cylinder.receiveShadow = true;
    cylinder.castShadow = true;

    scene.add(cylinder);

    var arrowPos = cylinder.position;
    
    const onlyRot = new THREE.Matrix4().extractRotation(transform)

    scene.add(new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0).applyMatrix4(onlyRot), arrowPos, 0.05, 0x7F2020, 0.02, 0.01));
    scene.add(new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0).applyMatrix4(onlyRot), arrowPos, 0.05, 0x207F20, 0.02, 0.01));
    scene.add(new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1).applyMatrix4(onlyRot), arrowPos, 0.05, 0x20207F, 0.02, 0.01));

  }

  drawCylinder(false, transform);

  for (let i = 0; i < items.value.length; i++) {
    let item = items.value[i]
    const inspected = inspectEndItem.value == item.name;

    const dh = dhToMatrix(item.d, item.theta, item.a, item.alpha)
    const newTransform = transform.clone().multiply(dh)

    const lineGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3().setFromMatrixPosition(newTransform),
      new THREE.Vector3().setFromMatrixPosition(transform),
    ]);

    const line = new THREE.Line(lineGeometry, lineMaterial);
    // scene.add(line);

    drawCylinder(inspected, newTransform);

    transform = newTransform;
  }

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 1;
  controls.maxDistance = 5;

  function render() {
    renderer.render(scene, camera)
  }

  render();
  controls.addEventListener('change', render);
})
</script>

<style>
#__nuxt {
  height: 100vh;
}

/* Chrome, Safari, Edge, Opera */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Firefox */
input[type=number] {
  -moz-appearance: textfield;
}
</style>