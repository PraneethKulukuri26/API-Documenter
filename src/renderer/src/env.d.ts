/// <reference types="electron-vite/node" />
/// <reference types="vite/client" />

export { }

declare global {
    interface Window {
        electronAPI: import('../../preload/index').ElectronAPI
    }
}

declare module "*.png" {
    const value: string;
    export default value;
}

declare module "*.jpg" {
    const value: string;
    export default value;
}
