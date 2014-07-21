module Streams {
    /**
    Produces requested data and reattaches unconsumed data.
    */
    export class BlobSourceBuffer {
        /*
        _readNextSlice method will be internalized here
        _readDataBuffer would be this
        */
        private _slicedCurrent = new ArrayBuffer(0);
        /** Countercurrent stack. Last unconsumed data would be pushed into here and later popped out first. */
        private _countercurrent: number[] = [];
        private _blob: Blob;
        /** Represents byte length of unsliced part. */
        private _leftCost: number;
        private _offsetWithinSlice: number;
        private _sliceSize = 1024 * 1024 * 10;
        get eofReached() {
            return this._leftCost == 0
                && this._offsetWithinSlice == this._slicedCurrent.byteLength
                && this._countercurrent.length == 0;
        }
        get byteOffset() {
            /* slice offset + offset within slice - countercurrent length */
            return (this._blob.size - this._leftCost - this._slicedCurrent.byteLength) + this._offsetWithinSlice - this._countercurrent.length;
        }
        constructor(blob: Blob) {
            this._blob = blob;
            this._leftCost = blob.size;
        }

        produce(size: number) {
            return new Promise<number[]>((resolve, reject) => {
                if (this.eofReached)
                    reject("Buffer reached EOF.");

                var byteArray: number[] = []; // to be returned as ArrayBuffer
                var pending = size;

                if (this._countercurrent.length) { // first empty _countercurrent if there is any element
                    // export as much as possible
                    var exported = this._exportCountercurrent(pending);
                    Array.prototype.push.apply(byteArray, exported); // merge to byteArray
                    pending -= exported.length;
                }

                var asyncOperation = () => {
                    var dataSliceLength = Math.min(pending, this._slicedCurrent.byteLength - this._offsetWithinSlice);
                    if (dataSliceLength > 0) {
                        var dataSlice = new Uint8Array(this._slicedCurrent, this._offsetWithinSlice, dataSliceLength);
                        Array.prototype.push.apply(
                            byteArray,
                            Array.prototype.map.call(dataSlice, (n: number) => n)); // merge to byteArray
                        pending -= dataSliceLength;
                        this._offsetWithinSlice += dataSlice.length;
                    };

                    if (this.eofReached) {
                        //no left buffer
                        this.eofReached = true;
                        resolve(byteArray);
                    }
                    else if (pending > 0)
                        this._readNextSlice().then(asyncOperation);
                    else
                        resolve(byteArray);
                };
                asyncOperation();
            });
        }
        /** Reattaches unconsumed data to _countercurrent. */
        reattach(byteArray: number[]) {
            Array.prototype.push.apply(this._countercurrent, byteArray);
        }
        /** Exports elements from countercurrent as much as possible. */
        private _exportCountercurrent(size: number) {
            return this._countercurrent.splice(Math.max(this._countercurrent.length - size, 0), size);
        }
        seek(offset: number) {
            /*
            If the offset paramater is within current slice: simply change _sliceOffset
            Else: read new slice by _readSlice(offset);
            Will return Promise <void>
            */

            this._exportCountercurrent(Infinity); // flush countercurrent

            var sliceEndOffset = this._blob.size - this._leftCost;
            var sliceStartOffset = sliceEndOffset - this._slicedCurrent.byteLength;
            if (offset >= sliceStartOffset && offset < sliceEndOffset) {
                this._offsetWithinSlice = offset - sliceStartOffset;
                return Promise.resolve<void>(undefined);
            }
            else
                return this._readSlice(offset); // _offsetWithinSlice will be automatically set to 0
        }

        private _readNextSlice() {
            return this._readSlice(this._blob.size - this._leftCost);
        }

        private _readSlice(offset: number) {
            return new Promise<void>((resolve, reject) => {
                var postOffsetSize = this._blob.size - offset;
                if (postOffsetSize < 0) // allows 0 to allow seeking to end position
                    reject(new Error("Offset parameter exceeds blob size."));
                else {
                    var end = offset + Math.min(this._sliceSize, postOffsetSize);

                    var reader = new FileReader();
                    reader.onload = (ev: ProgressEvent) => {
                        this._slicedCurrent = <ArrayBuffer>(<FileReader>ev.target).result;
                        this._leftCost = this._blob.size - end;
                        this._offsetWithinSlice = 0;
                        resolve(undefined);
                    };
                    reader.readAsArrayBuffer(this._blob.slice(offset, end));
                }
            });
        }
    }
}