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

    readBytesAs: string;//StreamReadType
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