const jimp = require('jimp')
const Image = require('./Image.js')

class Face {
    constructor (data) {
        this.name = data.name || 'face'
        this.width = data.width || this.USE_DEFAULT
        this.height = data.height || this.USE_DEFAULT

        this.image = new Image(data.image)
        this.spritesheet = null

        // Create some additional information for future use
        jimp.read(this.image.buffer, (err, image) => {
            const limit = 200
            image.cover(this.width, this.height, (err, image) => {
                const setProperties = (err, base64) => {
                    this.previewImageURL = base64
                }

                if (image.bitmap.width > limit || image.bitmap.height > limit)
                    image.scaleToFit(limit, limit).getBase64(jimp.AUTO, setProperties)
                else
                    image.getBase64(jimp.AUTO, setProperties)
            })
        })
    }

    get selector () {
        return `.md [href="#${this.name}"]`
    }

    // get width () {
    //     if (this.width === this.USE_DEFAULT) return this.spritesheet ? this.spritesheet.defaultWidth
    //     return this.width
    // }

    get displayWidth () {
        if (this.width === this.USE_DEFAULT) return ''
        return this.width
    }

    get displayHeight () {
        if (this.height === this.USE_DEFAULT) return ''
        return this.height
    }

    get bgX () {
        return 0 // TODO
    }

    get bgY () {
        return 0 // TODO
    }

    get fullCSS () {
        const widthPart = (this.width === this.USE_DEFAULT ? '' : `; width:${this.width}px`)
        const heightPart = (this.height === this.USE_DEFAULT ? '' : `; height:${this.height}px`)
        return `${this.selector}{background:${this.bgX} ${this.bgY}${widthPart}${heightPart}}`
    }

    sizedPreviewImageURL (callback) {
        this.image.jimp((err, image) => {
            if (err) callback(err)
            image.cover(this.width, this.height).getBase64(jimp.AUTO, callback)
        })
    }

    getPreviewHTML (callback) {
        this.sizedPreviewImageURL((err, url) => {
            if (err) callback(err)
            callback(null, `
                <div class="face-preview-wrap">
                    <img class="face-preview" src="${url}">
                </div>
            `)
        })
    }

    getFullHTML (callback) {
        // if (!this.image.base64URL) return
        this.getPreviewHTML((err, faceHTML) => {
            if (err) callback(err)
            callback(null, `
                <div class="face">
                    ${faceHTML}
                    <div class="face-actions">
                        <pre><code>${this.name}</code></pre>
                        <input class="face-width" type="number" value="${this.displayWidth}">
                        x
                        <input class="face-height" type="number" value="${this.displayHeight}">
                    </div>
                </div>
            `)
        })
    }
}

Face.prototype.USE_DEFAULT = 'USE_DEFAULT'

module.exports = Face
