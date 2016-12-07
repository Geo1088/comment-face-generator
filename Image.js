const fs = require('fs')
const jimp = require('jimp')

class Image {
    constructor (data) {
        if (typeof data === 'string') {
            // When given a path, load the path as an image
            this.path = data
            this.format = 'png'
        } else if (typeof data === 'object') {
            // When given an object, load with the object's properties as data
            // We'll need to verify stuff here as well
            this.path = data.path || ''
            this.format = data.format || 'png'
            this.source = data.source
        }

        // Generate the base 64 data
        this.buffer = Buffer.from(fs.readFileSync(this.path))
        this.base64Data = this.buffer.toString('base64')
    }

    get base64URL () {
        // do stuff here
        return `data:image/${this.format};base64,${this.base64Data}`
    }

    jimp (callback) {
        return jimp.read(this.buffer, callback)
    }

    getPreviewHTML (callback) {
        this.jimp((err, image) => {
            if (err) callback(err)
            image.scaleToFit(200, 200).getBase64(jimp.AUTO, (err, url) => {
                if (err) callback(err)
                callback(null, `<img src="data:${url}">`)
            })
        })
    }
}

module.exports = Image
