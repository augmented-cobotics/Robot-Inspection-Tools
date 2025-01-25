<template>
    <div class="h-full">
        <div class="flex h-full">
            <div class="w-1/2 max-w-2xl p-4">
                <UCard class="flex flex-col">
                    <template #header>
                        <div class="flex items-center">
                            <div>
                                <h1 class="text-lg font-bold">Robot Designer</h1>
                                <p>Create and modify robot specifications</p>
                            </div>
                            <div class="ml-auto">
                                <UDropdown :items="[importDropdownItems]" :popper="{ placement: 'bottom-start' }">
                                    <UButton color="white" label="Load"
                                        trailing-icon="i-heroicons-chevron-down-20-solid" />
                                </UDropdown>
                            </div>
                        </div>
                    </template>

                    <UInput v-model="robotCursor.name" size="md" placeholder="Robot name" />

                    <UAccordion :items="accordionItems" class="mt-4">
                        <template v-for="i in accordionItems.length" v-slot:[getJointName(i)]>
                            <div class="p-2">
                                <div class="flex">
                                    <UInput v-model="robotCursor.joints[i - 1].name" placeholder="Joint name"
                                        class="flex-1" />
                                    <USelect v-model="robotCursor.joints[i - 1].type" :options="jointTypes"
                                        class="ml-4"></USelect>
                                    <UButton variant="link" class="ml-4" color="red" @click="deleteJoint(i - 1)">
                                        Delete
                                    </UButton>
                                </div>

                                <UDivider class="my-4" />

                                <TextInput class="mt-4" v-model.number="robotCursor.joints[i - 1].d" label="d"
                                    placeholder="d">
                                    <template #hint>
                                        Displacement from the previous frame's <span class="font-bold">Z</span> axis
                                    </template>
                                </TextInput>

                                <TextInput class="mt-4" v-model.number="robotCursor.joints[i - 1].theta" label="θ"
                                    placeholder="theta">
                                    <template #hint>
                                        Angle around the previous frame's <span class="font-bold">Z</span> axis
                                        from previous <span class="font-bold">X</span> to new <span
                                            class="font-bold">X</span> axis
                                    </template>
                                </TextInput>

                                <TextInput class="mt-4" v-model.number="robotCursor.joints[i - 1].a" label="a"
                                    placeholder="a">
                                    <template #hint>
                                        Displacement from new frame's <span class="font-bold">X</span> axis
                                    </template>
                                </TextInput>

                                <TextInput class="mt-4" v-model.number="robotCursor.joints[i - 1].alpha" label="α"
                                    placeholder="alpha">
                                    <template #hint>
                                        Angle around the new frame's <span class="font-bold">X</span> axis from
                                        previous <span class="font-bold">Z</span> to new <span
                                            class="font-bold">Z</span>
                                        axis
                                    </template>
                                </TextInput>

                                <UDivider class="my-4" />

                                <div class="flex gap-4">
                                    <div v-if="!robotCursor.joints[i - 1].link.mesh" class="flex-1">
                                        <p class="font-bold mb-1">Link model</p>
                                        <MeshInput description="GLTF or GLB"
                                            @change="onLinkMeshInput($event.target.files, i - 1)" accept=".glb,.gltf">
                                            <span class="font-semibold">Click to
                                                upload</span> or drag and drop
                                        </MeshInput>
                                    </div>
                                    <div v-else class="flex-1">
                                        <p class="font-bold mb-1">Link model (<UButton variant="link" :padded="false"
                                                @click="downloadFile(robotCursor.joints[i - 1].link.mesh!)">
                                                Download</UButton>)</p>
                                        <MeshInput :description="robotCursor.joints[i - 1].link.mesh!.name"
                                            color="primary" @change="onLinkMeshInput($event.target.files, i - 1)"
                                            accept=".glb,.gltf">
                                            Loaded link mesh file!
                                        </MeshInput>
                                    </div>

                                    <div class="flex-1 mt-4">
                                        <p class="font-bold text-xs">Offset</p>
                                        <div class="flex gap-2">
                                            <UInput placeholder="X" v-model="robotCursor.joints[i - 1].link.offset.x" />
                                            <UInput placeholder="Y" v-model="robotCursor.joints[i - 1].link.offset.y" />
                                            <UInput placeholder="Z" v-model="robotCursor.joints[i - 1].link.offset.z" />
                                        </div>
                                        <p class="font-bold text-xs mt-2">Rotation</p>
                                        <div class="flex gap-2">
                                            <UInput placeholder="R"
                                                v-model="robotCursor.joints[i - 1].link.rotation.x" />
                                            <UInput placeholder="P"
                                                v-model="robotCursor.joints[i - 1].link.rotation.y" />
                                            <UInput placeholder="Y"
                                                v-model="robotCursor.joints[i - 1].link.rotation.z" />
                                        </div>
                                    </div>
                                </div>

                                <p class="m-1" v-if="robotCursor.joints.length > i">Model for the link attached between
                                    {{
                                        robotCursor.joints[i - 1].name }} and {{ robotCursor.joints[i].name }}</p>
                                <p class="m-1" v-else>Model for the link attached from
                                    {{
                                        robotCursor.joints[i - 1].name }}</p>
                            </div>
                        </template>
                    </UAccordion>

                    <div class="flex justify-center mb-4">
                        <UButton variant="link" @click="addNewJoint">
                            + Add a new joint
                        </UButton>
                    </div>

                    <UButton block color="white" @click="previewRobot">
                        Preview
                    </UButton>

                    <UButton block :disabled="!robotCursorValid" class="mt-2" @click="saveRobot">
                        Save
                    </UButton>

                    <div class="flex flex-row mt-2 gap-4">
                        <label class="flex-1 flex items-center justify-center cursor-pointer">
                            <span class="text-sm">Import</span>
                            <input type="file" class="hidden" accept="application/json" @change="importRobotFile" />
                        </label>
                        <UButton class="flex-1" block variant="link" @click="exportRobot" :disabled="!robotCursorValid">
                            Export
                        </UButton>
                    </div>
                </UCard>
            </div>
            <div class="flex-1 h-full bg-black relative">
                <RobotPreview :robot="robotPreview" :show-meshes="showMeshes" :show-frames="showFrames"
                    :angles="robotPreviewJointsRad" v-model:end-effector-transform="robotPreviewEndEffectorTransform"
                    class="h-full" />

                <div class="absolute top-0 left-0 p-4">
                    <div class="flex flex-col gap-2 bg-black/10 p-2 rounded-lg">
                        <div class="flex items-center gap-2">
                            <UToggle color="primary" v-model="showFrames" />
                            <p>Show frames</p>
                        </div>

                        <div class="flex items-center gap-2">
                            <UToggle color="primary" v-model="showMeshes" />
                            <p>Show meshes</p>
                        </div>
                    </div>
                </div>

                <div v-if="robotCursorValid && robotCursor.joints.length > 0" class="absolute top-0 right-0 p-4">
                    <div class="flex flex-col gap-4 bg-black/10 p-2 rounded-lg">
                        <div v-for="(val, i) in robotPreviewJoints" class="flex gap-4 items-center">
                            <URange v-model="robotPreviewJoints[i]" class="flex-1 w-64" :min="0" :max="359" :step="1" />
                            <p class="w-10">{{ robotPreviewJoints[i] }} º</p>
                        </div>
                    </div>
                </div>

                <div v-if="robotPreviewEndEffectorTransform" class="absolute bottom-0 right-0 p-4">
                    <div class="flex flex-col gap-4 bg-black/10 p-2 rounded-lg">
                        <div class="flex gap-12 justify-between">
                            <div>
                                <p class="font-bold">Transform</p>
                                <div class="grid grid-rows-4 grid-flow-col gap-4 mt-2">
                                    <span v-for="j in 16">{{ robotPreviewEndEffectorTransform.elements[j - 1].toFixed(4)
                                        }}</span>
                                </div>
                            </div>
                            <div>
                                <p class="font-bold">Position</p>
                                <div class="grid grid-cols-3 gap-4 mt-2">
                                    <span>{{ robotPreviewEndEffectorPosition!.x.toFixed(4) }}</span>
                                    <span>{{ robotPreviewEndEffectorPosition!.y.toFixed(4) }}</span>
                                    <span>{{ robotPreviewEndEffectorPosition!.z.toFixed(4) }}</span>
                                </div>
                            </div>
                            <div>
                                <p class="font-bold">Quaternion</p>
                                <div class="grid grid-cols-4 gap-4 mt-2">
                                    <span>{{ robotPreviewEndEffectorQuaternion!.x.toFixed(4) }}</span>
                                    <span>{{ robotPreviewEndEffectorQuaternion!.y.toFixed(4) }}</span>
                                    <span>{{ robotPreviewEndEffectorQuaternion!.z.toFixed(4) }}</span>
                                    <span>{{ robotPreviewEndEffectorQuaternion!.w.toFixed(4) }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { decode, encode } from 'base64-arraybuffer';
import localforage, { key } from 'localforage';
import { Euler, Matrix4, Quaternion, Vector3 } from 'three';
import { degToRad } from 'three/src/math/MathUtils.js';
import { RobotJointType, type Robot } from '~/types/robot';

useHead({
    title: 'Robot Designer | ROBOTICA'
})

const robotDatabase = ref<string[]>([])

const robotStore = localforage.createInstance({
    name: 'robots',
    driver: localforage.INDEXEDDB
})

const robotCursor = ref<Robot>({
    name: '',
    joints: [
    ]
})
const robotPreview = ref<Robot | undefined>()
const robotPreviewJoints = ref<number[]>([])
const robotPreviewJointsRad = computed(() => robotPreviewJoints.value.map(v => degToRad(v)))
const robotPreviewEndEffectorTransform = ref<Matrix4 | undefined>(undefined)
const robotPreviewEndEffectorPosition = computed(() => !!robotPreviewEndEffectorTransform.value ? new Vector3().setFromMatrixPosition(robotPreviewEndEffectorTransform.value!) : undefined)
const robotPreviewEndEffectorQuaternion = computed(() => !!robotPreviewEndEffectorTransform.value ? new Quaternion().setFromRotationMatrix(robotPreviewEndEffectorTransform.value!) : undefined)

const showFrames = ref(true)
const showMeshes = ref(true)

const robotCursorValid = computed(() => robotCursor.value.name.length > 0)

const jointTypes = computed(() => Object.entries(RobotJointType).map((entry) => ({
    label: entry[0],
    value: entry[1]
})))

const importDropdownItems = computed(() => {
    return robotDatabase.value.map(robot => ({
        label: robot,
        click: () => importRobot(robot)
    }))
})

const accordionItems = computed(() => {
    return robotCursor.value.joints.map((item, index) => ({
        label: item.name,
        slot: getJointName(index + 1)
    }))
})

/*

*/

function getJointName(index: number) {
    return `joint-${index}`
}

function getJoint(name: string) {
    return robotCursor.value.joints.find(j => j.name == name)
}

function addNewJoint() {
    let i = 1
    while (getJoint(getJointName(i))) {
        i++;
    }

    robotCursor.value.joints.push({
        name: getJointName(i),
        type: RobotJointType.Revolute,
        theta: 0,
        a: 0,
        d: 0,
        alpha: 0,
        link: {
            offset: new Vector3(0, 0, 0),
            rotation: new Vector3(0, 0, 0)
        }
    })
}

function deleteJoint(index: number) {
    robotCursor.value.joints.splice(index, 1)
}

/*

*/

function onLinkMeshInput(files: FileList, joint_index: number) {
    if (files.length == 0) {
        return
    }

    const file = files[0]
    robotCursor.value.joints[joint_index].link.mesh = file
}

/*

*/

async function fetchRobots() {
    const keys = await robotStore.keys()
    robotDatabase.value = keys
    console.log(keys)
}

async function importRobot(name: string) {
    const robot = await robotStore.getItem(name)
    if (!robot) {
        return
    }

    console.log(robot)

    robotCursor.value = robot as Robot
    previewRobot()
}

async function previewRobot() {
    robotPreview.value = { ...robotCursor.value }
    robotPreviewJoints.value = Array(robotCursor.value.joints.length).fill(0)
}

async function saveRobot() {
    const robot = toRaw(robotCursor.value)

    await robotStore.setItem(robot.name, robot)
}

async function exportRobot() {
    const out: any = { ...robotCursor.value }

    for (let i = 0; i < out.joints.length; i++) {
        const joint = out.joints[i]
        const mesh: File = joint.link.mesh

        if (!mesh) {
            continue
        }

        const buffer = await mesh.arrayBuffer()
        const uri = encode(buffer)
        joint.link.mesh = {
            name: mesh.name,
            size: mesh.size,
            type: mesh.type,
            uri: uri
        }
    }

    const json = JSON.stringify(out)
    const url = 'data:application/json;charset=utf-8,' + encodeURIComponent(json)

    await downloadRawFile(`robot_${out.name}.json`, url)
}

async function importRobotFile(event: any) {
    const files = event.target?.files
    if (!files || files.length == 0) {
        return
    }

    const file: File = files[0]
    const text = await file.text()
    const out = JSON.parse(text)

    for (let i = 0; i < out.joints.length; i++) {
        const joint = out.joints[i]
        const mesh = joint.link.mesh

        if (!mesh) {
            continue
        }

        const buffer = decode(mesh.uri)
        joint.link.mesh = new File([buffer], mesh.name, {
            type: mesh.type
        })
    }

    robotCursor.value = out
    previewRobot()
}

async function downloadRawFile(name: string, url: string) {
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.href = url;
    a.download = name;
    a.click();

}

async function downloadFile(file: File) {
    const url = URL.createObjectURL(file)

    await downloadRawFile(file.name, url)

    URL.revokeObjectURL(url);
}

/*

*/

onMounted(fetchRobots)

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