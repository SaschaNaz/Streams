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
    BlobStream.prototype.readNextSlice = function (oncomplete) {
        var _this = this;
        if (this.sliceIndex === undefined)
            this.sliceIndex = 0;
        else
            this.sliceIndex++;
        var start = this.sliceIndex * this.sliceSize;
        if (this.left == 0)
            throw new Error("No left input stream");
        else {
            var reader = new FileReader();
            reader.onload = function (ev) {
                _this.slice = ev.target.result;
                _this.left -= blobSlice.size;
                _this.indexInSlice = 0;
                oncomplete();
            };
            var blobSlice;
            if (this.left < this.sliceSize)
                blobSlice = this.blob.slice(start, start + this.left);
            else
                blobSlice = this.blob.slice(start, start + this.sliceSize);
            reader.readAsArrayBuffer(blobSlice);
        }
    };

    BlobStream.prototype.readLine = function (oncomplete) {
        var _this = this;
        var result = '';
        var view = new Uint8Array(this.slice);
        var asyncFunction = function () {
            var i = Array.prototype.indexOf.call(view, 0x0A, _this.indexInSlice);
            if (i == -1) {
                if (_this.left) {
                    result += String.fromCharCode.apply(null, view.subarray(_this.indexInSlice));
                    _this.readNextSlice(function () {
                        i = 0;
                        view = new Uint8Array(_this.slice);
                        window.setImmediate(asyncFunction);
                    });
                } else
                    oncomplete(null);
            } else {
                result += String.fromCharCode.apply(null, view.subarray(_this.indexInSlice, i));
                _this.indexInSlice = i + 1;
                oncomplete(result);
            }
        };
        asyncFunction();
    };

    BlobStream.prototype.readLines = function (oneach, oncomplete) {
        var _this = this;
        var asyncFunction = function () {
            _this.readLine(function (result) {
                window.setImmediate(oneach, result);
                if (_this.left > 0)
                    window.setImmediate(asyncFunction);
                else if (oncomplete)
                    window.setImmediate(oncomplete);
            });
        };
        asyncFunction();
    };
    return BlobStream;
})();
//# sourceMappingURL=streams.js.map
