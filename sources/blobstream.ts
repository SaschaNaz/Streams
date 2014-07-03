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

    private readNextSlice(oncomplete: () => any) {
        if (this.sliceIndex === undefined)
            this.sliceIndex = 0;
        else
            this.sliceIndex++;
        var start = this.sliceIndex * this.sliceSize;
        if (this.left == 0)
            throw new Error("No left input stream");
        else {
            var reader = new FileReader();
            reader.onload = (ev: ProgressEvent) => {
                this.slice = <ArrayBuffer>(<FileReader>ev.target).result;
                this.left -= blobSlice.size;
                this.indexInSlice = 0;
                oncomplete();
            };
            var blobSlice: Blob;
            if (this.left < this.sliceSize)
                blobSlice = this.blob.slice(start, start + this.left);
            else
                blobSlice = this.blob.slice(start, start + this.sliceSize);
            reader.readAsArrayBuffer(blobSlice);
        }
    }

    readLine(oncomplete: (result: string) => any) {//currently only supports ASCII
        var result = '';
        var view = new Uint8Array(this.slice);
        var asyncFunction = () => {
            var i = Array.prototype.indexOf.call(view, 0x0A, this.indexInSlice);
            if (i == -1) {
                if (this.left) {
                    result += String.fromCharCode.apply(null, view.subarray(this.indexInSlice));
                    this.readNextSlice(() => {
                        i = 0;
                        view = new Uint8Array(this.slice);
                        window.setImmediate(asyncFunction);
                    });
                }
                else
                    oncomplete(null);
            }
            else {
                result += String.fromCharCode.apply(null, view.subarray(this.indexInSlice, i));
                this.indexInSlice = i + 1;
                oncomplete(result);
            }
        };
        asyncFunction();
    }

    readLines(oneach: (result: string) => any, oncomplete: () => any) {
        var asyncFunction = () => {
            this.readLine((result) => {
                window.setImmediate(oneach, result);
                if (this.left > 0)
                    window.setImmediate(asyncFunction);
                else if (oncomplete)
                    window.setImmediate(oncomplete);
            })
        };
        asyncFunction();
    }
}