import { useCallback, useEffect, useRef, useState } from "react";
import bufferWGSL from '../shaders/buffer.wgsl?raw';

interface Color {
  r: number;
  g: number;
  b: number;
  a: number;
}

const useSRGBTriangle = (canvasRef: React.RefObject<HTMLCanvasElement>) => {
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const deviceRef = useRef<GPUDevice>();
  const [color, setColor] = useState<Color>({ r: 0, g: 0, b: 0, a: 1 });
  const vertexBufferRef = useRef<GPUBuffer>();
  const [animationFrameId, setAnimationFrameId] = useState<number>();

  const changeColor = useCallback((color: Color) => {
    setColor(color);
    if (!deviceRef.current) {
      console.log("no device");
      return;
    }

    const colorArray = [color.r, color.g, color.b, color.a];
    const vertices = [
      {
        position: [0.0, 0.5, 0.0],
        color: colorArray,
      },
      {
        position: [-0.5, -0.5, 0.0],
        color: colorArray,
      },
      {
        position: [0.5, -0.5, 0.0],
        color: colorArray,
      }
    ];
    const vertexData = new Float32Array(vertices.flatMap(v => [...v.position, ...v.color]))
    const vertexBuffer = deviceRef.current.createBuffer({
      size: vertexData.byteLength,
      usage: GPUBufferUsage.VERTEX,
      mappedAtCreation: true,
    });
    new Float32Array(vertexBuffer.getMappedRange()).set(vertexData);
    vertexBuffer.unmap();
    vertexBufferRef.current = vertexBuffer;
  }, [setColor]);

  const isWebGPUSupported = !!navigator.gpu;

  if (!isWebGPUSupported) {
    return {
      message: "no webgpu support",
      isWebGPUSupported,
      isLoading: false,
      color,
      changeColor,
    };
  }

  const render = useCallback((
    renderPipeline: GPURenderPipeline,
  ) => {
    if (!deviceRef.current || !canvasRef.current) {
      console.log("no device or canvas");
      throw new Error("no webgpu context");
    }

    const device = deviceRef.current;

    const context = canvasRef.current?.getContext('webgpu');

    if (!context) {
      console.log("no webgpu context");
      throw new Error("no webgpu context");
    }

    const view = context.getCurrentTexture().createView()

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

    const vertexBuffer = vertexBufferRef.current;

    if (!vertexBuffer) {
      console.log("no vertex buffer");
      throw new Error("no vertex buffer");
    }

    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(renderPipeline);
    passEncoder.setVertexBuffer(0, vertexBuffer);
    passEncoder.draw(3);
    passEncoder.end();

    device.queue.submit([commandEncoder.finish()]);
  }, [canvasRef, deviceRef])

  const init = useCallback(() => {
    if (!deviceRef.current || !canvasRef.current) {
      console.log("no device or canvas");
      return;
    }

    const device = deviceRef.current;

    const context = canvasRef.current.getContext('webgpu');
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
          code: bufferWGSL
        }),
        buffers: [{
          arrayStride: 28,
          attributes: [{
            offset: 0,
            format: 'float32x3',
            shaderLocation: 0,
          },
          {
            offset: 12,
            format: 'float32x4',
            shaderLocation: 1,
          }]
        }]
      },
      fragment: {
        module: device.createShaderModule({
          code: bufferWGSL
        }),
        targets: [{
          format: presentationFormat,
        }]
      },
      primitive: {
        topology: 'triangle-list',
      },
    });

    setIsLoading(false);
    setMessage("Great, your current browser supports WebGPU!");

    changeColor({ r: 0, g: 0, b: 0, a: 1 });

    const animate = () => {
      render(renderPipeline);
      setAnimationFrameId(requestAnimationFrame(animate));
    };

    animate();
  }, [render, changeColor, setMessage, setIsLoading]);

  useEffect(() => {
    if (deviceRef.current) {
      return;
    }

    const setDevice = async () => {
      const adapter = await navigator.gpu.requestAdapter({
        featureLevel: 'compatibility'
      });

      if (!adapter) {
        console.log("no adapter");
        throw new Error("no adapter");
      }

      const device = await adapter.requestDevice();

      deviceRef.current = device;
    }

    setDevice().then(async () => {
      await init();
    });

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (vertexBufferRef.current) {
        vertexBufferRef.current.destroy();
      }
    };
  }, [init]);

  return {
    message,
    isWebGPUSupported,
    isLoading,
    color,
    changeColor,
  };
};

export default useSRGBTriangle;
