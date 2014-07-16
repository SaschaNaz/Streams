class BlobStream {
    private _bufferOffset = 0;
    private _buffer = new ArrayBuffer(0);
    private _bufferSliceIndex: number;
    private _left: number;

    pullAmount = 1024 * 1024 * 10;//10 MiB, the size of the resulting buffer slice
    readBytesAs = "arraybuffer";
    readEncoding: string;
    constructor(public blob: Blob) {
        this._left = blob.size;
    }

    read() {
        var leftInBuffer = this._buffer.byteLength - this._bufferOffset;
        if (leftInBuffer * 2 >= this.pullAmount)
            return this.readBytes(leftInBuffer);
        else
            return this.readBytes(leftInBuffer + this.pullAmount);
    }

    readBytes(length: number) {
        return new Promise<StreamReadResult>((resolve, reject) => {
            var byteArray: number[] = []; // to be returned as ArrayBuffer
            var pending = length;
            var asyncOperation = () => {
                var sliceLength = Math.min(pending, this._buffer.byteLength - this._bufferOffset);
                if (sliceLength > 0) {
                    var slice = new Uint8Array(this._buffer, this._bufferOffset, length);
                    this._mergeArray(byteArray, Array.prototype.map.call(slice, (n: number) => n));
                    pending -= sliceLength;
                    this._bufferOffset += slice.length;
                };

                if (pending > 0)
                    this._readNextSlice().then(
                        asyncOperation, // load the slice
                        () => resolve(returnBytes(true))); // no more slices are there
                else
                    resolve(returnBytes(false));
            };
            var returnBytes = (eof: boolean) => {
                return <StreamReadResult>{
                    amountConsumed: length - pending,
                    data: new Uint8Array(byteArray).buffer,
                    eof: eof,
                    error: null
                };
            };
            asyncOperation();
        });
    }

    private _mergeArray(base: number[], input: number[]) {
        Array.prototype.push.apply(base, input);
    }

    private _readNextSlice() {
        if (this._bufferSliceIndex === undefined)
            this._bufferSliceIndex = 0;
        else
            this._bufferSliceIndex++;
        var start = this._bufferSliceIndex * this.pullAmount;
        return new Promise<void>((resolve, reject) => {
            if (this._left == 0)
                reject(new Error("No left input stream"));
            else {
                var reader = new FileReader();
                reader.onload = (ev: ProgressEvent) => {
                    this._buffer = <ArrayBuffer>(<FileReader>ev.target).result;
                    this._left -= blobSlice.size;
                    this._bufferOffset = 0;
                    resolve(undefined);
                };
                var blobSlice: Blob;
                if (this._left < this.pullAmount)
                    blobSlice = this.blob.slice(start, start + this._left);
                else
                    blobSlice = this.blob.slice(start, start + this.pullAmount);
                reader.readAsArrayBuffer(blobSlice);
            }
        });
    }

    readLine() {//currently only supports ASCII
        var result = '';
        var view = new Uint8Array(this._buffer);
        return new Promise<string>((resolve, reject) => {
            var asyncFunction = () => {
                var i = Array.prototype.indexOf.call(view, 0x0A, this._bufferOffset);
                if (i == -1) {
                    if (this._left) {
                        result += String.fromCharCode.apply(null, view.subarray(this._bufferOffset));
                        this._readNextSlice().then(() => {
                            i = 0;
                            view = new Uint8Array(this._buffer);
                            window.setImmediate(asyncFunction);
                        });
                    }
                    else
                        resolve(null);
                }
                else {
                    result += String.fromCharCode.apply(null, view.subarray(this._bufferOffset, i));
                    this._bufferOffset = i + 1;
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
                    if (this._left > 0)
                        window.setImmediate(asyncFunction);
                    else
                        resolve(undefined);
                })
            };
            asyncFunction();
        });
    }
}