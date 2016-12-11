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
    // Disable actions if all spritesheets are ded
    if (!spritesheet)
        return $('.spritesheet-actions input, .spritesheet-actions button').attr('disabled', true)
    // Otherwise, update the things
    $('.spritesheet-actions input, .spritesheet-actions button').attr('disabled', false)
    $('.spritesheet-title').val(spritesheet.name)
    $('.spritesheet-default-width').val(spritesheet.defaultWidth)
    $('.spritesheet-default-height').val(spritesheet.defaultHeight)

    // We also need to re-create the face list now
    $('.face').remove()
    for (let face of spritesheet.faces) {
        face.getFullHTML((err, html) => {
            $('.faces').append($(html))
        })
    }
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


// Events - tab menu and tab updates
$document.on('click', '.tab-buttons button', function () {
    $('.tab').toggleClass('active', false)
    $(`.tab.${$(this).attr('data-for')}`).toggleClass('active', true)
})
$document.on('click', '.tab-buttons [data-for="preview-css"]', function () {
    // Update the CSS view with the current CSS
    $('.preview-css').html(project.fullCSS)
})

// Events - spritesheet controls
$document.on('click', '.create-spritesheet', function () {
    createSpritesheet()
    $('.spritesheet-actions input, .spritesheet-actions button').attr('disabled', false)
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

    // Update placeholders on existing faces
    $('.face-width').attr('placeholder', val)

    // Loop through all the faces and update the ones that need updating
    $('.face').each(function (index) {
        const $this = $(this)
        if ($this.find('.face-width[value=""]')) {
            spritesheet.faces[index].getPreviewHTML((err, html) => {
                $this.children('.face-preview-wrap').remove()
                $this.prepend($(html))
            })
        }
    })
})
$document.on('change', '.spritesheet-default-height', function () {
    const spritesheet = getSelectedSpritesheet()
    const val = Math.max(parseInt($(this).val()), 0)
    spritesheet.defaultHeight = val
    $('.face-height').attr('placeholder', val)
})

// Events - face controls
$document.on('click', '.add-face', function () {
    // Get an image path from the user, and load it
    let filepaths = dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
        title: 'Import face',
        properties: [
            'openFile',
            'multiSelections'
        ],
        filters: [
            {name: 'Images', extensions: ['png', 'jpg', 'jpeg']}
        ]
    })
    if (!filepaths) return // showOpenDialog returns undefined on cancel

    // Loop through each file added
    for (let filepath of filepaths) {
        // Create a new face object and add it to the current spritesheet
        const spritesheet = getSelectedSpritesheet()
        const face = spritesheet.createFace({
            name: path.basename(filepath)
                .replace(/\.[^\.]*$/, '')
                .replace(/\s/g, '_'),
            width: spritesheet.defaultWidth,
            height: spritesheet.defaultHeight,
            image: {
                path: filepath
            }
        })

        face.getFullHTML((err, html) => {
            $('.faces').append($(html))
        })
    }
})
$document.on('click', '.delete-face', function () {
    const $face = $(this).closest('.face')
    $face.remove()
    getSelectedSpritesheet().faces.splice($face.index(), 1)
    // $face.remove()
})
$document.on('change', '.face-width', function () {
    const $this = $(this)
    const $face = $this.closest('.face')

    // Get the current value, and change it around if necessary
    let val = parseInt($this.val(), 10)
    if (isNaN(val)) val = ''

    // Write back to the data object
    const index = $face.index()
    const face = getSelectedSpritesheet().faces[index]
    face.width = val

    // Update the display image with the new dimensions
    face.getPreviewHTML((err, html) => {
        $face.children('.face-preview-wrap').remove()
        $face.prepend($(html))
    })
})
$document.on('change', '.face-height', function () {
    const $this = $(this)
    const $face = $this.closest('.face')

    // Get the current value, and change it around if necessary
    let val = parseInt($this.val(), 10)
    if (isNaN(val)) val = ''

    // Write back to the data object
    const index = $face.index()
    const face = getSelectedSpritesheet().faces[index]
    face.height = val

    // Update the display image with the new dimensions
    face.getPreviewHTML((err, html) => {
        $face.children('.face-preview-wrap').remove()
        $face.prepend($(html))
    })
})
