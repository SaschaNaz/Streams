declare class BlobStream {
    public blob: Blob;
    private _bufferOffset;
    private _buffer;
    private _bufferSliceIndex;
    private _left;
    public pullAmount: number;
    public readBytesAs: string;
    public readEncoding: string;
    constructor(blob: Blob);
    public read(): Promise<StreamReadResult>;
    public readBytes(length: number): Promise<StreamReadResult>;
    private _mergeArray(base, input);
    private _readNextSlice();
    public readLine(): Promise<string>;
    public readLines(oneach?: (result: string) => any): Promise<void>;
}
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
