declare module Streams {
    class BlobStream {
        private _dataBufferOffset;
        private _readDataBuffer;
        private _splicedBinaryBuffer;
        private _leftCost;
        private _pendingRead;
        private _eofReached;
        public pullAmount: number;
        public readBytesAs: string;
        public readEncoding: string;
        constructor(blob: Blob);
        public read(): Promise<StreamReadResult>;
        public readBytes(size?: number): Promise<StreamReadResult>;
        private _mergeArray(base, input);
        private _outputData(byteArray, amountConsumed);
        private _readNextSlice();
        public readLine(): Promise<string>;
        public readLines(oneach?: (result: string) => any): Promise<void>;
    }
}
declare var BlobStream: typeof Streams.BlobStream;
interface WritableStream {
    write(data: any, costOverride?: number): Promise<number>;
    awaitSpaceAvailable(): Promise<number>;
    writeClose(): Promise<void>;
    writeAbort(reason?: any): Promise<void>;
    writeEncoding: string;
}
interface ReadableStream {
    pullAmount: number;
    read(): Promise<StreamReadResult>;
    pipe(destination: WritableStream): Promise<StreamReadResult>;
    fork(): ReadableStream;
    readAbort(reason: any): Promise<void>;
    readBytesAs: string;
    readEncoding: string;
    readBytes(size?: number): Promise<StreamReadResult>;
    pipeBytes(destination: WritableStream, size?: number): Promise<StreamReadResult>;
}
interface ByteStream extends WritableStream, ReadableStream {
}
interface StreamReadResult {
    eof: boolean;
    data: any;
    amountConsumed: number;
    error: any;
}
interface URL {
    createObjectURL(stream: ReadableStream, type: string): string;
    createFor(stream: ReadableStream, type: string): string;
}
declare module Streams {
    interface DecodingResult {
        data: any;
        byteLength: number;
    }
    class TextDecoder {
        static decodeAsUtf8(byteArray: number[]): DecodingResult;
        static decodeAsUtf16(byteArray: number[]): DecodingResult;
        private static _readAsUint16(byteArray);
        private static _readAsUintArbitrary(byteArray, bytes);
    }
}
