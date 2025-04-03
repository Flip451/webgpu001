import { useCallback, useEffect, useRef, useState } from "react";
import triangleWGSL from "../shaders/triangle.wgsl?raw";
import queryKeys from "../config/queryKeys";
import { useQuery } from "@tanstack/react-query";
import { configureContext, getDevice } from "../helpers/gpuUtils";


// RenderPipeline の設定
// 詳細は https://zenn.dev/emadurandal/books/cb6818fd3a1b2e/viewer/hello_triangle#renderpipeline%E3%81%AE%E8%A8%AD%E5%AE%9A を参照
const createPipeline = (device: GPUDevice, presentationFormat: GPUTextureFormat) => {
  const pipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: {
      module: device.createShaderModule({
        code: triangleWGSL,
      }),
      entryPoint: 'vs_main',
    },
    fragment: {
      module: device.createShaderModule({
        code: triangleWGSL,
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

  return pipeline;
}

const useRedTriangle = (canvasRef: React.RefObject<HTMLCanvasElement>) => {
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
    const device = await getDevice();
    g_device.current = device;
    return device;
  }, [])

  const initialize = useCallback(async () => {
    setMessage("initializing...");
    const context = getContext();
    const device = await loadDevice();
    setMessage("initialized");

    // context の設定
    const { presentationFormat } = configureContext(context, device);

    return {
      context,
      presentationFormat,
    }
  }, [setMessage, getContext, loadDevice])

  const { isLoading, data, error } = useQuery({
    queryKey: [queryKeys.redTriangle],
    queryFn: initialize,
    // コンポーネントがアンマウントされた後にキャッシュを無効化
    gcTime: 0,
    // ページ再訪問時に再フェッチを強制
    staleTime: 0
  })

  const render = useCallback((context: GPUCanvasContext, pipeline: GPURenderPipeline) => {
    const device = g_device.current;

    if (!device) {
      throw new Error("no device");
    }

    const commandEncoder = device.createCommandEncoder();

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

    // param vertexCount - 描画する頂点の数．
    // param instanceCount - 描画するインスタンスの数．
    // param firstVertex - 描画を開始する頂点バッファ内のオフセット（頂点単位）．
    // param firstInstance - 描画する最初のインスタンス．
    passEncoder.draw(3, 1, 0, 0);

    passEncoder.end();

    device.queue.submit([commandEncoder.finish()]);
  }, [])

  useEffect(() => {
    if (!data) {
      return;
    }

    if (!g_device.current) {
      throw new Error("no device");
    }

    const { context, presentationFormat } = data;
    setMessage("started");

    const pipeline = createPipeline(g_device.current, presentationFormat);

    let animationFrameId: number;
    const animationFrame = () => {
      try {
        render(context, pipeline);
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
  }, [render, data]);

  useEffect(() => {
    if (error) {
      setMessage(error.message);
    }
  }, [error]);

  return {
    isLoading,
    message,
  }
};

export default useRedTriangle;