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
        public eofReached: boolean;
        constructor(blob: Blob);
        public produce(size: number): Promise<number[]>;
        /** Attaches unconsumed data to _countercurrent. */
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
