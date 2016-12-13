window.$ = window.jQuery = require('jquery')
const fs = require('fs')
const jimp = require('jimp')
const {dialog, BrowserWindow} = require('electron').remote
let createdSpritesheets = 0 // Used for the naming of newly creates spritesheets

/****************************/
/* CSS generation functions */
/****************************/

function cssFromSpritesheet (spritesheet) {
    if (spritesheet.faces == null || spritesheet.faces.length < 1) return '/* No faces in the spritesheet */'
    if (spritesheet.defaults.width == null || spritesheet.defaults.height == null) return '/* Default dimensions not set */'

    let rules = '' // Stores the rules for each individual face

    spritesheet.faces.forEach(face => {
        if (face.bgX == null || face.bgY == null) return console.log('Error doing thing with face: no bgX or bgY\n', face)

        let width = '', height = ''
        if (face.width && face.width !== spritesheet.defaults.width)
            width = `; width:${face.width}px!important`
        if (face.height && face.height !== spritesheet.defaults.height)
            height = `; height:${face.height}px!important`

        let rule = `.md [href="${face.name}"]{ background:${face.bgX}${face.bgX === 0 ? '' : 'px'} ${face.bgY}${face.bgY === 0 ? '' : 'px'}${width}${height} }\n`
        rules += rule
    })

    // The base rule that applies to all faces in the spritesheet
    const allFacesRule = `\n${spritesheet.faces.map(face => `.md [href="${face.name}"]`).join(',')} {
\tbackground-image: url(%%${spritesheet.title}%%);
${spritesheet.defaults.width != null ? `\twidth: ${spritesheet.defaults.width}px;\n` : ''}${
spritesheet.defaults.height != null ? `\theight: ${spritesheet.defaults.height}px;\n` : ''}}`
    const comment = `/* ${spritesheet.title} */\n\n`
    return comment + rules + allFacesRule
}

/***************************************/
/* Spritesheet data accessor utilities */
/***************************************/

const spritesheetItem = () => $('.spritesheet.active')
const spritesheetData = () => spritesheetItem().data('spritesheet')

function setSpritesheet (spritesheetData) {
    spritesheetItem().data('spritesheet', spritesheetData)
    updateSheetDisplay()
}
function selectSpritesheet (index) {
    $('.spritesheet').toggleClass('active', false)
    $($('.spritesheet')[index]).toggleClass('active', true)
    updateSheetDisplay()
    updateFaceDisplay()
}
function createNewSpritesheet () {
    // Default spritesheet data
    const data = {
        title: `Sheet${++createdSpritesheets}`,
        faces: [],
        defaults: {
            width: 100,
            height: 100
        }
    }
    // Template for thing
    const newListItem = $(`<li class="spritesheet active">${data.title}</li>`)
    // Set everything else to inactive (the new item is set to active in the template)
    $('.spritesheet').toggleClass('active', false)
    // Add to the list
    $('.sheets-list').append(newListItem)
    // Set the data of this newly-created spritesheet
    setSpritesheet(data)
    updateFaceDisplay()
}
function deleteSpritesheet () {
    spritesheetItem().remove()
    selectSpritesheet(0)
    // updateSheetDisplay()
}

function addFaceToSpritesheet (faceData) {
    let data = spritesheetData()
    if (!data.faces) data.faces = []
    data.faces.push(faceData)
    setSpritesheet(data)
    updateFaceDisplay()
}
function setFaceAtIndex (index, faceData) {
    let data = spritesheetData()
    if (!data.faces) data.faces = []
    data.faces[index] = faceData
    setSpritesheet(data)
    updateFaceDisplay()
}
function removeFaceFromSpritesheet (faceIndex) {
    let data = spritesheetData()
    data.faces.splice(faceIndex, 1)
    setSpritesheet(data)
    updateFaceDisplay()
}

/************/
/* UI Stuff */
/************/

// Update display of the spritesheet list and per-sheet settings/previews
function updateSheetDisplay () {
    const data = spritesheetData()

    // If there are no spritesheets, do nothing
    if (!data) {
        $('.spritesheet-actions input').val('').attr('disabled', true)
        $('.spritesheet-actions button').attr('disabled', true)
        return
    }

    // Setting values and un-disabling things
    $('.spritesheet-title').val(data.title)
    $('.spritesheet-default-width').val(data.defaults.width)
    $('.spritesheet-default-height').val(data.defaults.height)
    $('.spritesheet-actions input, .spritesheet-actions button').attr('disabled', false)

    // Spritesheet titles
    $('.spritesheet').each(function () {
        let $this = $(this)
        $this.html($this.data('spritesheet').title)
    })

    // CSS preview
    $('.preview-css').html(cssFromSpritesheet(data) || '/* No CSS to display */')

    // Raw data
    $('.preview-raw-data').html(JSON.stringify(data, null, '\t'))
}

// Update display of the face list and per-face settings
function updateFaceDisplay () {
    const data = spritesheetData()
    if (!data) return

    // Reconstruct the list of faces
    $('.face').remove()
    const faces = data.faces.sort((a, b) => a.name.localeCompare(b.name))
    for (let face of faces) {
        // Get a thumbnail to preview the image
        let image = jimp.read(Buffer.from(face.image.data, 'base64')).then(image => {
            const ogWidth = image.bitmap.width
            const ogHeight = image.bitmap.height
            const limit = 200

            image.cover(face.width || data.defaults.width, face.height || data.defaults.height, (err, image) => {
                if (image.bitmap.width > limit || image.bitmap.height > limit)
                    image.scaleToFit(limit, limit).getBuffer(jimp.MIME_PNG, doConstructItem)
                else
                    image.getBuffer(jimp.MIME_PNG, doConstructItem)

                function doConstructItem (err, buffer) {
                    constructItem(face, {
                        data: buffer.toString('base64'),
                        format: 'png'
                    })
                }
            })
        })
    }

    function constructItem (face, imageData) {
        const widthIsDefault = face.width == null
        const heightIsDefault = face.height == null
        const width = face.width || data.defaults.width
        const height = face.height || data.defaults.height

        // Face item template - with bolded values that are non-default
        let faceItem = $(`<div class="face">
            <div class="face-preview-wrap">
                <img class="face-preview" src="data:image/${imageData.format};base64,${imageData.data}">
            </div>
            <div class="face-edit">
                <pre>[](#${face.name})</pre>
                <div>(${
                    widthIsDefault ? width : `<strong>${width}</strong>`
                } x ${
                    heightIsDefault ? height : `<strong>${height}</strong>`
                })</div>
                <input class="face-width" type="number" placeholder="${data.defaults.width}" value="${widthIsDefault ? '' : width}">
                <input class="face-height" type="number" placeholder="${data.defaults.height}" value="${heightIsDefault ? '' : height}">
            </div>
        </div>`)

        // Add to actual list
        $('.tab.faces').append(faceItem)

        // Other styles that need to be added per-face
        // faceItem
        //     .css('width', width)
        //     .css('height', height)
        //     .css('background-image', face.image ? `url(data:image/${face.image.format};base64,${face.image.data || ''})` : '')
    }
}

/******************/
/* Event handlers */
/******************/


// Spritesheet creation - one on window load, and one per click of the button
$(window).on('load', createNewSpritesheet)
$(document).on('click', '.create-spritesheet', createNewSpritesheet)
// Select a spritesheet when it's clicked
$(document).on('click', '.spritesheet', function () {
    selectSpritesheet($(this).index())
})
// Delete a spritesheet when button selected
$(document).on('click', '.delete-spritesheet', function () {
    dialog.showMessageBox(BrowserWindow.getFocusedWindow(), {
        message: 'Are you sure you want to delete this spritesheet?',
        title: 'Hold up!',
        buttons: ['Yes', 'No'],
        cancelId: 1
    }) || deleteSpritesheet()
})
// Update spritesheet title as the text box is updated
$(document).on('change', '.spritesheet-title', function () {
    let data = spritesheetData()
    data.title = $(this).val()
    setSpritesheet(data)
})
// Same for default width and height boxes
$(document).on('change', '.spritesheet-default-width', function () {
    let data = spritesheetData()
    const $this = $(this)
    const val = $(this).val()
    console.log(val)

    if (val === '') {
        $this.val(data.defaults.width)
        return
    }
    if (!data.defaults) data.defaults = {}

    data.defaults.width = parseInt(val, 10)
    setSpritesheet(data)
})
$(document).on('change', '.spritesheet-default-height', function () {
    let data = spritesheetData()
    const $this = $(this)
    const val = $(this).val()

    if (val === '') {
        $this.val(data.defaults.height)
        return
    }
    if (!data.defaults) data.defaults = {}

    data.defaults.height = (val === '' ? null : parseInt(val, 10))
    setSpritesheet(data)
})
// Switch views when clicking tab buttons
$(document).on('click', '.tab-buttons button', function () {
    const $this = $(this)
    $('.tab').toggleClass('active', false)
    $(`.tab.${$this.attr('data-for')}`).toggleClass('active', true)
})
// Things for faces
$(document).on('change', '.face-width', function () {
    const $this = $(this)
    const index = $this.closest('.face').index()
    const val = $this.val()
    let faceData = spritesheetData().faces[index]

    if (val === '') {
        $this.val(faceData.width)
        return
    }

    faceData.width = (val === '' ? null : parseInt(val, 10))
    setFaceAtIndex(index, faceData)
})
$(document).on('change', '.face-height', function () {
    const $this = $(this)
    const index = $this.closest('.face').index()
    const val = $this.val()
    let faceData = spritesheetData().faces[index]

    if (val === '') {
        $this.val(faceData.height)
        return
    }

    faceData.height = (val === '' ? null : parseInt(val, 10))
    setFaceAtIndex(index, faceData)
})

///// debugging shit /////

$(document).on('click', '.test-add-face-button', function () {
    addFaceToSpritesheet({
        name: 'asdf',
        bgX: 235,
        bgY: 914,
        width: null,
        height: null,
        image: getImageFromDialog()
    })
})

function getImageFromDialog () {
    const filename = dialog.showOpenDialog(BrowserWindow.getFocusedWindow(), {
        title: 'Import a face',
        filters: [
            {name: 'Images', extensions: ['png', 'jpg', 'jpeg']}
        ]
    })[0]
    if (!filename) return
    return {
        data: Buffer.from(fs.readFileSync(filename)).toString('base64'),
        format: filename.substr(filename.length - 5, filename.length).indexOf('.png') >= 0 ? 'png' : 'jpeg'
    }
}
