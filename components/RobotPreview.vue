<template>
    <div ref="preview-canvas">

    </div>
</template>

<script setup lang="ts">
import type { Robot } from '~/types/robot';

import * as THREE from 'three';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { useResizeObserver } from '@vueuse/core';

THREE.Object3D.DEFAULT_UP = new THREE.Vector3(0, 0, 1);

const { robot, showFrames = true, showMeshes = true, angles = [] } = defineProps<{
    robot?: Robot
    showFrames?: boolean
    showMeshes?: boolean
    angles?: number[]
}>()

const canvas = useTemplateRef('preview-canvas')

//

let renderer: THREE.WebGLRenderer;
let camera: THREE.PerspectiveCamera;
let scene: THREE.Scene;
let robotGroup: THREE.Group;

let robotJoints: THREE.Object3D[] = []
let robotJointsBaseTransform: THREE.Matrix4[] = []

/*

*/

async function updateRobotJoints() {
    for (let i = 0; i < robotJoints.length; i++) {
        const model = robotJoints[i]
        const transform = robotJointsBaseTransform[i].clone()

        if (angles.length >= i) {
            transform.multiply(new THREE.Matrix4().makeRotationZ(angles[i]))
        }

        const rotation = new THREE.Matrix4().extractRotation(transform)

        const meshRotation = rotation.clone().multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2))

        model.rotation.setFromRotationMatrix(meshRotation)
        model.position.setFromMatrixPosition(transform)
    }
}

watch(() => angles, () => {
    updateRobotJoints()
    renderWorld()
}, { deep: true });

async function updateRobot() {
    robotGroup.clear()
    robotJoints = []
    robotJointsBaseTransform = []

    if (!robot) {
        return
    }

    let transform = new THREE.Matrix4()

    const gltfLoader = new GLTFLoader();

    for (let i = 0; i < robot.joints.length; i++) {
        let item = robot.joints[i]

        const dh = dhToMatrix(item.d, item.theta, item.a, item.alpha)
        transform.multiply(dh)

        robotJointsBaseTransform.push(transform.clone())

        const rotation = new THREE.Matrix4().extractRotation(transform)

        if (item.link.mesh && showMeshes) {
            const meshData = await item.link.mesh.arrayBuffer()
            const model = await gltfLoader.parseAsync(meshData, '')

            const meshRotation = rotation.clone().multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2))

            model.scene.rotation.setFromRotationMatrix(meshRotation)
            model.scene.position.setFromMatrixPosition(transform)

            robotGroup.add(model.scene)
            robotJoints.push(model.scene)
        }

        if (showFrames) {
            const arrowPos = new THREE.Vector3().setFromMatrixPosition(transform);

            robotGroup.add(new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0).applyMatrix4(rotation), arrowPos, 0.1, 0x7F2020, 0.02, 0.01));
            robotGroup.add(new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0).applyMatrix4(rotation), arrowPos, 0.1, 0x207F20, 0.02, 0.01));
            robotGroup.add(new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1).applyMatrix4(rotation), arrowPos, 0.1, 0x20207F, 0.02, 0.01));
        }
    }
}

watch([() => robot, () => showMeshes, () => showFrames], async () => {
    await updateRobot()
    renderWorld()
}, { deep: true })

/*

*/

function updateCanvasSize(width: number, height: number) {
    renderer.setSize(width, height)

    const ratio = width / height
    camera.aspect = ratio
    camera.updateProjectionMatrix()
}

useResizeObserver(canvas, (entries) => {
    const entry = entries[0]
    const { width, height } = entry.contentRect

    updateCanvasSize(width, height)
    renderWorld()
})

/*

*/

function renderWorld() {
    renderer.render(scene, camera)
}

async function createWorld() {
    if (!canvas.value) {
        return
    }

    //

    const element = canvas.value
    const canvasWidth = element.clientWidth;
    const canvasHeight = element.clientHeight;

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
    renderer.setSize(canvasWidth, canvasHeight);

    element.innerHTML = ''
    element.appendChild(renderer.domElement);

    //

    camera = new THREE.PerspectiveCamera(45, canvasWidth / canvasHeight, 0.1, 10000);
    camera.position.set(1, 1, 1);

    const ambientLight = new THREE.AmbientLight(0x7c7c7c, 3.0);

    const light = new THREE.DirectionalLight(0xFFFFFF, 3.0);
    light.position.set(1, 1, -1);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xeeeeee);

    scene.add(ambientLight);
    scene.add(light);

    const grid = new THREE.GridHelper(3, 30)
    grid.rotateX(Math.PI / 2);

    scene.add(grid);

    robotGroup = new THREE.Group()
    scene.add(robotGroup)

    await updateRobot()

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.minDistance = 1;
    controls.maxDistance = 5;

    controls.addEventListener('change', renderWorld);
}

onMounted(async () => {
    await createWorld()
    renderWorld()
})
</script>