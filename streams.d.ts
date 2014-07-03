declare class BlobStream {
    public blob: Blob;
    private indexInSlice;
    private slice;
    private sliceIndex;
    private sliceSize;
    public left: number;
    constructor(blob: Blob);
    private readNextSlice(oncomplete);
    public readLine(oncomplete: (result: string) => any): void;
    public readLines(oneach: (result: string) => any, oncomplete: () => any): void;
}
