export const getDevice = async (): Promise<GPUDevice> => {
  // device の取得{adapterは物理デバイス（物理的なGPU）、deviceは論理デバイス（抽象化したGPU）)
  const g_adapter = await navigator.gpu.requestAdapter();
  const g_device = await g_adapter?.requestDevice();

  if (!g_device) {
    throw new Error("no device");
  }

  return g_device;
}

export const configureContext = (context: GPUCanvasContext, device: GPUDevice) => {
  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
  context.configure({
    device,
    format: presentationFormat,
    alphaMode: 'premultiplied',
  });

  return { presentationFormat };
}