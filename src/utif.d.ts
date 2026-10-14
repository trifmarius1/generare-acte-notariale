declare module 'utif' {
  interface TiffPage {
    width: number;
    height: number;
  }

  const UTIF: {
    decode(buffer: ArrayBuffer): TiffPage[];
    decodeImage(buffer: ArrayBuffer, page: TiffPage): void;
    toRGBA8(page: TiffPage): Uint8Array;
  };

  export default UTIF;
}
