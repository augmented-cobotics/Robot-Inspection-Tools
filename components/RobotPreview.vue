<template>
    <div ref="preview-canvas">

    </div>
</template>

<script setup lang="ts">
import type { Robot } from '~/types/robot';

import * as THREE from 'three';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { useResizeObserver } from '@vueuse/core';
import { degToRad, radToDeg } from 'three/src/math/MathUtils.js';

THREE.Object3D.DEFAULT_UP = new THREE.Vector3(0, 0, 1);

const { robot, showFrames = true, showMeshes = true, angles = [] } = defineProps<{
    robot?: Robot
    showFrames?: boolean
    showMeshes?: boolean
    angles?: number[]
}>()

const endEffectorTransform = defineModel<THREE.Matrix4 | undefined>('endEffectorTransform')

const canvas = useTemplateRef('preview-canvas')

//

let renderer: THREE.WebGLRenderer;
let camera: THREE.PerspectiveCamera;
let scene: THREE.Scene;
let robotGroup: THREE.Group;
let robotMeshes: GLTF[] = [

]

async function updateRobot() {
    console.log('aaa')
    robotGroup.clear()

    if (!robot) {
        endEffectorTransform.value = undefined
        return
    }

    const gltfLoader = new GLTFLoader();

    let parent: THREE.Object3D | undefined = undefined;

    for (let i = 0; i < robot.joints.length; i++) {
        let item = robot.joints[i]

        const obj = new THREE.Object3D();
        obj.name = item.name

        const matrix = dhToMatrix(item.d, degToRad(item.theta), item.a, degToRad(item.alpha))
        matrix.decompose(obj.position, obj.quaternion, obj.scale);

        obj.rotateZ(angles[i])

        if (parent != null) {
            obj.applyMatrix4(parent.matrixWorld)
        }

        obj.updateMatrixWorld(true)

        robotGroup.add(obj)

        if (item.link.mesh && showMeshes) {
            let model: GLTF;

            if (robotMeshes[i]) {
                model = robotMeshes[i]
            } else {
                const meshData = await item.link.mesh.arrayBuffer()
                model = await gltfLoader.parseAsync(meshData, '')
            }

            model.scene.position.set(0, 0, 0)
            model.scene.quaternion.set(0, 0, 0, 1)

            model.scene.position.add(item.link.offset)
            model.scene.rotateX(degToRad(item.link.rotation.x))
            model.scene.rotateY(degToRad(item.link.rotation.y))
            model.scene.rotateZ(degToRad(item.link.rotation.z))

            model.scene.applyMatrix4(obj.matrixWorld)

            robotGroup.add(model.scene)
            robotMeshes[i] = model
        }

        if (showFrames) {
            const origin = new THREE.Vector3()

            let axisX = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), origin, 0.1, 0x7F2020, 0.02, 0.01)
            axisX.applyMatrix4(obj.matrixWorld)
            robotGroup.add(axisX)

            let axisY = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), origin, 0.1, 0x207F20, 0.02, 0.01)
            axisY.applyMatrix4(obj.matrixWorld)
            robotGroup.add(axisY)

            let axisZ = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), origin, 0.1, 0x20207F, 0.02, 0.01)
            axisZ.applyMatrix4(obj.matrixWorld)
            robotGroup.add(axisZ)
        }

        parent = obj;
    }

    endEffectorTransform.value = parent?.matrixWorld
}

watch([() => robot, () => showMeshes, () => showFrames], async () => {
    robotMeshes = []
    await updateRobot()
    renderWorld()
})

watch([() => angles], async () => {
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