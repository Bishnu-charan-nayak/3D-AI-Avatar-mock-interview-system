import * as THREE from "three";
import { useAnimations, useFBX, useGLTF } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";

// Viseme → morph target name mapping (Rhubarb phoneme → ReadyPlayerMe shape)
const corresponding = {
  A: "viseme_PP",
  B: "viseme_kk",
  C: "viseme_I",
  D: "viseme_AA",
  E: "viseme_O",
  F: "viseme_U",
  G: "viseme_FF",
  H: "viseme_TH",
  X: "viseme_PP",
};

// Track which clips have already been retargeted (clips are cached by useFBX)
const retargetedClips = new WeakSet();

/**
 * Retarget Mixamo FBX animation tracks to match ReadyPlayerMe GLB bone names.
 * Uses a WeakSet to ensure this runs ONLY ONCE per clip object — not on every render.
 *
 * Mixamo FBX exports prefix tracks with "Armature|" or have a bare "Armature.*"
 * root track. Neither exists in the RPM GLB skeleton, causing Three.js warnings
 * and silent animation failures.
 */
function retargetAnimation(clip) {
  if (retargetedClips.has(clip)) return clip; // already done
  retargetedClips.add(clip);

  clip.tracks = clip.tracks
    .filter((track) => {
      // Drop bare "Armature.quaternion/position/scale" — no such node in GLB
      return !/^Armature\.(quaternion|position|scale)$/.test(track.name);
    })
    .map((track) => {
      track.name = track.name.replace(/^Armature\|/, "");   // "Armature|Hips.pos" → "Hips.pos"
      track.name = track.name.replace(/^mixamorig:/, "");    // strip mixamorig: prefix
      return track;
    });

  return clip;
}

export function Avatar({ botResponse }) {
  // Single combined state → play effect fires exactly ONCE per bot turn
  const [audioData, setAudioData] = useState(null); // { url: string, lipsync: object }

  const audioRef    = useRef(null);
  const intervalRef = useRef(null);
  const group       = useRef();
  // Stable ref to nodes so the setInterval closure is never stale across renders
  const nodesRef    = useRef(null);

  const morphTargetSmoothing = 0.5;

  const [currentAnimation, setCurrentAnimation] = useState("Idle");

  const { nodes, materials } = useGLTF("models/67b8b162f9aa33fca2cce455 (2).glb");

  // Keep nodesRef current (nodes object is stable after load, but just in case)
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  // ── FBX Animations ───────────────────────────────────────────────────────────
  const idleAnim    = useFBX("/animations/Idle.fbx");
  const talkingAnim = useFBX("/animations/Talking.fbx");
  const thinkAnim   = useFBX("/animations/Thinking.fbx");

  // Name clips and retarget ONCE (WeakSet guards against repeated mutation)
  idleAnim.animations[0].name    = "Idle";
  talkingAnim.animations[0].name = "Talking";
  thinkAnim.animations[0].name   = "Thinking";
  retargetAnimation(idleAnim.animations[0]);
  retargetAnimation(talkingAnim.animations[0]);
  retargetAnimation(thinkAnim.animations[0]);

  const { actions } = useAnimations(
    [idleAnim.animations[0], talkingAnim.animations[0], thinkAnim.animations[0]],
    group
  );

  // ── Switch animations ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!actions || !actions[currentAnimation]) return;
    actions[currentAnimation].reset().fadeIn(0.5).play();
    return () => { actions[currentAnimation]?.fadeOut(0.5); };
  }, [actions, currentAnimation]);

  // ── Fetch audio + lipsync when botResponse changes ───────────────────────────
  useEffect(() => {
    if (!botResponse) return;

    // Cancel any in-flight fetch from a previous turn
    let cancelled = false;

    // Stop current audio immediately
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const fetchAll = async () => {
      try {
        console.log("[Avatar] Fetching audio + lipsync for response:", botResponse.slice(0, 60));

        const [audioRes, lipsyncRes] = await Promise.all([
          fetch("http://127.0.0.1:8000/get_audio/"),
          fetch("http://127.0.0.1:8000/get_lypsync/"),
        ]);

        if (!audioRes.ok)   throw new Error(`Audio fetch failed: ${audioRes.status}`);
        if (!lipsyncRes.ok) throw new Error(`Lipsync fetch failed: ${lipsyncRes.status}`);

        // Fetch both data in parallel
        const [blob, lipsyncData] = await Promise.all([
          audioRes.blob(),
          lipsyncRes.json(),
        ]);

        if (cancelled) return; // botResponse changed — discard

        const url = URL.createObjectURL(blob);
        console.log("[Avatar] Audio URL:", url, "| Lipsync cues:", lipsyncData?.mouthCues?.length);

        // Single state update → play effect fires once
        setAudioData({ url, lipsync: lipsyncData });
      } catch (err) {
        console.error("[Avatar] fetchAll error:", err);
      }
    };

    fetchAll();

    return () => { cancelled = true; };
  }, [botResponse]);

  // ── Play audio + drive lipsync ───────────────────────────────────────────────
  useEffect(() => {
    if (!audioData) return;

    const { url, lipsync } = audioData;
    let blobRevoked = false;

    const revokeUrl = () => {
      if (!blobRevoked) { URL.revokeObjectURL(url); blobRevoked = true; }
    };

    // Stop any leftover audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const audio = new Audio(url);
    audioRef.current = audio;
    audio.preload = "auto";

    const stopLipsync = () => {
      setCurrentAnimation("Idle");
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const startLipsync = () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        const n = nodesRef.current;
        if (!n || !audioRef.current || audioRef.current.paused || audioRef.current.ended) return;

        const t = audioRef.current.currentTime;

        // Lerp all viseme shapes toward 0
        Object.values(corresponding).forEach((viseme) => {
          const hi = n.Wolf3D_Head?.morphTargetDictionary?.[viseme];
          const ti = n.Wolf3D_Teeth?.morphTargetDictionary?.[viseme];
          if (hi !== undefined)
            n.Wolf3D_Head.morphTargetInfluences[hi] =
              THREE.MathUtils.lerp(n.Wolf3D_Head.morphTargetInfluences[hi], 0, morphTargetSmoothing);
          if (ti !== undefined)
            n.Wolf3D_Teeth.morphTargetInfluences[ti] =
              THREE.MathUtils.lerp(n.Wolf3D_Teeth.morphTargetInfluences[ti], 0, morphTargetSmoothing);
        });

        // Find active cue and drive it toward 1
        if (lipsync?.mouthCues) {
          for (const cue of lipsync.mouthCues) {
            if (t >= cue.start && t <= cue.end) {
              const viseme = corresponding[cue.value];
              if (!viseme) break;
              const hi = n.Wolf3D_Head?.morphTargetDictionary?.[viseme];
              const ti = n.Wolf3D_Teeth?.morphTargetDictionary?.[viseme];
              if (hi !== undefined)
                n.Wolf3D_Head.morphTargetInfluences[hi] =
                  THREE.MathUtils.lerp(n.Wolf3D_Head.morphTargetInfluences[hi], 1, morphTargetSmoothing);
              if (ti !== undefined)
                n.Wolf3D_Teeth.morphTargetInfluences[ti] =
                  THREE.MathUtils.lerp(n.Wolf3D_Teeth.morphTargetInfluences[ti], 1, morphTargetSmoothing);
              break;
            }
          }
        }
      }, 40);
    };

    audio.onended = () => {
      console.log("[Avatar] Audio ended");
      stopLipsync();
      revokeUrl();
    };

    audio.onerror = (e) => {
      console.error("[Avatar] Audio error:", e);
      stopLipsync();
      revokeUrl();
    };

    const play = async () => {
      try {
        setCurrentAnimation("Talking");
        startLipsync();
        await audio.play();
        console.log("[Avatar] Audio playing ✓");
      } catch (err) {
        // NotAllowedError = autoplay blocked by browser policy
        if (err.name === "NotAllowedError") {
          console.warn("[Avatar] Autoplay blocked — will play on next user gesture.");
          stopLipsync();
          // Queue playback on next click/touch anywhere
          const resumeOnGesture = async () => {
            try {
              setCurrentAnimation("Talking");
              startLipsync();
              await audio.play();
              console.log("[Avatar] Audio playing after user gesture ✓");
            } catch (e) {
              console.error("[Avatar] Gesture play error:", e);
              stopLipsync();
            }
            document.removeEventListener("click", resumeOnGesture);
            document.removeEventListener("keydown", resumeOnGesture);
          };
          document.addEventListener("click", resumeOnGesture, { once: true });
          document.addEventListener("keydown", resumeOnGesture, { once: true });
        } else {
          console.error("[Avatar] audio.play() error:", err);
          stopLipsync();
        }
      }
    };

    // Start as soon as browser has basic metadata (faster than canplaythrough)
    if (audio.readyState >= 2) {
      play();
    } else {
      audio.addEventListener("loadeddata", play, { once: true });
    }

    return () => {
      audio.pause();
      audio.onended = null;
      audio.onerror = null;
      stopLipsync();
      // Don't revoke here — audio might still be pre-loaded
    };
  }, [audioData]);

  // ── Head follows camera ──────────────────────────────────────────────────────
  useFrame((state) => {
    const head = group.current?.getObjectByName("Head");
    if (head) head.lookAt(state.camera.position);
  });

  return (
    <group position={[0, -4.5, 5.5]} scale={3} dispose={null} ref={group}>
      <primitive object={nodes.Hips} />
      <skinnedMesh geometry={nodes.Wolf3D_Body.geometry}         material={materials.Wolf3D_Body}          skeleton={nodes.Wolf3D_Body.skeleton} />
      <skinnedMesh geometry={nodes.Wolf3D_Outfit_Bottom.geometry} material={materials.Wolf3D_Outfit_Bottom} skeleton={nodes.Wolf3D_Outfit_Bottom.skeleton} />
      <skinnedMesh geometry={nodes.Wolf3D_Outfit_Footwear.geometry} material={materials.Wolf3D_Outfit_Footwear} skeleton={nodes.Wolf3D_Outfit_Footwear.skeleton} />
      <skinnedMesh geometry={nodes.Wolf3D_Outfit_Top.geometry}    material={materials.Wolf3D_Outfit_Top}    skeleton={nodes.Wolf3D_Outfit_Top.skeleton} />
      <skinnedMesh geometry={nodes.Wolf3D_Hair.geometry}          material={materials.Wolf3D_Hair}          skeleton={nodes.Wolf3D_Hair.skeleton} />
      <skinnedMesh name="EyeLeft"
        geometry={nodes.EyeLeft.geometry} material={materials.Wolf3D_Eye} skeleton={nodes.EyeLeft.skeleton}
        morphTargetDictionary={nodes.EyeLeft.morphTargetDictionary} morphTargetInfluences={nodes.EyeLeft.morphTargetInfluences} />
      <skinnedMesh name="EyeRight"
        geometry={nodes.EyeRight.geometry} material={materials.Wolf3D_Eye} skeleton={nodes.EyeRight.skeleton}
        morphTargetDictionary={nodes.EyeRight.morphTargetDictionary} morphTargetInfluences={nodes.EyeRight.morphTargetInfluences} />
      <skinnedMesh name="Wolf3D_Head"
        geometry={nodes.Wolf3D_Head.geometry} material={materials.Wolf3D_Skin} skeleton={nodes.Wolf3D_Head.skeleton}
        morphTargetDictionary={nodes.Wolf3D_Head.morphTargetDictionary} morphTargetInfluences={nodes.Wolf3D_Head.morphTargetInfluences} />
      <skinnedMesh name="Wolf3D_Teeth"
        geometry={nodes.Wolf3D_Teeth.geometry} material={materials.Wolf3D_Teeth} skeleton={nodes.Wolf3D_Teeth.skeleton}
        morphTargetDictionary={nodes.Wolf3D_Teeth.morphTargetDictionary} morphTargetInfluences={nodes.Wolf3D_Teeth.morphTargetInfluences} />
      <skinnedMesh name="Wolf3D_Glasses"
        geometry={nodes.Wolf3D_Glasses.geometry} material={materials.Wolf3D_Glasses} skeleton={nodes.Wolf3D_Glasses.skeleton}
        morphTargetDictionary={nodes.Wolf3D_Glasses.morphTargetDictionary} morphTargetInfluences={nodes.Wolf3D_Glasses.morphTargetInfluences} />
    </group>
  );
}

useGLTF.preload("models/67b8b162f9aa33fca2cce455 (2).glb");
