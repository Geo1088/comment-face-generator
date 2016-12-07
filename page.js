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


// Utilities
function getSelectedSpritesheet () {
    const $listItem = $('.spritesheet.active')
    return project.spritesheets[$listItem.index()]
}
function getSelectedSpritesheetElement () {
    return $('.spritesheet.active')
}
function selectSpritesheet (data) {
    const index = (typeof data === 'number' ? data : project.spritesheets.indexOf(data))
    $('.spritesheet').toggleClass('active', false)
    $('.spritesheet').eq(index).toggleClass('active', true)

    // Update spritesheet option
    const spritesheet = getSelectedSpritesheet()
    $('.spritesheet-title').val(spritesheet.name)
    $('.spritesheet-default-width').val(spritesheet.defaultWidth)
    $('.spritesheet-default-height').val(spritesheet.defaultHeight)
}
function createSpritesheet (data) {
    if (!data) data = {
        name: `Sheet${project.createdSpritesheets + 1}`,
        defaultWidth: 100,
        defaultHeight: 100
    }

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
const $document = $(document)

$document.on('click', '.create-spritesheet', function () {
    createSpritesheet()
})
$(window).on('load', function () {
    createSpritesheet()
})

$document.on('click', '.spritesheet', function () {
    selectSpritesheet($(this).index())
})

$document.on('change', '.spritesheet-title', function () {
    const spritesheet = getSelectedSpritesheet()
    spritesheet.name = $(this).val()
    $('.spritesheet.active').html(spritesheet.name)
})
$document.on('change', '.spritesheet-default-width', function () {
    const spritesheet = getSelectedSpritesheet()
    const val = Math.max(parseInt($(this).val()), 0)
    spritesheet.defaultWidth = val
})
$document.on('change', '.spritesheet-default-height', function () {
    const spritesheet = getSelectedSpritesheet()
    const val = Math.max(parseInt($(this).val()), 0)
    spritesheet.defaultHeight = val
})
