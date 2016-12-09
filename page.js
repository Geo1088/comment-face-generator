// Packages
const {dialog, BrowserWindow} = require('electron').remote
const fs = require('fs')
const path = require('path')
window.$ = window.jQuery = require('jquery')
// Classes
const Project = require('./Project.js')
const Spritesheet = require('./Spritesheet.js')
const Face = require('./Face.js')
const Image = require('./Image.js')

// Initialization
const project = new Project() // The current project - one per window
const $document = $(document)


// Utilities
function getSelectedSpritesheetIndex () {
    return $('.spritesheet.active').index()
}
function getSelectedSpritesheet () {
    return project.spritesheets[getSelectedSpritesheetIndex()]
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
    project.spritesheets.splice(index, 1)
    $('.spritesheet').eq(index).remove()
}


// Events
$document.on('click', '.create-spritesheet', function () {
    createSpritesheet()
})
$(window).on('load', function () {
    createSpritesheet()
})

$document.on('click', '.delete-spritesheet', function () {
    let index = getSelectedSpritesheetIndex()
    deleteSpritesheet(index)
    if (index > 0) index--
    selectSpritesheet(index)
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

$document.on('click', '.add-face', function () {
    const filepath = dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
        title: 'Import a face',
        filters: [
            {name: 'Images', extensions: ['png', 'jpg', 'jpeg']}
        ]
    })[0]
    if (!path) return

    const spritesheet = getSelectedSpritesheet()
    const face = spritesheet.createFace({
        name: path.basename(filepath).replace(/\.[^\.]*$/, '').replace(/\s/g, '_'),
        width: 100,
        height: 100,
        image: {
            path: filepath
        }
    })

    let previewHTML
    function doThing () {
        previewHTML = face.previewHTML
        if (!previewHTML) setTimeout(doThing, 100)
        $('.faces').append($(previewHTML))
    }
    doThing()
})
