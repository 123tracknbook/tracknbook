// Type declarations for polyfill packages that lack @types definitions
declare module '@stardazed/streams-text-encoding' {
  export class TextEncoderStream {
    readonly readable: ReadableStream<Uint8Array>;
    readonly writable: WritableStream<string>;
  }
  export class TextDecoderStream {
    readonly readable: ReadableStream<string>;
    readonly writable: WritableStream<Uint8Array>;
  }
}

declare module '@ungap/structured-clone' {
  const structuredClone: <T>(value: T, options?: { transfer?: Transferable[] }) => T;
  export default structuredClone;
}
