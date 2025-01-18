import type { JointParameters } from "~/types/robot";

import * as THREE from 'three';

export const dhToMatrix = (d: number, theta: number, a: number, alpha: number) => {
    const transZ = new THREE.Matrix4(
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, d,
        0, 0, 0, 1
    )

    const ct = Math.cos(theta);
    const st = Math.sin(theta);

    const rotZ = new THREE.Matrix4(
        ct, -st, 0, 0,
        st, ct, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    )

    const transX = new THREE.Matrix4(
        1, 0, 0, a,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    )

    const ca = Math.cos(alpha);
    const sa = Math.sin(alpha);

    const rotX = new THREE.Matrix4(
        1, 0, 0, 0,
        0, ca, -sa, 0,
        0, sa, ca, 0,
        0, 0, 0, 1
    )

    const z = transZ.multiply(rotZ);
    const x = transX.multiply(rotX);

    return z.multiply(x);
}