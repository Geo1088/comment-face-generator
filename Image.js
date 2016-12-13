const fs = require('fs')
const jimp = require('jimp')

class Image {
    constructor (object) {
        if (object.path) {
            this.path = object.path
            this.buffer = Buffer.from(fs.readFileSync(this.path))
        } else if (object.buffer) {
            this.path = ''
            this.buffer = object.buffer
        } else if (typeof object === 'string') {
            this.path = object
            this.buffer = Buffer.from(fs.readFileSync(this.path))
        } else {
            this.path = ''
            this.buffer = object
        }
    }

    get base64URL () {
        return `data:image/${this.format};base64,${this.base64Data}`
    }

    jimp (callback) {
        return jimp.read(this.buffer, callback)
    }

    get asObject () {
        return {
            path: this.path,
            buffer: this.buffer
        }
    }
}

module.exports = Image
