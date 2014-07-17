module Streams {
    interface PendingReadDescriptor {
        promise: Promise<StreamReadResult>;
        remaining: number;
        destination: WritableStream;
        bytesAs: string;
        encoding: string;
    }

    export class BlobStream {
        private _dataBufferOffset = 0;
        private _readDataBuffer: Blob = null;
        private _splicedBinaryBuffer = new ArrayBuffer(0);
        private _leftCost: number;
        private _pendingRead: PendingReadDescriptor = null;
        private _eofReached = false;
        //private _readBytesPullAmount = 0;
        //private _amountBeingReturned = 0;

        pullAmount = 1024 * 1024 * 10;//10 MiB, the size of the resulting buffer slice
        readBytesAs = "as-is";
        readEncoding: string;
        constructor(blob: Blob) {
            this._leftCost = blob.size;
            this._readDataBuffer = blob;
        }

        read() {
            var leftInBuffer = this._splicedBinaryBuffer.byteLength - this._dataBufferOffset;
            if (leftInBuffer * 2 >= this.pullAmount)
                return this.readBytes(leftInBuffer);
            else
                return this.readBytes(leftInBuffer + this.pullAmount);
        }

        readBytes(size?: number) {
            if (this._pendingRead != null)
                throw new Error("InvalidStateError");

            var readPromise = new Promise<StreamReadResult>((resolve, reject) => {
                var byteArray: number[] = []; // to be returned as ArrayBuffer
                var pending = size;
                var asyncOperation = () => {
                    var sliceLength = Math.min(pending, this._splicedBinaryBuffer.byteLength - this._dataBufferOffset);
                    if (sliceLength > 0) {
                        var slice = new Uint8Array(this._splicedBinaryBuffer, this._dataBufferOffset, size);
                        this._mergeArray(byteArray, Array.prototype.map.call(slice, (n: number) => n));
                        pending -= sliceLength;
                        this._dataBufferOffset += slice.length;
                    };

                    if (pending > 0)
                        this._readNextSlice().then(
                            asyncOperation, // load the slice
                            () => {
                                this._eofReached = true;
                                resolve(returnData());
                            }); // no more slices are there
                    else
                        resolve(returnData());
                };
                var returnData = () => this._outputData(byteArray, size - pending);
                window.setImmediate(asyncOperation);
            });

            this._pendingRead = {
                promise: readPromise,
                remaining: size,
                destination: null,
                bytesAs: this.readBytesAs,
                encoding: this.readEncoding
            };
            //if (size !== undefined)
            //    this._readBytesPullAmount = size;
            //this._amountBeingReturned = 0;
            return readPromise;
        }

        private _mergeArray(base: number[], input: number[]) {
            Array.prototype.push.apply(base, input);
        }

        private _outputData(byteArray: number[], amountConsumed: number) {
            var data: any;
            switch (this.readBytesAs) {
                case "arraybuffer":
                case "as-is":
                    data = new Uint8Array(byteArray).buffer;
                    break;
                case "text":
                    var decoded = TextDecoder.decode(byteArray, this._pendingRead.encoding);
                    var left = amountConsumed - decoded.byteLength;
                    if (left != 0) {
                        amountConsumed = decoded.byteLength;

                    }
                    break;
            }

            this._pendingRead = null;
            return <StreamReadResult>{
                amountConsumed: amountConsumed,
                data: data,
                eof: this._eofReached,
                error: null
            };
        }

        private _readNextSlice() {
            var start = this._readDataBuffer.size - this._leftCost;
            return new Promise<void>((resolve, reject) => {
                if (this._leftCost == 0)
                    reject(new Error("No left input stream"));
                else {
                    var reader = new FileReader();
                    reader.onload = (ev: ProgressEvent) => {
                        this._splicedBinaryBuffer = <ArrayBuffer>(<FileReader>ev.target).result;
                        this._leftCost -= blobSlice.size;
                        this._dataBufferOffset = 0;
                        resolve(undefined);
                    };
                    var blobSlice: Blob;
                    if (this._leftCost < this.pullAmount)
                        blobSlice = this._readDataBuffer.slice(start, start + this._leftCost);
                    else
                        blobSlice = this._readDataBuffer.slice(start, start + this.pullAmount);
                    reader.readAsArrayBuffer(blobSlice);
                }
            });
        }

        readLine() {//currently only supports ASCII
            var result = '';
            var view = new Uint8Array(this._splicedBinaryBuffer);
            return new Promise<string>((resolve, reject) => {
                var asyncFunction = () => {
                    var i = Array.prototype.indexOf.call(view, 0x0A, this._dataBufferOffset);
                    if (i == -1) {
                        if (this._leftCost) {
                            result += String.fromCharCode.apply(null, view.subarray(this._dataBufferOffset));
                            this._readNextSlice().then(() => {
                                i = 0;
                                view = new Uint8Array(this._splicedBinaryBuffer);
                                window.setImmediate(asyncFunction);
                            });
                        }
                        else
                            resolve(null);
                    }
                    else {
                        result += String.fromCharCode.apply(null, view.subarray(this._dataBufferOffset, i));
                        this._dataBufferOffset = i + 1;
                        resolve(result);
                    }
                };
                asyncFunction();
            });
        }

        readLines(oneach?: (result: string) => any) {
            return new Promise<void>((resolve, reject) => {
                var asyncFunction = () => {
                    this.readLine().then((result) => {
                        window.setImmediate(oneach, result);
                        if (this._leftCost > 0)
                            window.setImmediate(asyncFunction);
                        else
                            resolve(undefined);
                    })
            };
                asyncFunction();
            });
        }
    }
}
var BlobStream = Streams.BlobStream;