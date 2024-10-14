declare module 'crypto-browserify';
declare module 'stream-browserify';
declare module 'browserify-zlib';
declare module 'https-browserify';
declare module 'stream-http';

interface BigInt {
  toJSON(): string;
}