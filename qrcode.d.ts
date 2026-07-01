// Minimal ambient types for the `qrcode` package (browser build), used by the
// patient 2FA setup screen to render the otpauth QR as an SVG string. The
// package ships no .d.ts, so we declare only what we call.
declare module 'qrcode' {
  interface QRCodeToStringOptions {
    type?: 'svg' | 'utf8' | 'terminal';
    margin?: number;
    width?: number;
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    color?: { dark?: string; light?: string };
  }

  export function toString(
    text: string,
    options?: QRCodeToStringOptions,
  ): Promise<string>;

  const _default: { toString: typeof toString };
  export default _default;
}
