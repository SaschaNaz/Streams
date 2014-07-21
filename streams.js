var Streams;
(function (Streams) {
    /**
    Produces requested data and reattaches unconsumed data.
    */
    var BlobSourceBuffer = (function () {
        function BlobSourceBuffer(blob) {
            this.blob = blob;
            /*
            _readNextSlice method will be internalized here
            _readDataBuffer would be this
            */
            this._slicedCurrent = new ArrayBuffer(0);
            /** Countercurrent stack. Last unconsumed data would be pushed into here and later popped out first. */
            this._countercurrent = [];
            this._sliceSize = 1024 * 1024 * 10;
            this._leftCost = blob.size;
        }
        Object.defineProperty(BlobSourceBuffer.prototype, "eofReached", {
            get: function () {
                return this._leftCost == 0 && this._offsetWithinSlice == this._slicedCurrent.byteLength && this._countercurrent.length == 0;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BlobSourceBuffer.prototype, "byteOffset", {
            get: function () {
                /* slice offset + offset within slice - countercurrent length */
                return (this.blob.size - this._leftCost - this._slicedCurrent.byteLength) + this._offsetWithinSlice - this._countercurrent.length;
            },
            enumerable: true,
            configurable: true
        });

        BlobSourceBuffer.prototype.produce = function (size) {
            var _this = this;
            return new Promise(function (resolve, reject) {
                if (_this.eofReached)
                    reject("Buffer reached EOF.");

                var byteArray = [];
                var pending = size;

                if (_this._countercurrent.length) {
                    // export as much as possible
                    var exported = _this._exportCountercurrent(pending);
                    Array.prototype.push.apply(byteArray, exported); // merge to byteArray
                    pending -= exported.length;
                }

                var asyncOperation = function () {
                    var dataSliceLength = Math.min(pending, _this._slicedCurrent.byteLength - _this._offsetWithinSlice);
                    if (dataSliceLength > 0) {
                        var dataSlice = new Uint8Array(_this._slicedCurrent, _this._offsetWithinSlice, dataSliceLength);
                        Array.prototype.push.apply(byteArray, Array.prototype.map.call(dataSlice, function (n) {
                            return n;
                        })); // merge to byteArray
                        pending -= dataSliceLength;
                        _this._offsetWithinSlice += dataSlice.length;
                    }
                    ;

                    if (_this.eofReached) {
                        //no left buffer
                        _this.eofReached = true;
                        resolve(byteArray);
                    } else if (pending > 0)
                        _this._readNextSlice().then(asyncOperation);
                    else
                        resolve(byteArray);
                };
                asyncOperation();
            });
        };

        /** Reattaches unconsumed data to _countercurrent. */
        BlobSourceBuffer.prototype.reattach = function (byteArray) {
            Array.prototype.push.apply(this._countercurrent, byteArray);
        };

        /** Exports elements from countercurrent as much as possible. */
        BlobSourceBuffer.prototype._exportCountercurrent = function (size) {
            return this._countercurrent.splice(Math.max(this._countercurrent.length - size, 0), size);
        };
        BlobSourceBuffer.prototype.seek = function (offset) {
            /*
            If the offset paramater is within current slice: simply change _sliceOffset
            Else: read new slice by _readSlice(offset);
            Will return Promise <void>
            */
            this._exportCountercurrent(Infinity); // flush countercurrent

            var sliceEndOffset = this.blob.size - this._leftCost;
            var sliceStartOffset = sliceEndOffset - this._slicedCurrent.byteLength;
            if (offset >= sliceStartOffset && offset < sliceEndOffset) {
                this._offsetWithinSlice = offset - sliceStartOffset;
                return Promise.resolve(undefined);
            } else
                return this._readSlice(offset);
        };

        BlobSourceBuffer.prototype._readNextSlice = function () {
            return this._readSlice(this.blob.size - this._leftCost);
        };

        BlobSourceBuffer.prototype._readSlice = function (offset) {
            var _this = this;
            return new Promise(function (resolve, reject) {
                var postOffsetSize = _this.blob.size - offset;
                if (postOffsetSize < 0)
                    reject(new Error("Offset parameter exceeds blob size."));
                else {
                    var end = offset + Math.min(_this._sliceSize, postOffsetSize);

                    var reader = new FileReader();
                    reader.onload = function (ev) {
                        _this._slicedCurrent = ev.target.result;
                        _this._leftCost = _this.blob.size - end;
                        _this._offsetWithinSlice = 0;
                        resolve(undefined);
                    };
                    reader.readAsArrayBuffer(_this.blob.slice(offset, end));
                }
            });
        };
        return BlobSourceBuffer;
    })();
    Streams.BlobSourceBuffer = BlobSourceBuffer;
})(Streams || (Streams = {}));
var Streams;
(function (Streams) {
    var BlobStream = (function () {
        function BlobStream(blob) {
            this._readDataBuffer = null;
            this._pendingRead = null;
            //private _readBytesPullAmount = 0;
            //private _amountBeingReturned = 0;
            this.pullAmount = 1024 * 1024 * 10;
            this.readBytesAs = "as-is";
            this.readEncoding = "utf-8";
            this._readDataBuffer = new Streams.BlobSourceBuffer(blob);
        }
        Object.defineProperty(BlobStream.prototype, "_eofReached", {
            get: function () {
                return this._readDataBuffer.eofReached;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BlobStream.prototype, "byteOffset", {
            get: function () {
                return this._readDataBuffer.byteOffset;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(BlobStream.prototype, "blob", {
            get: function () {
                return this._readDataBuffer.blob;
            },
            enumerable: true,
            configurable: true
        });

        BlobStream.prototype.read = function () {
            return this._readBytes(this.pullAmount);
        };

        BlobStream.prototype.readBytes = function (size) {
            if (typeof size === "undefined") { size = this.pullAmount; }
            return this._readBytes(size, this.readBytesAs);
        };

        BlobStream.prototype._readBytes = function (size, bytesAs) {
            var _this = this;
            if (typeof bytesAs === "undefined") { bytesAs = 'as-is'; }
            if (this._pendingRead != null)
                throw new Error("InvalidStateError");

            var readPromise = new Promise(function (resolve, reject) {
                window.setImmediate(function () {
                    _this._readDataBuffer.produce(size).then(function (byteArray) {
                        resolve(_this._outputData(byteArray));
                    });
                });
            });

            this._pendingRead = {
                promise: readPromise,
                remaining: size,
                destination: null,
                bytesAs: bytesAs,
                encoding: this.readEncoding
            };

            //if (size !== undefined)
            //    this._readBytesPullAmount = size;
            //this._amountBeingReturned = 0;
            return readPromise;
        };

        BlobStream.prototype._outputData = function (byteArray) {
            var data;
            var amountConsumed = byteArray.length;
            switch (this._pendingRead.bytesAs) {
                case "arraybuffer":
                case "as-is":
                    data = new Uint8Array(byteArray).buffer;
                    break;
                case "text":
                    var decoded = Streams.TextDecoder.decode(byteArray, this._pendingRead.encoding);
                    var left = amountConsumed - decoded.byteLength;
                    if (left != 0) {
                        amountConsumed = decoded.byteLength;

                        //reattach unconsumed data to buffer
                        this._readDataBuffer.reattach(byteArray.slice(amountConsumed, byteArray.length));
                    }
                    data = decoded.text;
                    break;
            }

            this._pendingRead = null;
            return {
                amountConsumed: amountConsumed,
                data: data,
                eof: this._eofReached,
                error: null
            };
        };
        return BlobStream;
    })();
    Streams.BlobStream = BlobStream;
})(Streams || (Streams = {}));

var BlobStream = Streams.BlobStream;
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
var Streams;
(function (Streams) {
    var TextDecoder = (function () {
        function TextDecoder() {
        }
        TextDecoder.decode = function (byteArray, encoding) {
            switch (encoding.toLowerCase()) {
                case 'utf-8':
                default:
                    return this._decodeAsUtf8(byteArray);
                case 'utf-16':
                    return this._decodeAsUtf16(byteArray);
                case 'latin1':
                case 'iso-8859-1':
                    return this._decodeAsLatin1(byteArray);
            }
        };
        TextDecoder._decodeAsUtf8 = function (byteArray) {
            var text = '';
            var byteLength = 0;
            var length = byteArray.length;
            while (byteLength < length) {
                var firstbyte = byteArray[byteLength];

                if (firstbyte < 0x80) {
                    text += String.fromCharCode(firstbyte);
                    byteLength += 1;
                } else if (firstbyte < 0xE0) {
                    if (length - byteLength < 2)
                        break;
                    text += String.fromCharCode(((firstbyte & 0x1F) << 6) + (byteArray[byteLength + 1] & 0x3F));
                    byteLength += 2;
                } else if (firstbyte < 0xF0) {
                    if (length - byteLength < 3)
                        break;
                    text += String.fromCharCode(((firstbyte & 0xF) << 12) + ((byteArray[byteLength + 1] & 0x3F) << 6) + (byteArray[byteLength + 2] & 0x3F));
                    byteLength += 3;
                } else if (firstbyte < 0xF8) {
                    if (length - byteLength < 4)
                        break;
                    var charcode = ((firstbyte & 0x7) << 18) + ((byteArray[byteLength + 1] & 0x3F) << 12) + ((byteArray[byteLength + 2] & 0x3F) << 6) + (byteArray[byteLength + 3] & 0x3F);
                    var charcodeprocessed = charcode - 0x10000;
                    text += String.fromCharCode(0xD800 + (charcodeprocessed >> 10), 0xDC00 + (charcodeprocessed & 0x3FF));
                    byteLength += 4;
                } else
                    break;
            }
            return {
                text: text,
                byteLength: byteLength
            };
        };
        TextDecoder._decodeAsUtf16 = function (byteArray) {
            var text = '';
            var byteLength = 0;
            var length = byteArray.length;
            while (length - byteLength >= 2) {
                text += String.fromCharCode(UIntReader.readAsUint16(byteArray.slice(byteLength, byteLength + 2)));
                byteLength += 2;
            }
            return {
                text: text,
                byteLength: byteLength
            };
        };
        TextDecoder._decodeAsLatin1 = function (byteArray) {
            var text = '';
            var byteLength = 0;
            var length = byteArray.length;
            while (length - byteLength >= 1) {
                text += String.fromCharCode(byteArray[byteLength]);
                byteLength += 1;
            }
            return {
                text: text,
                byteLength: byteLength
            };
        };
        return TextDecoder;
    })();
    Streams.TextDecoder = TextDecoder;
    var UIntReader = (function () {
        function UIntReader() {
        }
        UIntReader.readAsUint16 = function (byteArray) {
            return this.readAsUintArbitrary(byteArray, 2);
        };

        //little endian
        UIntReader.readAsUintArbitrary = function (byteArray, bytes) {
            var uint = 0;
            for (var i = 0; i < bytes; i++)
                uint += (byteArray[i] << (i * 8));
            return uint;
        };
        return UIntReader;
    })();
})(Streams || (Streams = {}));
//# sourceMappingURL=streams.js.map
