declare class BlobStream {
    public blob: Blob;
    private indexInSlice;
    private slice;
    private sliceIndex;
    private sliceSize;
    public left: number;
    constructor(blob: Blob);
    private readNextSlice();
    public readLine(): Promise<string>;
    public readLines(oneach?: (result: string) => any): Promise<void>;
}
