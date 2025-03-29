import { useCallback, useEffect, useRef, useState } from "react";
import bufferWGSL from "../shaders/buffer.wgsl?raw";
import queryKeys from "../config/queryKeys";
import { useQuery } from "@tanstack/react-query";

export type Color = {
  r: number;
  g: number;
  b: number;
  a: number;
}

type BundledColors = {
  leftTopColor: Color;
  rightTopColor: Color;
  leftBottomColor: Color;
  rightBottomColor: Color;
}

const bundleColors = (leftTopColor: Color, rightTopColor: Color, leftBottomColor: Color, rightBottomColor: Color): BundledColors => {
  return {
    leftTopColor,
    rightTopColor,
    leftBottomColor,
    rightBottomColor,
  }
}
const colorIntoNormalizedArray = (color: Color) => {
  const rNormalized = color.r / 255.0;
  const gNormalized = color.g / 255.0;
  const bNormalized = color.b / 255.0;
  const aNormalized = color.a / 255.0;
  return [rNormalized, gNormalized, bNormalized, aNormalized];
}

const getVertices = (colors: BundledColors) => {
  const vertexSize = 4 * 8;  // Byte size of one rectangle vertex.
  const positionOffset = 0;
  const colorOffset = 4 * 4;  // Byte offset of vertex color.
  const vertexCount = 3 * 2;  // 3 vertices * 2 triangles

  const leftTop = [-0.5, 0.5, 0.0, 1.0, ...colorIntoNormalizedArray(colors.leftTopColor)];
  const rightTop = [0.5, 0.5, 0.0, 1.0, ...colorIntoNormalizedArray(colors.rightTopColor)];
  const leftBottom = [-0.5, -0.5, 0.0, 1.0, ...colorIntoNormalizedArray(colors.leftBottomColor)];
  const rightBottom = [0.5, -0.5, 0.0, 1.0, ...colorIntoNormalizedArray(colors.rightBottomColor)];

  const vertexArray = new Float32Array([
    ...leftTop,
    ...leftBottom,
    ...rightTop,
    ...rightBottom,
  ])

  const indexArray = new Uint16Array([
    0, 1, 3,
    0, 3, 2,
  ])

  return { vertexSize, vertexCount, vertexArray, positionOffset, colorOffset, indexArray, indexCount: indexArray.length }
}

const useColorfulRectangle = (canvasRef: React.RefObject<HTMLCanvasElement>) => {
  const [leftTopColor, setLeftTopColor] = useState<Color>({ r: 0.0, g: 0.0, b: 0.0, a: 255.0 });
  const [rightTopColor, setRightTopColor] = useState<Color>({ r: 0.0, g: 0.0, b: 0.0, a: 255.0 });
  const [leftBottomColor, setLeftBottomColor] = useState<Color>({ r: 0.0, g: 0.0, b: 0.0, a: 255.0 });
  const [rightBottomColor, setRightBottomColor] = useState<Color>({ r: 0.0, g: 0.0, b: 0.0, a: 255.0 });
  const [message, setMessage] = useState<string>("starting...");
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
    // device の取得{adapterは物理デバイス（物理的なGPU）、deviceは論理デバイス（抽象化したGPU）)
    const g_adapter = await navigator.gpu.requestAdapter();
    const g_device_tmp = await g_adapter?.requestDevice();

    if (!g_device_tmp) {
      throw new Error("no device");
    }

    g_device.current = g_device_tmp;

    return g_device.current;
  }, [])

  const configureContext = useCallback((context: GPUCanvasContext, device: GPUDevice) => {
    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
      device,
      format: presentationFormat,
      alphaMode: 'premultiplied',
    });

    return { presentationFormat };
  }, [])

  const initialize = useCallback(async () => {
    const context = getContext();
    const device = await loadDevice();
    const { presentationFormat } = configureContext(context, device);

    return {
      context,
      presentationFormat,
    }
  }, [getContext])

  const createPipeline = useCallback((presentationFormat: GPUTextureFormat, colors: BundledColors) => {
    const device = g_device.current;

    if (!device) {
      throw new Error("no device: you must call loadDevice() first");
    }

    const { vertexSize, vertexArray, positionOffset, colorOffset, indexArray, indexCount } = getVertices(colors);
    // 頂点バッファの作成
    const vertexBuffer = device.createBuffer({
      size: vertexArray.byteLength,
      usage: GPUBufferUsage.VERTEX,
      mappedAtCreation: true,
    });

    new Float32Array(vertexBuffer.getMappedRange()).set(vertexArray);
    vertexBuffer.unmap();

    const indexBuffer = device.createBuffer({
      size: indexArray.byteLength,
      usage: GPUBufferUsage.INDEX,
      mappedAtCreation: true,
    });

    new Uint16Array(indexBuffer.getMappedRange()).set(indexArray);
    indexBuffer.unmap();

    // RenderPipeline の設定
    // 詳細は https://zenn.dev/emadurandal/books/cb6818fd3a1b2e/viewer/hello_triangle#renderpipeline%E3%81%AE%E8%A8%AD%E5%AE%9A を参照
    const pipeline = device.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module: device.createShaderModule({
          code: bufferWGSL,
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
          code: bufferWGSL,
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
      }
    })

    return { pipeline, vertexBuffer, indexBuffer, indexCount };
  }, [])

  const { isLoading, data, error } = useQuery({
    queryKey: [queryKeys.srgbRectangle],
    queryFn: initialize,
    // コンポーネントがアンマウントされた後にキャッシュを無効化
    gcTime: 0,
    // ページ再訪問時に再フェッチを強制
    staleTime: 0
  })

  const render = useCallback((context: GPUCanvasContext, pipeline: GPURenderPipeline, vertexBuffer: GPUBuffer, indexBuffer: GPUBuffer, indexCount: number) => {
    const g_device_unwrapped = g_device.current;

    if (!g_device_unwrapped) {
      throw new Error("no device");
    }

    const commandEncoder = g_device_unwrapped.createCommandEncoder();

    const textureView = context.getCurrentTexture().createView();
    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          view: textureView,
          clearValue: {
            r: 0.0,
            g: 0.0,
            b: 0.0,
            a: 0.0,
          },
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
    };
    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(pipeline);
    passEncoder.setVertexBuffer(0, vertexBuffer)
    passEncoder.setIndexBuffer(indexBuffer, 'uint16')
    // param vertexCount - 描画する頂点の数．
    // param instanceCount - 描画するインスタンスの数．
    // param firstVertex - 描画を開始する頂点バッファ内のオフセット（頂点単位）．
    // param firstInstance - 描画する最初のインスタンス．
    passEncoder.drawIndexed(indexCount);

    passEncoder.end();

    g_device_unwrapped.queue.submit([commandEncoder.finish()]);
  }, [])

  const frame = useCallback((context: GPUCanvasContext, presentationFormat: GPUTextureFormat) => {
    const { pipeline, vertexBuffer, indexBuffer, indexCount } = createPipeline(presentationFormat, bundleColors(leftTopColor, rightTopColor, leftBottomColor, rightBottomColor));
    render(context, pipeline, vertexBuffer, indexBuffer, indexCount);
  }, [render, leftTopColor, rightTopColor, leftBottomColor, rightBottomColor])

  useEffect(() => {
    if (!data) {
      return;
    }

    const { context, presentationFormat } = data;
    setMessage("started");

    let animationFrameId: number;
    const animationFrame = () => {
      try {
        frame(context, presentationFormat)
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
  }, [frame, data]);

  useEffect(() => {
    if (error) {
      setMessage(error.message);
    }
  }, [error]);

  return {
    isLoading,
    message,
    leftTopColor,
    setLeftTopColor,
    rightTopColor,
    setRightTopColor,
    leftBottomColor,
    setLeftBottomColor,
    rightBottomColor,
    setRightBottomColor,
  }
};

export default useColorfulRectangle;