// Packages
const {dialog, BrowserWindow} = require('electron').remote
const fs = require('fs')
window.$ = window.jQuery = require('jquery')
// Classes
const Project = require('./Project.js')
const Spritesheet = require('./Spritesheet.js')
const Face = require('./Face.js')
const Image = require('./Image.js')

// Initialization
const project = new Project() // The current project - one per window
let createdSheets = 0 // Used in numbering of new spritesheets


// Utilities
function getSelectedSpritesheet () {
    const $listItem = $('.spritesheet.active')
    return project.spritesheets[$listItem.index()]
}
function selectSpritesheet (data) {
    const index = (typeof data === 'number' ? data : project.spritesheets.indexOf(data))
    $('.spritesheet').toggleClass('active', false)
    $('.spritesheet').eq(index).toggleClass('active', true)
}
function createSpritesheet (data) {
    if (!data) data = {}
    if (!data.name) data.name = `Sheet${createdSheets++}`

    const newSheet = project.createSpritesheet(data)
    $('.spritesheets-list').append($(newSheet.listItem))
    selectSpritesheet(newSheet)
}
function deleteSpritesheet (data) {
    const index = (typeof data === 'number' ? data : project.spritesheets.indexOf(data))
    delete projects.spritesheets[index]
    $('.spritesheet').eq(index).remove()
}


// Events
$(document).on('click', '.create-spritesheet', function () {
    createSpritesheet()
})
$(document).on('click', '.spritesheet', function () {
    selectSpritesheet($(this).index())
})
