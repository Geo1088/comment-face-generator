const jimp = require('jimp')
const Image = require('./Image.js')

class Face {
    constructor (data, spritesheet) {
        this.spritesheet = spritesheet

        this.name = data.name || 'face'
        this.width = data.width || this.USE_DEFAULT
        this.height = data.height || this.USE_DEFAULT

        this.image = new Image(data.image)
    }

    get selector () {
        return `.md [href="#${this.name}"]`
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

    get previewHTML () {
        let previewData = ''
        return `<div class="face-preview"><img`
    }
}

Face.prototype.USE_DEFAULT = 'USE_DEFAULT'

module.exports = Face
