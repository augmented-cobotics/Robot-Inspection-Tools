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