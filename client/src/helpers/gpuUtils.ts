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

export const getDepthTexture = (device: GPUDevice, canvasWidth: number, canvasHeight: number) => {
  const depthTexture = device.createTexture({
    size: [canvasWidth, canvasHeight],
    format: 'depth24plus',
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  })

  return depthTexture;
}

export const createAndSetVertexBuffer = (device: GPUDevice, vertexArray: Float32Array) => {
  const vertexBuffer = device.createBuffer({
    size: vertexArray.byteLength,
    usage: GPUBufferUsage.VERTEX,
    mappedAtCreation: true,
  })

  new Float32Array(vertexBuffer.getMappedRange()).set(vertexArray);
  vertexBuffer.unmap();

  return vertexBuffer;
}

export const createAndSetIndexBuffer = (device: GPUDevice, indexArray: Uint16Array) => {
  const indexBuffer = device.createBuffer({
    size: indexArray.byteLength,
    usage: GPUBufferUsage.INDEX,
    mappedAtCreation: true,
  });

  new Uint16Array(indexBuffer.getMappedRange()).set(indexArray);
  indexBuffer.unmap();

  return indexBuffer;
}

export const createMsaaTexture = (device: GPUDevice, canvasWidth: number, canvasHeight: number, sampleCount: number, presentationFormat: GPUTextureFormat) => {
  return device.createTexture({
    size: [canvasWidth, canvasHeight],
    sampleCount,
    format: presentationFormat,
    usage: GPUTextureUsage.RENDER_ATTACHMENT,
  })
}

export const createJpegTexture = async (device: GPUDevice, jpeg: HTMLImageElement) => {
  await jpeg.decode();
  const imageBitmap = await createImageBitmap(jpeg);

  const texture = device.createTexture({
    size: [imageBitmap.width, imageBitmap.height, 1],
    format: 'rgba8unorm',
    usage:
      GPUTextureUsage.TEXTURE_BINDING |
      GPUTextureUsage.COPY_DST |
      GPUTextureUsage.RENDER_ATTACHMENT
  });

  device.queue.copyExternalImageToTexture(
    { source: imageBitmap },
    { texture },
    [imageBitmap.width, imageBitmap.height]
  );

  return texture;
}

export const createLinearSampler = (device: GPUDevice) => {
  return device.createSampler({
    magFilter: 'linear',
    minFilter: 'linear',
  });
}