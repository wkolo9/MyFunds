// Polyfill MessageChannel for Cloudflare Workers if missing
if (typeof globalThis.MessageChannel === "undefined") {
  // @ts-ignore - Minimal polyfill for environment compatibility
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  globalThis.MessageChannel = class MessageChannel {
    port1: MessagePort;
    port2: MessagePort;
    constructor() {
      // Mock ports with minimal necessary API
      const createPort = () => ({
        onmessage: null,
        onmessageerror: null,
        postMessage: () => {
          // No-op for mock
        },
        start: () => {
          // No-op for mock
        },
        close: () => {
          // No-op for mock
        },
        addEventListener: () => {
          // No-op for mock
        },
        removeEventListener: () => {
          // No-op for mock
        },
        dispatchEvent: () => true,
      });
      // @ts-ignore - Mocking internal types
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      this.port1 = createPort();
      // @ts-ignore - Mocking internal types
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      this.port2 = createPort();
    }
  };
}
