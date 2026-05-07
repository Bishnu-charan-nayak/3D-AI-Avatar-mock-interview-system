import { OrbitControls, useTexture } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { Avatar } from "./Avatar";

export function Experience({ botResponse }) {
  const texture = useTexture("textures/images.jpg");
  const viewport = useThree((state) => state.viewport);

  return (
    <>
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        enableRotate={false}
      />

      {/* Local lights — replaces the remote HDR Environment preset */}
      <ambientLight intensity={0.8} color="#fff4e0" />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.5}
        color="#ffd580"
        castShadow
      />
      <directionalLight
        position={[-5, 3, -3]}
        intensity={0.4}
        color="#a0c4ff"
      />

      <Avatar botResponse={botResponse} />

      <mesh>
        <planeGeometry args={[viewport.width, viewport.height]} />
        <meshBasicMaterial map={texture} />
      </mesh>
    </>
  );
};

