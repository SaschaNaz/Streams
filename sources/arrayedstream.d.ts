export declare class ArrayedStream {
    private index;
    private filearray;
    constructor(file: ArrayBuffer, initialIndex: number);
    public getSize(): number;
    public readAsByteArray(length: number): Uint8Array;
    public readAsSubstream(length: number): ArrayedStream;
    public readAsUint8(): number;
    public readAsUint16(): number;
    public readAsUint32(): number;
    private readAsUintArbitrary(bytes);
    public readAsUint16Array(arraylength: number): Uint16Array;
    public readAsFloat(): number;
    public readAsHexString(length: number): string;
    public readAsUtf16Text(bytelength: number): string;
    public readAsUtf8Text(bytelength: number): string;
    public moveBy(length: number): void;
    public seek(position: number): void;
    public getCurrentPosition(): number;
    public duplicateStream(): ArrayedStream;
    public cleaveStream(startIndex: number, length: number): ArrayedStream;
}
export declare class ArrayedBitStream {
    private stream;
    private temporaryByte;
    private bitindex;
    constructor(stream: ArrayedStream);
    public readBits(length: number): number;
    private getBit();
}
