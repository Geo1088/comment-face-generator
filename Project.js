'use strict'

const Spritesheet = require('./Spritesheet')

class Project {
  constructor (options) {
    if (!options) options = {}
    this.name = options.name || 'UntitledProject'
    this.settings = options.settings || {}

    this.spritesheets = []
    this.createdSpritesheets = 0

    // Default settings
    if (this.settings.useSlashes == null) this.settings.useSlashes = false

    // If there's a setting for spritesheets, add them by initializing new
    // spritesheet instances
    if (options.spritesheets) {
      for (const sheetData of options.spritesheets) {
        this.createSpritesheet(sheetData)
      }
    }

    this.writePath = ''
    this.unsaved = false
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
      spritesheets: this.spritesheets.map(spritesheet => spritesheet.object)
    }
  }
}

module.exports = Project
