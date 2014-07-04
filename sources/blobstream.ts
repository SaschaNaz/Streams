class BlobStream {
    private indexInSlice = 0;
    private slice = new ArrayBuffer(0);
    private sliceIndex: number;
    private sliceSize = 10240;//10 MiB, the size of the resulting slice
    left: number;
    constructor(public blob: Blob) {
        this.left = blob.size;
    }

    //read(length = this.blob.size) {

    //}

    private readNextSlice() {
        if (this.sliceIndex === undefined)
            this.sliceIndex = 0;
        else
            this.sliceIndex++;
        var start = this.sliceIndex * this.sliceSize;
        return new Promise<void>((resolve, reject) => {
            if (this.left == 0)
                reject(new Error("No left input stream"));
            else {
                var reader = new FileReader();
                reader.onload = (ev: ProgressEvent) => {
                    this.slice = <ArrayBuffer>(<FileReader>ev.target).result;
                    this.left -= blobSlice.size;
                    this.indexInSlice = 0;
                    resolve(undefined);
                };
                var blobSlice: Blob;
                if (this.left < this.sliceSize)
                    blobSlice = this.blob.slice(start, start + this.left);
                else
                    blobSlice = this.blob.slice(start, start + this.sliceSize);
                reader.readAsArrayBuffer(blobSlice);
            }
        });
    }

    readLine() {//currently only supports ASCII
        var result = '';
        var view = new Uint8Array(this.slice);
        return new Promise<string>((resolve, reject) => {
            var asyncFunction = () => {
                var i = Array.prototype.indexOf.call(view, 0x0A, this.indexInSlice);
                if (i == -1) {
                    if (this.left) {
                        result += String.fromCharCode.apply(null, view.subarray(this.indexInSlice));
                        this.readNextSlice().then(() => {
                            i = 0;
                            view = new Uint8Array(this.slice);
                            window.setImmediate(asyncFunction);
                        });
                    }
                    else
                        resolve(null);
                }
                else {
                    result += String.fromCharCode.apply(null, view.subarray(this.indexInSlice, i));
                    this.indexInSlice = i + 1;
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
                    if (this.left > 0)
                        window.setImmediate(asyncFunction);
                    else
                        resolve(undefined);
                })
            };
            asyncFunction();
        });
    }
}