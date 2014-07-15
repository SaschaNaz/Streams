declare class BlobStream {
    public blob: Blob;
    private indexInSlice;
    private slice;
    private sliceIndex;
    private sliceSize;
    public left: number;
    constructor(blob: Blob);
    private readNextSlice();
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
