import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import queryKeys from "../config/queryKeys";
import bufferWithMatricesAndTextureWGSL from "../shaders/bufferWithMatricesAndTexture.wgsl?raw";
import { configureContext, createAndSetIndexBuffer, createAndSetVertexBuffer, createJpegTexture, createLinearSampler, getDepthTexture, getDevice } from "../helpers/gpuUtils";
import { mat4, vec3 } from "wgpu-matrix";

interface VerticesInfo {
  vertexSize: number,
  vertexArray: Float32Array,
  positionOffset: number,
  colorOffset: number,
  indexArray: Uint16Array,
  indexCount: number,
  uvOffset: number,
}

const getVertices = (): VerticesInfo => {
  const vertexSize = 4 * 10;  // 一つの頂点のバイトサイズ
  const positionOffset = 4 * 0;
  const colorOffset = 4 * 4;  // 頂点の色のバイトオフセット
  const uvOffset = 4 * 8;  // 頂点のuv座標のバイトオフセット

  // 頂点の色
  const black = [0.0, 0.0, 0.0, 1.0];
  const red = [1.0, 0.0, 0.0, 1.0];
  const green = [0.0, 1.0, 0.0, 1.0];
  const blue = [0.0, 0.0, 1.0, 1.0];
  const cyan = [0.0, 1.0, 1.0, 1.0];
  const magenta = [1.0, 0.0, 1.0, 1.0];
  const yellow = [1.0, 1.0, 0.0, 1.0];
  const white = [1.0, 1.0, 1.0, 1.0];

  // 頂点のuv座標
  const rightTop = [1.0, 1.0];
  const rightBottom = [1.0, 0.0];
  const leftTop = [0.0, 1.0];
  const leftBottom = [0.0, 0.0];

  // 変数名は頂点座標の符号を表す
  const ppp = [1.0, 1.0, 1.0, 1.0, ...black];
  const ppm = [1.0, 1.0, -1.0, 1.0, ...blue];
  const pmp = [1.0, -1.0, 1.0, 1.0, ...green];
  const pmm = [1.0, -1.0, -1.0, 1.0, ...cyan];
  const mpp = [-1.0, 1.0, 1.0, 1.0, ...red];
  const mpm = [-1.0, 1.0, -1.0, 1.0, ...magenta];
  const mmp = [-1.0, -1.0, 1.0, 1.0, ...yellow];
  const mmm = [-1.0, -1.0, -1.0, 1.0, ...white];

  const facePlusX = [
    ...ppp, ...leftTop,
    ...ppm, ...rightTop,
    ...pmp, ...leftBottom,
    ...pmm, ...rightBottom,
  ];
  const facePlusZ = [
    ...ppp, ...leftTop,
    ...pmp, ...rightTop,
    ...mpp, ...leftBottom,
    ...mmp, ...rightBottom,
  ];
  const facePlusY = [
    ...ppp, ...leftTop,
    ...mpp, ...rightTop,
    ...ppm, ...leftBottom,
    ...mpm, ...rightBottom,
  ];
  const faceMinusX = [
    ...mmm, ...leftTop,
    ...mmp, ...rightTop,
    ...mpm, ...leftBottom,
    ...mpp, ...rightBottom,
  ];
  const faceMinusZ = [
    ...mmm, ...leftTop,
    ...mpm, ...rightTop,
    ...pmm, ...leftBottom,
    ...ppm, ...rightBottom,
  ];
  const faceMinusY = [
    ...mmm, ...leftTop,
    ...pmm, ...rightTop,
    ...mmp, ...leftBottom,
    ...pmp, ...rightBottom,
  ];

  const vertexArray = new Float32Array([
    ...facePlusX,
    ...facePlusZ,
    ...facePlusY,
    ...faceMinusX,
    ...faceMinusZ,
    ...faceMinusY,
  ]);

  const indexArray = new Uint16Array([
    // ppp 側
    // facePlusX
    0, 1, 2,
    2, 1, 3,
    // facePlusZ
    4, 5, 6,
    6, 5, 7,
    // facePlusY
    8, 9, 10,
    10, 9, 11,
    // mmm 側
    // faceMinusX
    12, 13, 14,
    14, 13, 15,
    // faceMinusZ
    16, 17, 18,
    18, 17, 19,
    // faceMinusY
    20, 21, 22,
    22, 21, 23,
  ]);

  return { vertexSize, vertexArray, positionOffset, colorOffset, indexArray, indexCount: indexArray.length, uvOffset };
}

const createPipeline = (device: GPUDevice, verticesInfo: VerticesInfo, presentationFormat: GPUTextureFormat, isDepthEnabled: boolean): GPURenderPipeline => {
  const { vertexSize, positionOffset, colorOffset, uvOffset } = verticesInfo;

  const pipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: {
      module: device.createShaderModule({
        code: bufferWithMatricesAndTextureWGSL,
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
            {
              // uv
              shaderLocation: 2,
              offset: uvOffset,
              format: 'float32x2',
            },
          ],
        },
      ],
    },
    fragment: {
      module: device.createShaderModule({
        code: bufferWithMatricesAndTextureWGSL,
      }),
      entryPoint: 'fs_main',
      targets: [
        // 0
        { // @location(0) in fragment shader
          format: presentationFormat,
          blend: {
            color: {
              srcFactor: 'src-alpha',
              dstFactor: 'one',
              operation: 'add',
            },
            alpha: {
              srcFactor: 'zero',
              dstFactor: 'one',
              operation: 'add',
            },
          }
        }
      ]
    },
    primitive: {
      topology: 'triangle-list',
    },
    depthStencil: isDepthEnabled ? {
      depthWriteEnabled: true,
      depthCompare: 'less',
      format: 'depth24plus',
    } : undefined
  })

  return pipeline
}

export default function useTextureCube(canvasRef: React.RefObject<HTMLCanvasElement>) {
  const [message, setMessage] = useState("not started");
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

    setMessage("start loading image");
    const img = document.createElement('img');
    img.crossOrigin = 'Anonymous';
    img.src = 'https://storage.googleapis.com/emadurandal-3d-public.appspot.com/images/pexels-james-wheeler-1552212.jpg';
    const texture = await createJpegTexture(device, img);

    return {
      context,
      device,
      texture,
      presentationFormat,
    }
  }, [setMessage, getContext, loadDevice]);

  const createAndSetTransformationMatrix = useCallback((device: GPUDevice, uniformBuffer: GPUBuffer, aspectRatio: number) => {
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
    const now = Date.now() / 1000;
    const phi = now;
    const theta = now / 5;
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
  }, [])

  const getUniformBufferBindGroup = useCallback((device: GPUDevice, pipeline: GPURenderPipeline, texture: GPUTexture, sampler: GPUSampler, aspectRatio: number) => {
    const uniformBuffer = device.createBuffer({
      size: 4 * (4 * 4) * 3,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    createAndSetTransformationMatrix(device, uniformBuffer, aspectRatio);

    const bindGroup = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),  // @group(0) in wgsl
      entries: [
        {
          binding: 0,  // @binding(0) in wgsl
          resource: {
            buffer: uniformBuffer,
          },
        },
        {
          binding: 1,
          resource: texture.createView(),
        },
        {
          binding: 2,
          resource: sampler,
        }
      ],
    });

    return bindGroup;
  }, [createAndSetTransformationMatrix])

  const { isLoading, data, error } = useQuery({
    queryKey: [queryKeys.textureCube],
    queryFn: initialize,
    gcTime: 0,
    staleTime: 0,
  });

  const render = useCallback((device: GPUDevice, context: GPUCanvasContext, pipeline: GPURenderPipeline, vertexBuffer: GPUBuffer, indexBuffer: GPUBuffer, indexCount: number, uniformBufferBindGroup: GPUBindGroup) => {
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

  const frame = useCallback((
    context: GPUCanvasContext,
    pipeline: GPURenderPipeline,
    texture: GPUTexture,
    sampler: GPUSampler,
    vertexBuffer: GPUBuffer,
    indexBuffer: GPUBuffer,
    indexCount: number,
    aspectRatio: number,
  ) => {
    const device = g_device.current;

    if (!device) {
      throw new Error("no device");
    }

    const uniformBufferBindGroup = getUniformBufferBindGroup(device, pipeline, texture, sampler, aspectRatio);
    render(device, context, pipeline, vertexBuffer, indexBuffer, indexCount, uniformBufferBindGroup);
  }, [render, getUniformBufferBindGroup])

  useEffect(() => {
    if (!data) {
      return;
    }

    const { context, device, texture, presentationFormat } = data;
    const aspectRatio = context.canvas.width / context.canvas.height;

    setMessage("started");

    const verticesInfo = getVertices();
    const { vertexArray, indexArray, indexCount } = verticesInfo;

    const vertexBuffer = createAndSetVertexBuffer(device, vertexArray);
    const indexBuffer = createAndSetIndexBuffer(device, indexArray);
    const pipeline = createPipeline(device, verticesInfo, presentationFormat, true);
    const sampler = createLinearSampler(device);

    let animationFrameId: number;
    const animationFrame = () => {
      try {
        frame(context, pipeline, texture, sampler, vertexBuffer, indexBuffer, indexCount, aspectRatio);
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
  }, [data, frame, setMessage])

  useEffect(() => {
    if (error) {
      setMessage("Error occurred in initialization");
    }
  }, [error, setMessage])

  return { isLoading, message };
}
