class ByteStream implements ReadableStream, WritableStream {
    constructor(pullAmount: number, type?: string) {
        
    }

    fork(): ReadableStream {
        var branch: ReadableStream;

    }
}

class _ReadableStream implements ReadableStream {
    private _dataSource: Blob;//We only covers Blobs in this polyfill
    private _readBytesPullAmount = 0;
    private _pipePullAmount = 0;
    private _amountRequested = 0;
    private _amountBeingReturned = 0;
    private _readDataBuffer: number[] = [];
    private _splicedBinaryBuffer: number[] = [];
    

    pullAmount: number;

    read(): Promise<StreamReadResult> {
    }
    pipe(destination: WritableStream): Promise<StreamReadResult> {
    }
    fork(): ReadableStream {
        var branch = new _ReadableStream();
        branch._dataSource = this._dataSource;
        branch._amountRequested = this._amountRequested;
    }
    readAbort(reason: any): Promise<void> {
    }

    readBytesAs: string;//StreamReadType
    readEncoding: string;

    readBytes(size?: number): Promise<StreamReadResult> {
    }
    pipeBytes(destination: WritableStream, size?: number): Promise<StreamReadResult> {
    }
}

class _WriteableStream implements WritableStream {
}