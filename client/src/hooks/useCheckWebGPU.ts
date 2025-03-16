/// <reference types="@webgpu/types" />

export default function useCheckWebGPU() {
  let message = "Great, your current browser supports WebGPU!";
  if (!navigator.gpu) {
    message = "Sorry, your current browser does not support WebGPU.";
  }
  return { message };
}