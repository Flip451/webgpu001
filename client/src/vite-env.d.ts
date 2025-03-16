/// <reference types="vite/client" />

declare module '*.wgsl' {
  const content: string
  export default content
}

declare module 'react-dom/client' {
  export interface Root {
    render(children: React.ReactNode): void;
    unmount(): void;
  }
  export function createRoot(container: Element | null): Root;
}