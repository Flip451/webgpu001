import { useCallback, useEffect, useRef, useState } from "react";
import triangleWGSL from "../shaders/triangle.wgsl?raw";
import queryKeys from "../config/queryKeys";
import { useQuery } from "@tanstack/react-query";

const useTriangleMSAA = (canvasRef: React.RefObject<HTMLCanvasElement>) => {
  const [message, setMessage] = useState<string>("starting...");
  const g_device = useRef<GPUDevice | null>(null);

  const initialize = useCallback(async () => {
    const canvas = canvasRef.current;

    if (!canvas) {
      throw new Error("no canvas");
    };

    // webgpu コンテキストの取得
    const context = canvas.getContext("webgpu");

    if (!context) {
      throw new Error("no webgpu context");
    }

    // device の取得{adapterは物理デバイス（物理的なGPU）、deviceは論理デバイス（抽象化したGPU）)
    const g_adapter = await navigator.gpu.requestAdapter();
    const g_device_tmp = await g_adapter?.requestDevice();

    if (!g_device_tmp) {
      throw new Error("no device");
    }

    g_device.current = g_device_tmp;

    // context の設定
    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
      device: g_device.current,
      format: presentationFormat,
      alphaMode: 'premultiplied',
    });

    // RenderPipeline の設定
    // 詳細は https://zenn.dev/emadurandal/books/cb6818fd3a1b2e/viewer/hello_triangle#renderpipeline%E3%81%AE%E8%A8%AD%E5%AE%9A を参照
    const pipeline = g_device.current.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module: g_device.current.createShaderModule({
          code: triangleWGSL,
        }),
        entryPoint: 'vs_main',
      },
      fragment: {
        module: g_device.current.createShaderModule({
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

    return {
      context,
      pipeline,
    }
  }, [])

  const { isLoading, data, error } = useQuery({
    queryKey: [queryKeys.triangleMSAA],
    queryFn: initialize,
    // コンポーネントがアンマウントされた後にキャッシュを無効化
    gcTime: 0,
    // ページ再訪問時に再フェッチを強制
    staleTime: 0
  })

  const frame = useCallback((context: GPUCanvasContext, pipeline: GPURenderPipeline) => {
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
            a: 1.0,
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

    g_device_unwrapped.queue.submit([commandEncoder.finish()]);
  }, [])

  useEffect(() => {
    if (!data) {
      return;
    }

    const { context, pipeline } = data;
    setMessage("started");

    let animationFrameId: number;
    const animationFrame = () => {
      try {
        frame(context, pipeline);
        animationFrameId = requestAnimationFrame(animationFrame);
      } catch(error) {
        console.error(error);
        cancelAnimationFrame(animationFrameId);
        setMessage("Error occurred in animation frame");
      }
    }

    animationFrame();

    return () => {
      cancelAnimationFrame(animationFrameId);

      if (g_device.current) {
        g_device.current.destroy();
        g_device.current = null;
      }

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
  }
};

export default useTriangleMSAA;