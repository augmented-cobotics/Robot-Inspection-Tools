import type { Quaternion, Vector3 } from "three"

export interface JointParameters {
    // name of the joint
    name: string
    // angle about previous z from old x to new x
    theta: number
    // length of the common normal. Assuming a revolute joint, this is the radius about previous z.
    a: number
    // offset along previous z to the common normal
    d: number
    // angle about common normal, from old z axis to new z axis
    alpha: number
}

export enum RobotJointType {
    Fixed = "fixed",
    Revolute = "revolute"
}

export interface RobotDescriptionJoint {
    // name of the joint
    name: string
    // type of the joint
    type: RobotJointType
    // angle about previous z from old x to new x
    theta: number
    // length of the common normal. Assuming a revolute joint, this is the radius about previous z.
    a: number
    // offset along previous z to the common normal
    d: number
    // angle about common normal, from old z axis to new z axis
    alpha: number
    // base64 uri encoded mesh data
    mesh: string
    //
    mesh_offset: Vector3
    //
    mesh_rotation: Quaternion
}

export interface RobotDescription {
    joints: RobotDescriptionJoint[]
}