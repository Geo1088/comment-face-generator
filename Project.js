const Spritesheet = require('./Spritesheet.js')

class Project {
    constructor (options) {
        if (!options) options = {}
        this.name = options.name || 'UntitledProject'
        this.useSlashes = options.useSlashes || false

        this.spritesheets = []
        this.createdSpritesheets = 0
    }

    createSpritesheet (data) {
        this.createdSpritesheets++
        const newSheet = new Spritesheet(data)
        this.spritesheets.push(newSheet)
        return newSheet
    }
}

module.exports = Project
