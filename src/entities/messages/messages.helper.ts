export default class messages_helper {
    static convert_object_to_buffer(object: any) {
        const uint8 = this.convert_object_to_Uint8Array(object)
        const buffer = Buffer.from(uint8)
        return buffer
    }
    static convert_object_to_Uint8Array(object: any) {
        const array = Object.values(object).map(Number)
        const uit8 = new Uint8Array(array)
        return uit8
    }
    static convert_buffer_to_uint8Array(buffer: Buffer) {
        return new Uint8Array(
            buffer.buffer,
            buffer.byteOffset,
            buffer.byteLength
        )
    }
}