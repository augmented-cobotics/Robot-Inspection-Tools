<template>
    <div class="h-full">
        <div class="flex h-full">
            <div style="width: 1000px" class="flex flex-col">
                <v-ace-editor v-model:value="content" lang="yaml" theme="monokai" :print-margin="false"
                    class="h-full w-full" />
            </div>
            <div id="myChart" class="flex-1 h-full">

            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { VAceEditor } from 'vue3-ace-editor';
import '@/utils/ace-config.ts'

import YAML from 'yaml'

import * as THREE from 'three';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { RobotJointType, type RobotDescription } from '@/types/robot';
import { useStorage } from '@vueuse/core'

const content = useStorage('spec-editor', '')

async function renderWorld(yaml: string) {
    let data: RobotDescription;
    
    try {
        data = YAML.parse(yaml) as RobotDescription
    } catch(e) {
        console.error(e)
        return;
    }

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

    scene.add(new THREE.GridHelper(3, 30));

    let transform = new THREE.Matrix4()

    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
    const cylinderMaterial = new THREE.MeshStandardMaterial({ color: 0xFFAAAA });
    const gltfLoader = new GLTFLoader();

    for (let i = 0; i < data.joints.length; i++) {
        let item = data.joints[i]

        const dh = dhToMatrix(item.d ?? 0, item.theta ?? 0, item.a ?? 0, item.alpha ?? 0)
        const newTransform = transform.clone().multiply(dh)

        const lineGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3().setFromMatrixPosition(newTransform),
            new THREE.Vector3().setFromMatrixPosition(transform),
        ]);

        const line = new THREE.Line(lineGeometry, lineMaterial);
        scene.add(line);

        if (item.mesh) {
            const meshData = atob(item.mesh)
            const model = await gltfLoader.parseAsync(meshData, '')
            model.scene.position.setFromMatrixPosition(newTransform)
            model.scene.rotation.setFromRotationMatrix(newTransform)
            scene.add(model.scene)
        }

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
}

watch(content, (newContent) => {
    renderWorld(newContent)
})

onMounted(() => {
    renderWorld(content.value)
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