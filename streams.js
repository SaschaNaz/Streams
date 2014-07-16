var BlobStream = (function () {
    function BlobStream(blob) {
        this.blob = blob;
        this._bufferOffset = 0;
        this._buffer = new ArrayBuffer(0);
        this.pullAmount = 1024 * 1024 * 10;
        this.readBytesAs = "arraybuffer";
        this._left = blob.size;
    }
    BlobStream.prototype.read = function () {
        var leftInBuffer = this._buffer.byteLength - this._bufferOffset;
        if (leftInBuffer * 2 >= this.pullAmount)
            return this.readBytes(leftInBuffer);
        else
            return this.readBytes(leftInBuffer + this.pullAmount);
    };

    BlobStream.prototype.readBytes = function (length) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var byteArray = [];
            var pending = length;
            var asyncOperation = function () {
                var sliceLength = Math.min(pending, _this._buffer.byteLength - _this._bufferOffset);
                if (sliceLength > 0) {
                    var slice = new Uint8Array(_this._buffer, _this._bufferOffset, length);
                    _this._mergeArray(byteArray, Array.prototype.map.call(slice, function (n) {
                        return n;
                    }));
                    pending -= sliceLength;
                    _this._bufferOffset += slice.length;
                }
                ;

                if (pending > 0)
                    _this._readNextSlice().then(asyncOperation, function () {
                        return resolve(returnBytes(true));
                    }); // no more slices are there
                else
                    resolve(returnBytes(false));
            };
            var returnBytes = function (eof) {
                return {
                    amountConsumed: length - pending,
                    data: new Uint8Array(byteArray).buffer,
                    eof: eof,
                    error: null
                };
            };
            asyncOperation();
        });
    };

    BlobStream.prototype._mergeArray = function (base, input) {
        Array.prototype.push.apply(base, input);
    };

    BlobStream.prototype._readNextSlice = function () {
        var _this = this;
        if (this._bufferSliceIndex === undefined)
            this._bufferSliceIndex = 0;
        else
            this._bufferSliceIndex++;
        var start = this._bufferSliceIndex * this.pullAmount;
        return new Promise(function (resolve, reject) {
            if (_this._left == 0)
                reject(new Error("No left input stream"));
            else {
                var reader = new FileReader();
                reader.onload = function (ev) {
                    _this._buffer = ev.target.result;
                    _this._left -= blobSlice.size;
                    _this._bufferOffset = 0;
                    resolve(undefined);
                };
                var blobSlice;
                if (_this._left < _this.pullAmount)
                    blobSlice = _this.blob.slice(start, start + _this._left);
                else
                    blobSlice = _this.blob.slice(start, start + _this.pullAmount);
                reader.readAsArrayBuffer(blobSlice);
            }
        });
    };

    BlobStream.prototype.readLine = function () {
        var _this = this;
        var result = '';
        var view = new Uint8Array(this._buffer);
        return new Promise(function (resolve, reject) {
            var asyncFunction = function () {
                var i = Array.prototype.indexOf.call(view, 0x0A, _this._bufferOffset);
                if (i == -1) {
                    if (_this._left) {
                        result += String.fromCharCode.apply(null, view.subarray(_this._bufferOffset));
                        _this._readNextSlice().then(function () {
                            i = 0;
                            view = new Uint8Array(_this._buffer);
                            window.setImmediate(asyncFunction);
                        });
                    } else
                        resolve(null);
                } else {
                    result += String.fromCharCode.apply(null, view.subarray(_this._bufferOffset, i));
                    _this._bufferOffset = i + 1;
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
                    if (_this._left > 0)
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
