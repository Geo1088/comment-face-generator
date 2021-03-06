const fs = require('fs')
const Jimp = require('jimp')

class Image {
  constructor (object) {
    if (object.buffer) {
      this.path = ''
      this.buffer = object.buffer
    } else if (object.bufferBase64) {
      this.path = ''
      this.buffer = Buffer.from(object.bufferBase64, 'base64')
    } else if (object.path) {
      this.path = object.path
      this.buffer = Buffer.from(fs.readFileSync(this.path))
    } else if (typeof object === 'string') {
      this.path = object
      this.buffer = Buffer.from(fs.readFileSync(this.path))
    } else {
      this.path = ''
      this.buffer = object
    }
  }

  get base64Data () {
    return this.buffer.toString('base64')
  }

  // get base64URL () {
  //     return `data:image/${this.format};base64,${this.base64Data}`
  // }

  jimp (callback) {
    return Jimp.read(this.buffer, callback)
  }

  get object () {
    return {
      path: this.path,
      bufferBase64: this.base64Data
    }
  }
}

module.exports = Image
