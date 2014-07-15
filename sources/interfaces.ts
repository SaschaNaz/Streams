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

    readBytesAs: string;//StreamReadType
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