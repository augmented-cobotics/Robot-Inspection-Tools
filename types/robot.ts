import type { Quaternion, Euler, Vector3 } from "three"

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
    // test angle
    angle: number
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

export interface RobotLink {
    mesh?: File
    offset: Vector3
    rotation: Vector3
}

export interface RobotJoint {
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

    // the child link
    link: RobotLink
}

export interface Robot {
    name: string
    joints: RobotJoint[]
}