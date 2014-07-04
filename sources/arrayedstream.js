define(["require", "exports"], function(require, exports) {
    var ArrayedStream = (function () {
        function ArrayedStream(file, initialIndex) {
            this.filearray = new Uint8Array(file);
            this.index = initialIndex;
        }
        ArrayedStream.prototype.getSize = function () {
            return this.filearray.length;
        };

        ArrayedStream.prototype.readAsByteArray = function (length) {
            var indexbefore = this.index;
            var indexafter = this.index + length;
            if (indexafter <= this.filearray.length) {
                this.index = indexafter;
                return this.filearray.subarray(indexbefore, indexafter);
            } else
                throw "File reached to the end.";
        };

        ArrayedStream.prototype.readAsSubstream = function (length) {
            var indexbefore = this.index;
            var indexafter = this.index + length;
            if (indexafter <= this.filearray.length) {
                this.index = indexafter;
                return new ArrayedStream(this.filearray.subarray(indexbefore, indexafter), 0);
            } else
                throw "File reached to the end.";
        };

        ArrayedStream.prototype.readAsUint8 = function () {
            return this.readAsUintArbitrary(1);
        };

        //little endian
        ArrayedStream.prototype.readAsUint16 = function () {
            return this.readAsUintArbitrary(2);
        };

        //little endian
        ArrayedStream.prototype.readAsUint32 = function () {
            return this.readAsUintArbitrary(4);
        };

        ArrayedStream.prototype.readAsUintArbitrary = function (bytes) {
            if (this.index + bytes <= this.filearray.length) {
                var uint = 0;
                for (var i = 0; i < bytes; i++)
                    uint += (this.filearray[this.index + i] << (i * 8));
                this.index += bytes;
                return uint;
            } else
                throw "File reached to the end.";
        };

        ArrayedStream.prototype.readAsUint16Array = function (arraylength) {
            var indexbefore = this.index;
            var indexafter = this.index + arraylength * 2;
            if (indexafter <= this.filearray.length) {
                this.index = indexafter;
                return new Uint16Array(this.filearray.subarray(indexbefore, indexafter));
            } else
                throw "File reached to the end.";
        };

        ArrayedStream.prototype.readAsFloat = function () {
            var uint32 = this.readAsUint32();
            var minussign = ((uint32 & 0x80000000) >> 31) != 0;
            var exponential = ((uint32 & 0x7F800000) >> 23);
            var fraction = 1 + ((uint32 & 0x007FFFFF) / 0x007FFFFF);

            return minussign ? (-1) * (fraction * Math.pow(2, exponential - 127)) : (fraction * Math.pow(2, exponential - 127));
        };

        //readAsURationalNumber() {
        //    return new RationalNumber(this.readAsUint32(), this.readAsUint32());
        //}
        ArrayedStream.prototype.readAsHexString = function (length) {
            var byteToHex = function (i) {
                var hexstring = i.toString(length).toUpperCase();
                return hexstring.length == 2 ? hexstring : hexstring = '0' + hexstring;
            };

            return String.prototype.concat.apply('', (Array.prototype.map.call(this.readAsByteArray(16), byteToHex)));
        };

        ArrayedStream.prototype.readAsUtf16Text = function (bytelength) {
            var result = '';
            var current = 0;
            while (current < bytelength) {
                result += String.fromCharCode(this.readAsUint16());
                current += 2;
            }
            return result;
        };

        ArrayedStream.prototype.readAsUtf8Text = function (bytelength) {
            //return String.fromCharCode.apply(null, this.readAsByteArray(length));
            var array = this.readAsByteArray(bytelength);
            var result = '';
            var current = 0;
            while (current < bytelength) {
                var firstbyte = array[current];

                if (firstbyte < 0x80) {
                    result += String.fromCharCode(firstbyte);
                    current += 1;
                } else if (firstbyte < 0xE0) {
                    result += String.fromCharCode(((firstbyte & 0x1F) << 6) + (array[current + 1] & 0x3F));
                    current += 2;
                } else if (firstbyte < 0xF0) {
                    result += String.fromCharCode(((firstbyte & 0xF) << 12) + ((array[current + 1] & 0x3F) << 6) + (array[current + 2] & 0x3F));
                    current += 3;
                } else if (firstbyte < 0xF8) {
                    var charcode = ((firstbyte & 0x7) << 18) + ((array[current + 1] & 0x3F) << 12) + ((array[current + 2] & 0x3F) << 6) + (array[current + 3] & 0x3F);
                    var charcodeprocessed = charcode - 0x10000;
                    result += String.fromCharCode(0xD800 + (charcodeprocessed >> 10), 0xDC00 + (charcodeprocessed & 0x3FF));
                    current += 4;
                } else if (firstbyte < 0xFC) {
                    //result += String.fromCharCode(
                    //    ((firstbyte & 0x3) << 24)
                    //    + ((array[current + 1] & 0x3F) << 18)
                    //    + ((array[current + 2] & 0x3F) << 12)
                    //    + ((array[current + 3] & 0x3F) << 6)
                    //    + (array[current + 4] & 0x3F));
                    current += 5;
                } else if (firstbyte < 0xFE) {
                    //result += String.fromCharCode(
                    //    ((firstbyte & 0x1) << 30)
                    //    + ((array[current + 1] & 0x3F) << 24)
                    //    + ((array[current + 2] & 0x3F) << 18)
                    //    + ((array[current + 3] & 0x3F) << 12)
                    //    + ((array[current + 4] & 0x3F) << 6)
                    //    + (array[current + 5] & 0x3F));
                    current += 6;
                }
            }
            return result;
        };

        ArrayedStream.prototype.moveBy = function (length) {
            var indexafter = this.index + length;
            if (indexafter >= 0 && indexafter <= this.filearray.length)
                this.index = indexafter;
            else
                throw "The stream couldn't seek that position.";
        };

        ArrayedStream.prototype.seek = function (position) {
            if (position >= 0 && position <= this.filearray.length)
                this.index = position;
            else
                throw "The stream couldn't seek that position.";
        };

        ArrayedStream.prototype.getCurrentPosition = function () {
            return this.index;
        };

        ArrayedStream.prototype.duplicateStream = function () {
            return new ArrayedStream(this.filearray, this.index);
        };

        ArrayedStream.prototype.cleaveStream = function (startIndex, length) {
            var endIndex = startIndex + length;
            if (startIndex < 0 || endIndex > this.filearray.length)
                throw 'Invalid index for stream cleavage';
            return new ArrayedStream(this.filearray.subarray(startIndex, endIndex), 0);
        };
        return ArrayedStream;
    })();
    exports.ArrayedStream = ArrayedStream;

    var ArrayedBitStream = (function () {
        function ArrayedBitStream(stream) {
            this.stream = stream;
            this.bitindex = 0;
            this.temporaryByte = stream.readAsUint8();
        }
        ArrayedBitStream.prototype.readBits = function (length) {
            if (length <= 0)
                throw 'length is invalid';

            var result = 0;
            for (var i = 1; i <= length; i++)
                result += this.getBit() << (length - i);

            return result;
        };

        ArrayedBitStream.prototype.getBit = function () {
            var bit = (this.temporaryByte & 0x80) >> 7;
            this.temporaryByte = (this.temporaryByte << 1) & 0xFF;
            this.bitindex++;
            if (this.bitindex == 8) {
                this.temporaryByte = this.stream.readAsUint8();
                this.bitindex = 0;
            }
            return bit;
        };
        return ArrayedBitStream;
    })();
    exports.ArrayedBitStream = ArrayedBitStream;
});
//# sourceMappingURL=arrayedstream.js.map
