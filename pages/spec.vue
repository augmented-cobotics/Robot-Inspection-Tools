<template>
    <div class="h-full">
        <div class="flex h-full">
            <div style="width: 1000px" class="flex flex-col">
                <div>
                    <u-button @click="triggerCompile">
                        Compile
                    </u-button>
                </div>
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
import { useIDBKeyval } from '@vueuse/integrations/useIDBKeyval'
import { decode } from 'base64-arraybuffer'

THREE.Object3D.DEFAULT_UP = new THREE.Vector3(0, 0, 1);

const storedContent = useIDBKeyval('db-spec-editor', '')
const content = ref('')

async function triggerCompile() {
    await storedContent.set(content.value)

    await renderWorld(content.value)
}

async function renderWorld(yaml: string) {
    let data: RobotDescription;

    try {
        data = YAML.parse(yaml) as RobotDescription
    } catch (e) {
        console.error(e)
        return;
    }

    if (!data) {
        return
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

    const grid = new THREE.GridHelper(3, 30)
    grid.rotateX(Math.PI / 2);

    scene.add(grid);

    let transform = new THREE.Matrix4()

    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
    const cylinderMaterial = new THREE.MeshStandardMaterial({ color: 0xFFAAAA });
    const gltfLoader = new GLTFLoader();

    for (let i = 0; i < data.joints.length; i++) {
        let item = data.joints[i]

        const dh = dhToMatrix(item.d ?? 0, item.theta ?? 0, item.a ?? 0, item.alpha ?? 0)
        let newTransform = transform.clone().multiply(dh)

        if (item.angle) {
            newTransform = newTransform.multiply(new THREE.Matrix4().makeRotationZ(item.angle))
        }

        const lineGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3().setFromMatrixPosition(newTransform),
            new THREE.Vector3().setFromMatrixPosition(transform),
        ]);

        const line = new THREE.Line(lineGeometry, lineMaterial);
        scene.add(line);
        
        if (item.mesh) {
            const meshData = decode(item.mesh)
            const model = await gltfLoader.parseAsync(meshData, '')
        
            const onlyRot = new THREE.Matrix4().extractRotation(newTransform)
            const rotation = onlyRot.clone().multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2))
            
            model.scene.rotation.setFromRotationMatrix(rotation)
            model.scene.position.setFromMatrixPosition(newTransform)

            if (item.mesh_offset) {
                item.mesh_offset = new THREE.Vector3(item.mesh_offset.x, item.mesh_offset.y, item.mesh_offset.z)
                model.scene.position.add(item.mesh_offset.applyMatrix4(onlyRot))
            }

            scene.add(model.scene)
        }

        
        const onlyRot = new THREE.Matrix4().extractRotation(newTransform)
        const arrowPos = new THREE.Vector3().setFromMatrixPosition(newTransform);

        scene.add(new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0).applyMatrix4(onlyRot), arrowPos, 0.1, 0x7F2020, 0.02, 0.01));
        scene.add(new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0).applyMatrix4(onlyRot), arrowPos, 0.1, 0x207F20, 0.02, 0.01));
        scene.add(new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1).applyMatrix4(onlyRot), arrowPos, 0.1, 0x20207F, 0.02, 0.01));

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

onMounted(() => {
    content.value = storedContent.data.value
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