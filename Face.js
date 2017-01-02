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

    get fullCSS () {
        let width = '', height = ''
        if (this.width !== this.spritesheet.defaultWidth)
            width = `;width:${this.width}px!important`
        if (this.height !== this.spritesheet.defaultHeight)
            height = `;height:${this.height}px!important`

        const bgX = this.bgX ? '0' : `-${this.bgX}px`
        const bgY = this.bgX ? '0' : `-${this.bgY}px`

        return `${this.selector}{background:${bgX} ${bgY}${width}${height}}`
    }

    sizedImage (callback) {
        this.image.jimp((err, image) => {
            if (err) callback(err)
            if (this.useNativeRes) {
                this.useNativeRes = false
                this.width = image.bitmap.width
                this.height = image.bitmap.height
            }
            image.cover(this.width, this.height, callback)
        })
    }

    sizedPreviewImageURL (callback) {
        this.sizedImage((err, image) => {
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
                        <code>${this.name}</code>
                        <br>
                        <input class="face-width" type="number" placeholder="${this.spritesheet.defaultWidth}" value="${this.height}">
                        x
                        <input class="face-height" type="number" placeholder="${this.spritesheet.defaultHeight}" value="${this.height}">
                        <br>
                        <button class="set-face-default-dimensions">Set to spritesheet default dimensions</button>
                        <button class="set-face-initial-dimensions">Set to initial file dimensions</button>
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
