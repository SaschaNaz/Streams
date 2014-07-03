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
//# sourceMappingURL=streams.js.map
