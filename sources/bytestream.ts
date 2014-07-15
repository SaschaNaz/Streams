class _ByteStream implements ByteStream {
    _readableStream = new _ReadableStream();
    _writableStream = new _WritableStream();
    /*
    Data written in _writableStream should be piped to _readableStream. _ByteStream should implement this method.
    */
    constructor(public pullAmount: number, private type?: string) {
        
    }

    //ReadableStream
    read(): Promise<StreamReadResult>;
    pipe(destination: WritableStream): Promise<StreamReadResult>;
    fork(): ReadableStream;
    readAbort(reason: any): Promise<void>;

    readBytesAs: string;//StreamReadType
    readEncoding: string;

    readBytes(size?: number): Promise<StreamReadResult>;
    pipeBytes(destination: WritableStream, size?: number): Promise<StreamReadResult>;

    //WritableStream
    write(data: any, costOverride?: number): Promise<number>;
    awaitSpaceAvailable(): Promise<number>;
    writeClose(): Promise<void>;
    writeAbort(reason?: any): Promise<void>;

    writeEncoding: string;
}

var ByteStream: { prototype: ByteStream; new (pullAmount: number, type?: string): ByteStream } = _ByteStream;

class _ReadableStream implements ReadableStream {
    private _dataSource: Blob;//We only covers Blobs in this polyfill
    private _readBytesPullAmount = 0;
    private _pipePullAmount = 0;
    private _amountRequested = 0;
    private _amountBeingReturned = 0;
    private _readDataBuffer: number[] = [];
    private _splicedBinaryBuffer: number[] = [];

    read(): Promise<StreamReadResult>;
    pipe(destination: WritableStream): Promise<StreamReadResult>;
    fork(): ReadableStream {
        var branch = new _ByteStream(this.pullAmount, this.type);
        branch._dataSource = this._dataSource;
        branch._amountRequested = this._amountRequested;
        return branch;
    }
    readAbort(reason: any): Promise<void>;

    readBytesAs: string;//StreamReadType
    readEncoding: string;

    readBytes(size?: number): Promise<StreamReadResult>;
    pipeBytes(destination: WritableStream, size?: number): Promise<StreamReadResult>;
}

class _WritableStream implements WritableStream {
    private _pendingRead: PendingReadDescriptor = null;
    private _abortPromise: Promise<any> = null;
    //private _eofReached: 

    write(data: any, costOverride?: number): Promise<number>;
    awaitSpaceAvailable(): Promise<number>;
    writeClose(): Promise<void>;
    writeAbort(reason?: any): Promise<void>;

    writeEncoding: string;
}

interface PendingReadDescriptor {
    promise: Promise<any>;
    remaining: number;
    destination: WritableStream;
    bytesAs: string;
    encoding: string;
}