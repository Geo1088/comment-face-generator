const jimp = require('jimp')
const Image = require('./Image')

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
        this.useNativeRes = this.width == null || this.height == null
    }

    get bgX () {
        return 0 // This is actually constant
    }

    get bgY () {
        // Loop through the faces before this one in the array, and add their
        // heights together
        let offsetY = 0
        for (let i = 0; i < this.spritesheet.faces.indexOf(this); i++) {
            console.log('Adding spritesheet item', i+1)
            offsetY += this.spritesheet.faces[i].height
            console.log(offsetY)
        }
        return offsetY
    }

    get selector () {
        return `.md [href="${this.spritesheet.project.settings.useSlashes ? '/' : '#'}${this.name}"]`
    }

    fullCSS (defaultWidth = 0, defaultHeight = 0) {
        let width = '', height = ''
        if (this.width !== defaultWidth)
            width = `;width:${this.width}px!important`
        if (this.height !== defaultHeight)
            height = `;height:${this.height}px!important`

        const bgX = this.bgX ? '0' : `-${this.bgX}px`
        const bgY = this.bgX ? '0' : `-${this.bgY}px`

        return `${this.selector}{background:${bgX} ${bgY}${width}${height}}`
    }

    sizedImage (callback) {
        // Get jimp image
        this.image.jimp((err, image) => {
            if (err) callback(err)
            // Reset to initial dimensions if this is true
            if (this.useNativeRes) {
                this.useNativeRes = false
                this.width = image.bitmap.width
                this.height = image.bitmap.height
            }
            // Resize and call back
            image.cover(this.width, this.height, callback)
        })
    }

    sizedPreviewImageURL (callback) {
        // Get a sized image
        this.sizedImage((err, image) => {
            if (err) callback(err)
            // Convert to base 64 and call back
            image.getBase64(jimp.AUTO, callback)
        })
    }

    getPreviewHTML (callback) {
        this.sizedPreviewImageURL((err, url) => {
            if (err) callback(err)

            // Set sizing properties to prevent the img from getting too big
            let width = this.width > 200 ? ' width="200"' : ''
            let height = this.height > 200 ? ' height="200"' : ''
            if (width && height) {
                if (this.width > this.height)
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
                        <input class="face-name hover-only" type="text" value="${this.name}">
                        <br>
                        <input class="face-width" type="number" value="${this.width}">
                        x
                        <input class="face-height" type="number" value="${this.height}">
                        <br>
                        <button class="set-face-initial-dimensions">Set to initial file dimensions</button>
                        <br>
                        Scale to: <input type="number" class="scale-face-value">
                        <button class="scale-face-to-width">Width</button>
                        <button class="scale-face-to-height">Height</button>
                        <br>
                        <button class="delete-face">Delete face</button>
                    </div>
                </div>
            `)
        })
    }

    get object () {
        return {
            name: this.name,
            image: this.image.object,
            width: this.width,
            height: this.height
        }
    }
}

module.exports = Face
