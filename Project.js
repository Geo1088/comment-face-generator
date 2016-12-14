const Spritesheet = require('./Spritesheet.js')

class Project {
    constructor (options) {
        if (!options) options = {}
        this.name = options.name || 'UntitledProject'
        this.settings = options.settings || {}

        this.spritesheets = []
        this.createdSpritesheets = 0

        // Default settings
        if (this.settings.useSlashes == null)
            this.settings.useSlashes = false
    }

    createSpritesheet (spritesheet) {
        this.createdSpritesheets++
        const sheet = new Spritesheet(spritesheet)
        this.addSpritesheet(sheet)
        return sheet
    }

    addSpritesheet (spritesheet) {
        this.spritesheets.push(spritesheet)
        spritesheet.project = this
    }

    removeSpritesheet (spritesheet) {
        const index = (typeof spritesheet === 'number' ? spritesheet : this.faces.indexOf(spritesheet))
        this.spritesheets[index].project = null
        this.spritesheets.splice(index, 1)
    }

    get fullCSS () {
        return this.spritesheets.map(spritesheet => spritesheet.fullCSS).join('\n\n')
    }

    get object () {
        return {
            settings: this.settings,
            spritesheets: this.spritesheets.map(spritesheet => spritesheet.object),
        }
    }
}

module.exports = Project
