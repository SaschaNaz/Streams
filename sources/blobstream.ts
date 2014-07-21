module Streams {
    interface PendingReadDescriptor {
        promise: Promise<StreamReadResult<any>>;
        remaining: number;
        destination: WritableStream;
        bytesAs: string;
        encoding: string;
    }

    export class BlobStream {
        private _readDataBuffer: BlobSourceBuffer = null;
        private _pendingRead: PendingReadDescriptor = null;
        private get _eofReached() {
            return this._readDataBuffer.eofReached;
        }
        get byteOffset() {
            return this._readDataBuffer.byteOffset;
        }
        get blob() {
            return this._readDataBuffer.blob;
        }
        //private _readBytesPullAmount = 0;
        //private _amountBeingReturned = 0;

        pullAmount = 1024 * 1024 * 10;//10 MiB, the size of the resulting buffer slice
        readBytesAs = "as-is";
        readEncoding = "utf-8";
        constructor(blob: Blob) {
            this._readDataBuffer = new BlobSourceBuffer(blob);
        }

        fork() {
            var blobStream = new BlobStream(this._readDataBuffer.blob);
            blobStream._readDataBuffer = this._readDataBuffer.fork();
            blobStream.readBytesAs = this.readBytesAs;
            blobStream.readEncoding = this.readEncoding;
            return blobStream;
        }

        slice(start = 0, end = this._readDataBuffer.blob.size) {
            var blobStream = new BlobStream(this._readDataBuffer.blob.slice(start, end));
            blobStream.readBytesAs = this.readBytesAs;
            blobStream.readEncoding = this.readEncoding;
            return blobStream;
        }

        seek(offset: number) {
            return this._readDataBuffer.seek(offset);
        }

        read() {
            return this._readBytes<ArrayBuffer>(this.pullAmount);
        }

        readBytes<T>(size = this.pullAmount) {
            return this._readBytes<T>(size, this.readBytesAs);
        }

        private _readBytes<T>(size: number, bytesAs = 'as-is') {
            if (this._pendingRead != null)
                throw new Error("InvalidStateError");

            var readPromise = new Promise<StreamReadResult<T>>((resolve, reject) => {
                window.setImmediate(() => {
                    this._readDataBuffer.produce(size).then((byteArray) => {
                        resolve(this._outputData<T>(byteArray));
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
        }

        private _outputData<T>(byteArray: number[]) {
            var data: any;
            var amountConsumed = byteArray.length;
            switch (this._pendingRead.bytesAs) {
                case "arraybuffer":
                case "as-is":
                    data = new Uint8Array(byteArray).buffer;
                    break;
                case "text":
                    var decoded = TextDecoder.decode(byteArray, this._pendingRead.encoding);
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
            return <StreamReadResult<T>>{
                amountConsumed: amountConsumed,
                data: data,
                eof: this._eofReached,
                error: null
            };
        }

        //readLine() {//currently only supports ASCII
        //    var result = '';
        //    var view = new Uint8Array(this._splicedBinaryBuffer);
        //    return new Promise<string>((resolve, reject) => {
        //        var asyncFunction = () => {
        //            var i = Array.prototype.indexOf.call(view, 0x0A, this._dataBufferOffset);
        //            if (i == -1) {
        //                if (this._leftCost) {
        //                    result += String.fromCharCode.apply(null, view.subarray(this._dataBufferOffset));
        //                    this._readNextSlice().then(() => {
        //                        i = 0;
        //                        view = new Uint8Array(this._splicedBinaryBuffer);
        //                        window.setImmediate(asyncFunction);
        //                    });
        //                }
        //                else
        //                    resolve(null);
        //            }
        //            else {
        //                result += String.fromCharCode.apply(null, view.subarray(this._dataBufferOffset, i));
        //                this._dataBufferOffset = i + 1;
        //                resolve(result);
        //            }
        //        };
        //        asyncFunction();
        //    });
        //}

        //readLines(oneach?: (result: string) => any) {
        //    return new Promise<void>((resolve, reject) => {
        //        var asyncFunction = () => {
        //            this.readLine().then((result) => {
        //                window.setImmediate(oneach, result);
        //                if (this._leftCost > 0)
        //                    window.setImmediate(asyncFunction);
        //                else
        //                    resolve(undefined);
        //            })
        //    };
        //        asyncFunction();
        //    });
        //}
    }
}

import BlobStream = Streams.BlobStream;