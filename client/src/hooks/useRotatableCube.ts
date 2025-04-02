import { useCallback, useEffect, useRef, useState } from "react";
import { mat4, vec3 } from "wgpu-matrix";
import { configureContext, createAndSetIndexBuffer, createAndSetVertexBuffer, getDepthTexture, getDevice } from "../helpers/gpuUtils";
import bufferWithMatricesWGSL from "../shaders/bufferWithMatrices.wgsl?raw";
import queryKeys from "../config/queryKeys";
import { useQuery } from "@tanstack/react-query";

const getVertices = () => {
  const vertexSize = 4 * 8;  // Byte size of one vertex.
  const positionOffset = 4 * 0;
  const colorOffset = 4 * 4;  // Byte offset of vertex color.

  const black = [0.0, 0.0, 0.0, 1.0];
  const red = [1.0, 0.0, 0.0, 1.0];
  const green = [0.0, 1.0, 0.0, 1.0];
  const blue = [0.0, 0.0, 1.0, 1.0];
  const cyan = [0.0, 1.0, 1.0, 1.0];
  const magenta = [1.0, 0.0, 1.0, 1.0];
  const yellow = [1.0, 1.0, 0.0, 1.0];
  const white = [1.0, 1.0, 1.0, 1.0];

  // 変数名は頂点座標の符号を表す
  const ppp = [1.0, 1.0, 1.0, 1.0, ...black];
  const ppm = [1.0, 1.0, -1.0, 1.0, ...blue];
  const pmp = [1.0, -1.0, 1.0, 1.0, ...green];
  const pmm = [1.0, -1.0, -1.0, 1.0, ...cyan];
  const mpp = [-1.0, 1.0, 1.0, 1.0, ...red];
  const mpm = [-1.0, 1.0, -1.0, 1.0, ...magenta];
  const mmp = [-1.0, -1.0, 1.0, 1.0, ...yellow];
  const mmm = [-1.0, -1.0, -1.0, 1.0, ...white];

  const vertexArray = new Float32Array([
    ...ppp,  // 0
    ...ppm,  // 1
    ...pmp,  // 2
    ...pmm,  // 3
    ...mpp,  // 4
    ...mpm,  // 5
    ...mmp,  // 6
    ...mmm,  // 7
  ])

  const indexArray = new Uint16Array([
    // ppp 側
    0, 1, 2,
    2, 1, 3,
    0, 2, 4,
    4, 2, 6,
    0, 4, 1,
    1, 4, 5,
    // mmm 側
    5, 6, 7,
    4, 6, 5,
    3, 5, 7,
    1, 5, 3,
    6, 3, 7,
    2, 3, 6,
  ])

  return { vertexSize, vertexArray, positionOffset, colorOffset, indexArray, indexCount: indexArray.length }
}

const createPipeline = (presentationFormat: GPUTextureFormat, device: GPUDevice) => {
  const { vertexSize, vertexArray, positionOffset, colorOffset, indexArray, indexCount } = getVertices();

  const vertexBuffer = createAndSetVertexBuffer(device, vertexArray);
  const indexBuffer = createAndSetIndexBuffer(device, indexArray);

  const pipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: {
      module: device.createShaderModule({
        code: bufferWithMatricesWGSL,
      }),
      entryPoint: 'vs_main',
      buffers: [
        {
          arrayStride: vertexSize,
          attributes: [
            {
              // position
              shaderLocation: 0,
              offset: positionOffset,
              format: 'float32x4',
            },
            {
              // color
              shaderLocation: 1,
              offset: colorOffset,
              format: 'float32x4',
            },
          ],
        },
      ],
    },
    fragment: {
      module: device.createShaderModule({
        code: bufferWithMatricesWGSL,
      }),
      entryPoint: 'fs_main',
      targets: [
        // 0
        { // @location(0) in fragment shader
          format: presentationFormat,
        }
      ]
    },
    primitive: {
      topology: 'triangle-list',
    },
    depthStencil: {
      depthWriteEnabled: true,
      depthCompare: 'less',
      format: 'depth24plus',
    }
  })

  return { pipeline, vertexBuffer, indexBuffer, indexCount };
}

const useRotatableCube = (canvasRef: React.RefObject<HTMLCanvasElement>) => {
  const [message, setMessage] = useState<string>("stating...");
  const [theta, setTheta] = useState(0);
  const [phi, setPhi] = useState(0);
  const g_device = useRef<GPUDevice | null>(null);

  const getContext = useCallback(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      throw new Error("no canvas");
    }

    // webgpu コンテキストの取得
    const context = canvas.getContext("webgpu");

    if (!context) {
      throw new Error("no webgpu context");
    }

    return context;
  }, [])

  const loadDevice = useCallback(async () => {
    const device = await getDevice();
    g_device.current = device;
    return device;
  }, [])

  const initialize = useCallback(async () => {
    setMessage("initializing...");
    const context = getContext();
    const device = await loadDevice();
    const { presentationFormat } = configureContext(context, device);
    setMessage("initialized");

    return {
      context,
      presentationFormat,
    }
  }, [setMessage, getContext, loadDevice])

  const createAndSetTransformationMatrix = useCallback((uniformBuffer: GPUBuffer, device: GPUDevice, aspectRatio: number) => {
    const projectionMatrix = mat4.perspective((2 * Math.PI) / 5, aspectRatio, 1, 100.0);
    device.queue.writeBuffer(
      uniformBuffer,
      4 * 4 * 4 * 0,
      projectionMatrix.buffer,
      projectionMatrix.byteOffset,
      projectionMatrix.byteLength
    );

    const viewMatrix = mat4.translation([0, 0, -4]);
    device.queue.writeBuffer(
      uniformBuffer,
      4 * 4 * 4 * 1,
      viewMatrix.buffer,
      viewMatrix.byteOffset,
      viewMatrix.byteLength
    );

    const worldMatrix = mat4.identity();
    mat4.rotate(
      worldMatrix,
      vec3.fromValues(0, 1, 0),
      phi,
      worldMatrix,
    );
    mat4.rotate(
      worldMatrix,
      vec3.fromValues(Math.cos(phi), 0, Math.sin(phi)),
      theta,
      worldMatrix,
    );
    device.queue.writeBuffer(
      uniformBuffer,
      4 * 4 * 4 * 2,
      worldMatrix.buffer,
      worldMatrix.byteOffset,
      worldMatrix.byteLength
    );
  }, [theta, phi])

  const getUniformBufferBindGroup = useCallback((device: GPUDevice, pipeline: GPURenderPipeline, aspectRatio: number) => {
    const uniformBuffer = device.createBuffer({
      size: 4 * (4 * 4) * 3,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    createAndSetTransformationMatrix(uniformBuffer, device, aspectRatio);

    const bindGroup = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),  // @group(0) in wgsl
      entries: [
        {
          binding: 0,  // @binding(0) in wgsl
          resource: {
            buffer: uniformBuffer,
          },
        },
      ],
    });

    return bindGroup;
  }, [createAndSetTransformationMatrix])

  const { isLoading, data, error } = useQuery({
    queryKey: [queryKeys.rotatableCube],
    queryFn: initialize,
    gcTime: 0,
    staleTime: 0,
  })

  const render = useCallback((context: GPUCanvasContext, pipeline: GPURenderPipeline, vertexBuffer: GPUBuffer, indexBuffer: GPUBuffer, indexCount: number, uniformBufferBindGroup: GPUBindGroup) => {
    const device = g_device.current;

    if (!device) {
      throw new Error("no device");
    }

    const commandEncoder = device.createCommandEncoder();

    const depthTexture = getDepthTexture(device, context.canvas.width, context.canvas.height);

    const textureView = context.getCurrentTexture().createView();
    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          view: textureView,
          clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
      depthStencilAttachment: {
        view: depthTexture.createView(),
        depthClearValue: 1.0,
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
      }
    }
    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(pipeline);
    passEncoder.setBindGroup(0, uniformBufferBindGroup);
    passEncoder.setVertexBuffer(0, vertexBuffer);
    passEncoder.setIndexBuffer(indexBuffer, 'uint16');
    passEncoder.drawIndexed(indexCount);

    passEncoder.end();

    const commandBuffer = commandEncoder.finish();
    device.queue.submit([commandBuffer]);
  }, [])

  const frame = useCallback((context: GPUCanvasContext, presentationFormat: GPUTextureFormat, aspectRatio: number) => {
    const device = g_device.current;

    if (!device) {
      throw new Error("no device");
    }

    const { pipeline, vertexBuffer, indexBuffer, indexCount } = createPipeline(presentationFormat, device);
    const uniformBufferBindGroup = getUniformBufferBindGroup(device, pipeline, aspectRatio);
    render(context, pipeline, vertexBuffer, indexBuffer, indexCount, uniformBufferBindGroup);
  }, [render, createPipeline, getUniformBufferBindGroup])

  useEffect(() => {
    if (!data) {
      return;
    }

    const { context, presentationFormat } = data;
    const aspectRatio = context.canvas.width / context.canvas.height;

    setMessage("started");

    let animationFrameId: number;
    const animationFrame = () => {
      try {
        frame(context, presentationFormat, aspectRatio);
        animationFrameId = requestAnimationFrame(animationFrame);
      } catch (error) {
        console.error(error);
        cancelAnimationFrame(animationFrameId);
        setMessage("Error occurred in animation frame");
      }
    }

    animationFrame();

    return () => {
      cancelAnimationFrame(animationFrameId);
      setMessage("stopped");
    }
  }, [frame, data])

  useEffect(() => {
    if (error) {
      setMessage(error.message);
    }
  }, [error]);

  return {
    isLoading,
    message,
    theta,
    phi,
    setTheta,
    setPhi,
  }
}

export default useRotatableCube;