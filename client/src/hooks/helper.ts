/// <reference types="@webgpu/types" />

export default function useCheckWebGPU() {
  let result = "Great, your current browser supports WebGPU!";
  if (!navigator.gpu) {
    result = "Sorry, your current browser does not support WebGPU.";
  }
  return { result };
}