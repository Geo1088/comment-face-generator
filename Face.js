const jimp = require('jimp')
const Image = require('./Image.js')

class Face {
    constructor (data) {
        this.name = data.name || 'face'
        this.width = data.width
        this.height = data.height

        // The image that this face displays
        this.image = new Image(data.image)

        // A reference to the spritesheet containing this face, or null
        this.spritesheet = null

        // This is a bit of a hack. If it's true, the face's width and height
        // will be set to the actual width and height of the image the next time
        // the preview is updated. The value is set back to false after the
        // recalculation. This is set to true by default so these calculations
        // run the first time, but it really shouldn't be used elsewhere.
        this.useNativeRes = true
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

    get computedWidth () {
        let width = this.width
        if (width === '') width = this.spritesheet.defaultWidth
        return width
    }

    get computedHeight () {
        let height = this.height
        if (height === '') height = this.spritesheet.defaultHeight
        return height
    }

    get selector () {
        return `.md [href="#${this.name}"]`
    }

    get fullCSS () {
        let width = '', height = ''
        if (this.computedWidth !== this.spritesheet.defaultWidth)
            width = `; width:${this.width}px`
        if (this.computedHeight !== this.spritesheet.defaultHeight)
            height = `; height:${this.height}px`

        return `${this.selector}{background:${this.bgX} ${this.bgY}${width}${height}}`
    }

    sizedImage (callback) {
        this.image.jimp((err, image) => {
            if (err) callback(err)
            if (this.useNativeRes) {
                this.useNativeRes = false
                this.width = image.bitmap.width
                this.height = image.bitmap.height
            }
            image
                .cover(this.computedWidth, this.computedHeight, callback)
        })
    }

    sizedPreviewImageURL (callback) {
        this.sizedImage((err, image) => {
            image
                .cover(this.computedWidth, this.computedHeight)
                .getBase64(jimp.AUTO, callback)
        })
    }

    getPreviewHTML (callback) {
        this.sizedPreviewImageURL((err, url) => {
            if (err) callback(err)

            // Set sizing properties to prevent the img from getting too big
            let width = this.computedWidth > 200 ? ' width="200"' : ''
            let height = this.computedHeight > 200 ? ' height="200"' : ''
            if (width && height) {
                if (this.computedWidth > this.computedHeight)
                    height = ''
                else
                    width = ''
            }

            // Template and call back
            callback(null, `
                <div class="face-preview-wrap">
                    <img class="face-preview" src="${url}"${width}${height}>
                </div>
            `)
        })
    }

    getFullHTML (callback) {
        this.getPreviewHTML((err, faceHTML) => {
            if (err) callback(err)
            callback(null, `
                <div class="face">
                    ${faceHTML}
                    <div class="face-actions">
                        <code>${this.name}</code>
                        <br>
                        <input class="face-width" type="number" placeholder="${this.spritesheet.defaultWidth}" value="${this.displayWidth}">
                        x
                        <input class="face-height" type="number" placeholder="${this.spritesheet.defaultHeight}" value="${this.displayHeight}">
                        <br>
                        <button class="delete-face">Delete face</button>
                    </div>
                </div>
            `)
        })
    }
}

Face.prototype.USE_DEFAULT = 'USE_DEFAULT'

module.exports = Face
