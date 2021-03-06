﻿module Streams {
    export interface DecodingResult {
        text: any;
        byteLength: number;
    }
    export class TextDecoder {
        static decode(byteArray: number[], encoding: string): DecodingResult {
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
        }
        private static _decodeAsUtf8(byteArray: number[]) {
            var text = '';
            var byteLength = 0;
            var length = byteArray.length;
            while (byteLength < length) {
                var firstbyte = byteArray[byteLength];

                if (firstbyte < 0x80) {
                    text += String.fromCharCode(firstbyte);
                    byteLength += 1;
                }
                else if (firstbyte < 0xE0) {
                    if (length - byteLength < 2)
                        break;
                    text += String.fromCharCode(
                        ((firstbyte & 0x1F) << 6)
                        + (byteArray[byteLength + 1] & 0x3F));
                    byteLength += 2;
                }
                else if (firstbyte < 0xF0) {
                    if (length - byteLength < 3)
                        break;
                    text += String.fromCharCode(
                        ((firstbyte & 0xF) << 12)
                        + ((byteArray[byteLength + 1] & 0x3F) << 6)
                        + (byteArray[byteLength + 2] & 0x3F));
                    byteLength += 3;
                }
                else if (firstbyte < 0xF8) {//now exceeds 0xFFFF 
                    if (length - byteLength < 4)
                        break;
                    var charcode =
                        ((firstbyte & 0x7) << 18)
                        + ((byteArray[byteLength + 1] & 0x3F) << 12)
                        + ((byteArray[byteLength + 2] & 0x3F) << 6)
                        + (byteArray[byteLength + 3] & 0x3F);
                    var charcodeprocessed = charcode - 0x10000;//split code and make UTF-16 surrogate pair
                    text += String.fromCharCode(0xD800 + (charcodeprocessed >> 10), 0xDC00 + (charcodeprocessed & 0x3FF));
                    byteLength += 4;
                }
                else
                    break;
            }
            return <DecodingResult>{
                text: text,
                byteLength: byteLength
            }
        }
        private static _decodeAsUtf16(byteArray: number[]) {
            var text = '';
            var byteLength = 0;
            var length = byteArray.length;
            while (length - byteLength >= 2) {
                text += String.fromCharCode(UIntReader.readAsUint16(byteArray.slice(byteLength, byteLength + 2)));
                byteLength += 2;
            }
            return <DecodingResult>{
                text: text,
                byteLength: byteLength
            }
        }
        private static _decodeAsLatin1(byteArray: number[]) {
            var text = '';
            var byteLength = 0;
            var length = byteArray.length;
            while (length - byteLength >= 1) {
                text += String.fromCharCode(byteArray[byteLength]);
                byteLength += 1;
            }
            return <DecodingResult>{
                text: text,
                byteLength: byteLength
            }
        }
    }
    class UIntReader {
        static readAsUint16(byteArray: number[]) {
            return this.readAsUintArbitrary(byteArray, 2);
        }
        //little endian
        static readAsUintArbitrary(byteArray: number[], bytes: number) {
            var uint = 0;
            for (var i = 0; i < bytes; i++)
                uint += (byteArray[i] << (i * 8));
            return uint;
        }
    }
}