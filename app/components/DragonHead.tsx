import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

interface DragonHeadProps {
  mousePosition: { x: number; y: number };
  scale?: number;
  position?: [number, number, number];
}

const DragonHead: React.FC<DragonHeadProps> = ({ mousePosition, scale = 1, position = [0, 0, 0] }) => {
  const { scene } = useGLTF("/models/Dragon.glb")
  const meshRef = useRef<THREE.Object3D>()
  const targetRotation = useRef(new THREE.Euler())

  useEffect(() => {
    if (meshRef.current) {
      // Adjust the initial rotation to make the dragon look slightly downward
      meshRef.current.rotation.x = -Math.PI / 5 // Changed from -Math.PI / 3 to -Math.PI / 5
      meshRef.current.rotation.y = 0
      meshRef.current.rotation.z = 0
      meshRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true
        }
      })
    }
  }, [])

  useFrame((state, delta) => {
    if (meshRef.current) {
      // Calculate target rotation
      const targetX = mousePosition.y - 1.0 // Adjusted from -1.5 to -1.2
      const targetY = mousePosition.x
      meshRef.current.lookAt(targetY, targetX, 1)
      targetRotation.current.copy(meshRef.current.rotation)

      // Smoothly interpolate current rotation to target rotation
      meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, targetRotation.current.x, 0.05)
      meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, targetRotation.current.y, 0.05)
      meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, targetRotation.current.z, 0.05)
    }
  })

  return (
    <mesh scale={scale} position={position}>
      <primitive 
        object={scene} 
        ref={meshRef}
      />
    </mesh>
  )
}

export default DragonHead;
