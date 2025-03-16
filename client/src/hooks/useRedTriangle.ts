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
    view: GPUTextureView,
    renderPipeline: GPURenderPipeline,
  ) => {
    const commandEncoder = device.createCommandEncoder();

    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          view,
          clearValue: [0, 0, 0, 0],
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
    };

    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(renderPipeline);
    passEncoder.draw(3);
    passEncoder.end();

    device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(render.bind(null, device, view, renderPipeline));
  }

  useEffect(() => {
    if (!canvasRef.current) {
      console.log("no canvas");
      return;
    }

    const init = async () => {
      const adapter = await navigator.gpu?.requestAdapter({
        featureLevel: 'compatibility'
      });
      const device = await adapter?.requestDevice();

      if (!device) {
        setIsLoading(false);
        setMessage("no suitable device found");
        return;
      }

      const context = canvasRef.current?.getContext('webgpu');
      if (!context) {
        setIsLoading(false);
        setMessage("no webgpu context");
        return;
      }

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
        },
      });

      const view = context.getCurrentTexture().createView()

      setIsLoading(false);
      setMessage("Great, your current browser supports WebGPU!");

      render(device, view, renderPipeline);
    };

    init();
  }, [canvasRef]);

  return {
    message,
    isWebGPUSupported,
    isLoading,
  };
};

export default useRedTriangle;
