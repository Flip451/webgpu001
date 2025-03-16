/// <reference types="@webgpu/types" />

import { useEffect, useState } from "react";
import triangleWGSL from '../shaders/triangle.wgsl?raw';

const useRedTriangle = (canvasRef: React.RefObject<HTMLCanvasElement>) => {
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  const isWebGPUSupported = !!navigator.gpu;

  if (!isWebGPUSupported) {
    return {
      message: "no webgpu support",
      isWebGPUSupported,
      isLoading: false,
    };
  }

  const render = (
    device: GPUDevice,
    context: GPUCanvasContext,
    renderPipeline: GPURenderPipeline,
  ) => {
    const commandEncoder = device.createCommandEncoder();
    const textureView = context.getCurrentTexture().createView();

      const renderPassDescriptor: GPURenderPassDescriptor = {
        colorAttachments: [
          {
            view: textureView,
            clearValue: { r: 0, g: 0, b: 0, a: 1 },
            loadOp: 'clear',
            storeOp: 'store',
          },
        ],
      };

    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(renderPipeline);
    passEncoder.draw(3);
    passEncoder.end();

    const commandBuffer = commandEncoder.finish();
    device.queue.submit([commandBuffer]);
    requestAnimationFrame(render.bind(null, device, context, renderPipeline));
  }

  useEffect(() => {
    if (!canvasRef.current) {
      console.log("no canvas");
      return;
    }

    const init = async () => {
      const adapter = await navigator.gpu?.requestAdapter();
      const device = await adapter?.requestDevice();

      if (!device) {
        setIsLoading(false);
        setMessage("no suitable device found");
        return;
      }

      const context = canvasRef.current?.getContext('webgpu')!;
      console.log(context);
      const presentationFormat = navigator.gpu.getPreferredCanvasFormat();

      context.configure({
        device,
        format: presentationFormat,
        alphaMode: 'premultiplied',
      });

      const renderPipeline = device.createRenderPipeline({
        layout: 'auto',
        vertex: {
          module: device.createShaderModule({
            code: triangleWGSL
          }),
        },
        fragment: {
          module: device.createShaderModule({
            code: triangleWGSL
          }),
          targets: [{
            format: presentationFormat,
          }]
        },
        primitive: {
          topology: 'triangle-list',
        }
      });

      setIsLoading(false);
      setMessage("Great, your current browser supports WebGPU!");

      render(device, context, renderPipeline);
    };

    init();
  }, [canvasRef, isWebGPUSupported])

  return {
    message,
    isWebGPUSupported,
    isLoading,
  };
};

export default useRedTriangle;
