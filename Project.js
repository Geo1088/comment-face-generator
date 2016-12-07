const Spritesheet = require('./Spritesheet.js')

class Project {
    constructor (options) {
        if (!options) options = {}
        this.name = options.name || 'UntitledProject'
        this.useSlashes = options.useSlashes || false

        this.spritesheets = []
    }

    createSpritesheet (data) {
        const newSheet = new Spritesheet(data)
        this.spritesheets.push(newSheet)
        return newSheet
    }
}

module.exports = Project
