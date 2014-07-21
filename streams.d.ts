declare module Streams {
    /**
    Produces requested data and reattaches unconsumed data.
    */
    class BlobSourceBuffer {
        private _slicedCurrent;
        /** Countercurrent stack. Last unconsumed data would be pushed into here and later popped out first. */
        private _countercurrent;
        private _blob;
        /** Represents byte length of unsliced part. */
        private _leftCost;
        private _offsetWithinSlice;
        private _sliceSize;
        public eofReached : boolean;
        public byteOffset : number;
        constructor(blob: Blob);
        public produce(size: number): Promise<number[]>;
        /** Reattaches unconsumed data to _countercurrent. */
        public reattach(byteArray: number[]): void;
        /** Exports elements from countercurrent as much as possible. */
        private _exportCountercurrent(size);
        public seek(offset: number): Promise<void>;
        private _readNextSlice();
        private _readSlice(offset);
    }
}
declare module Streams {
    class BlobStream {
        private _readDataBuffer;
        private _pendingRead;
        private _eofReached;
        public byteOffset : number;
        public pullAmount: number;
        public readBytesAs: string;
        public readEncoding: string;
        constructor(blob: Blob);
        public read(): Promise<StreamReadResult<ArrayBuffer>>;
        public readBytes<T>(size?: number): Promise<StreamReadResult<T>>;
        private _readBytes<T>(size, bytesAs?);
        private _outputData<T>(byteArray);
    }
}
interface BlobStream extends Streams.BlobStream {
}
declare var BlobStream: typeof Streams.BlobStream;
interface WritableStream {
    write(data: any, costOverride?: number): Promise<number>;
    awaitSpaceAvailable(): Promise<number>;
    writeClose(): Promise<void>;
    writeAbort(reason?: any): Promise<void>;
    writeEncoding: string;
}
interface ReadableStream<T> {
    pullAmount: number;
    read(): Promise<StreamReadResult<T>>;
    pipe(destination: WritableStream): Promise<StreamReadResult<T>>;
    fork(): ReadableStream<T>;
    readAbort(reason: any): Promise<void>;
    readBytesAs: string;
    readEncoding: string;
    readBytes<T2>(size?: number): Promise<StreamReadResult<T2>>;
    pipeBytes<T2>(destination: WritableStream, size?: number): Promise<StreamReadResult<T2>>;
}
interface ByteStream extends WritableStream, ReadableStream<any> {
}
interface StreamReadResult<T> {
    eof: boolean;
    data: T;
    amountConsumed: number;
    error: any;
}
interface URL {
    createObjectURL(stream: ReadableStream<any>, type: string): string;
    createFor(stream: ReadableStream<any>, type: string): string;
}
declare module Streams {
    interface DecodingResult {
        text: any;
        byteLength: number;
    }
    class TextDecoder {
        static decode(byteArray: number[], encoding: string): DecodingResult;
        private static _decodeAsUtf8(byteArray);
        private static _decodeAsUtf16(byteArray);
        private static _decodeAsLatin1(byteArray);
    }
}
