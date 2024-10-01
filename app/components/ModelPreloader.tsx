'use client'

import { useGLTF } from '@react-three/drei'

export default function ModelPreloader() {
  useGLTF.preload("/models/Dragon.glb")
  return null
}