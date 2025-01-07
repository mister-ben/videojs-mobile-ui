// eslint-disable-next-line no-undef
export const window = typeof globalThis !== 'undefined' ? globalThis : undefined;

export const document = typeof window !== 'undefined' ? window.document : undefined;
