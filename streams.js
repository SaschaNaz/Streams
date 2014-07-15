var BlobStream = (function () {
    function BlobStream(blob) {
        this.blob = blob;
        this.indexInSlice = 0;
        this.slice = new ArrayBuffer(0);
        this.sliceSize = 10240;
        this.left = blob.size;
    }
    //read(length = this.blob.size) {
    //}
    BlobStream.prototype.readNextSlice = function () {
        var _this = this;
        if (this.sliceIndex === undefined)
            this.sliceIndex = 0;
        else
            this.sliceIndex++;
        var start = this.sliceIndex * this.sliceSize;
        return new Promise(function (resolve, reject) {
            if (_this.left == 0)
                reject(new Error("No left input stream"));
            else {
                var reader = new FileReader();
                reader.onload = function (ev) {
                    _this.slice = ev.target.result;
                    _this.left -= blobSlice.size;
                    _this.indexInSlice = 0;
                    resolve(undefined);
                };
                var blobSlice;
                if (_this.left < _this.sliceSize)
                    blobSlice = _this.blob.slice(start, start + _this.left);
                else
                    blobSlice = _this.blob.slice(start, start + _this.sliceSize);
                reader.readAsArrayBuffer(blobSlice);
            }
        });
    };

    BlobStream.prototype.readLine = function () {
        var _this = this;
        var result = '';
        var view = new Uint8Array(this.slice);
        return new Promise(function (resolve, reject) {
            var asyncFunction = function () {
                var i = Array.prototype.indexOf.call(view, 0x0A, _this.indexInSlice);
                if (i == -1) {
                    if (_this.left) {
                        result += String.fromCharCode.apply(null, view.subarray(_this.indexInSlice));
                        _this.readNextSlice().then(function () {
                            i = 0;
                            view = new Uint8Array(_this.slice);
                            window.setImmediate(asyncFunction);
                        });
                    } else
                        resolve(null);
                } else {
                    result += String.fromCharCode.apply(null, view.subarray(_this.indexInSlice, i));
                    _this.indexInSlice = i + 1;
                    resolve(result);
                }
            };
            asyncFunction();
        });
    };

    BlobStream.prototype.readLines = function (oneach) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var asyncFunction = function () {
                _this.readLine().then(function (result) {
                    window.setImmediate(oneach, result);
                    if (_this.left > 0)
                        window.setImmediate(asyncFunction);
                    else
                        resolve(undefined);
                });
            };
            asyncFunction();
        });
    };
    return BlobStream;
})();
//class _ByteStream implements ByteStream {
//    _readableStream = new _ReadableStream();
//    _writableStream = new _WritableStream();
//    /*
//    Data written in _writableStream should be piped to _readableStream. _ByteStream should implement this method.
//    */
//    constructor(public pullAmount: number, private type?: string) {
//    }
//    //ReadableStream
//    read(): Promise<StreamReadResult>;
//    pipe(destination: WritableStream): Promise<StreamReadResult>;
//    fork(): ReadableStream;
//    readAbort(reason: any): Promise<void>;
//    readBytesAs: string;//StreamReadType
//    readEncoding: string;
//    readBytes(size?: number): Promise<StreamReadResult>;
//    pipeBytes(destination: WritableStream, size?: number): Promise<StreamReadResult>;
//    //WritableStream
//    write(data: any, costOverride?: number): Promise<number>;
//    awaitSpaceAvailable(): Promise<number>;
//    writeClose(): Promise<void>;
//    writeAbort(reason?: any): Promise<void>;
//    writeEncoding: string;
//}
//var ByteStream: { prototype: ByteStream; new (pullAmount: number, type?: string): ByteStream } = _ByteStream;
//class _ReadableStream implements ReadableStream {
//    private _dataSource: Blob;//We only covers Blobs in this polyfill
//    private _readBytesPullAmount = 0;
//    private _pipePullAmount = 0;
//    private _amountRequested = 0;
//    private _amountBeingReturned = 0;
//    private _readDataBuffer: number[] = [];
//    private _splicedBinaryBuffer: number[] = [];
//    read(): Promise<StreamReadResult>;
//    pipe(destination: WritableStream): Promise<StreamReadResult>;
//    fork(): ReadableStream {
//        var branch = new _ByteStream(this.pullAmount, this.type);
//        branch._dataSource = this._dataSource;
//        branch._amountRequested = this._amountRequested;
//        return branch;
//    }
//    readAbort(reason: any): Promise<void>;
//    readBytesAs: string;//StreamReadType
//    readEncoding: string;
//    readBytes(size?: number): Promise<StreamReadResult>;
//    pipeBytes(destination: WritableStream, size?: number): Promise<StreamReadResult>;
//}
//class _WritableStream implements WritableStream {
//    private _pendingRead: PendingReadDescriptor = null;
//    private _abortPromise: Promise<any> = null;
//    //private _eofReached:
//    write(data: any, costOverride?: number): Promise<number>;
//    awaitSpaceAvailable(): Promise<number>;
//    writeClose(): Promise<void>;
//    writeAbort(reason?: any): Promise<void>;
//    writeEncoding: string;
//}
//interface PendingReadDescriptor {
//    promise: Promise<any>;
//    remaining: number;
//    destination: WritableStream;
//    bytesAs: string;
//    encoding: string;
//}
//# sourceMappingURL=streams.js.map
