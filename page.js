window.$ = window.jQuery = require('jquery')
const {dialog} = require('electron').remote
let createdSpritesheets = 0

/******************/
/* CSS generation */
/******************/

function cssFromSpritesheet (spritesheet) {
    if (spritesheet.faces.length < 1) return '/* No faces in the spritesheet */'
    if (spritesheet.defaults.width == null || !spritesheet.defaults.height == null) return '/* Default dimensions not set */'

    let rules = '' // Stores the rules for each individual face

    spritesheet.faces.forEach(face => {
        if (face.bgX == null || face.bgY == null) return console.log('Error doing thing with face: no bgX or bgY\n', face)

        let width = '', height = ''
        if (face.width && face.width !== spritesheet.defaults.width)
            width = `; width:${face.width}px!important`
        if (face.height && face.height !== spritesheet.defaults.height)
            height = `; height:${face.height}px!important`

        let rule = `.md [href="${face.code}"]{ background:${face.bgX}${face.bgX === 0 ? '' : 'px'} ${face.bgY}${face.bgY === 0 ? '' : 'px'}${width}${height} }\n`
        rules += rule
    })

    // The base rule that applies to all faces in the spritesheet
    const allFacesRule = `\n${spritesheet.faces.map(face => `.md [href="${face.code}"]`).join(',')} {
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
const setSpritesheet = (spritesheetData) => spritesheetItem().data('spritesheet', spritesheetData)

// function addFace (face) {
//     let spritesheet = spritesheetData()
//     if (!spritesheet.faces.push) spritesheet.faces = []
//     spritesheet.faces.push(face)
//     setSpritesheet(spritesheet)
// }
// function removeFace (face) {
//     let spritesheet = spritesheetData()
//     let index =
// }

function createNewSpritesheet () {
    // Default spritesheet data
    const data = {
        title: `Spritesheet ${++createdSpritesheets}`,
        faces: [],
        defaults: {
            width: null,
            height: null
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
    // Reload the things
    updateDisplay()
}

/************/
/* UI Stuff */
/************/

function updateDisplay () {
    let data = spritesheetData()

    // Editor values
    $('.spritesheet-title').val(data.title)
    $('.spritesheet-default-width').val(data.defaults.width)
    $('.spritesheet-default-height').val(data.defaults.height)

    // Spritesheet titles
    $('.spritesheet').each(function () {
        let $this = $(this)
        $this.html($this.data('spritesheet').title)
    })

    // CSS preview
    $('.preview.css').html(cssFromSpritesheet(data) || '/* No CSS to display */')
}

/******************/
/* Event handlers */
/******************/

$(document).on('click', '.spritesheet', function () {
    $('.sheets-list li').toggleClass('active', false)
    $(this).toggleClass('active', true)
    updateDisplay()
})

$(window).on('load', createNewSpritesheet)
$(document).on('click', '.create-spritesheet', createNewSpritesheet)

$(document).on('change', '.spritesheet-title', function () {
    let data = spritesheetData()
    data.title = $(this).val()
    setSpritesheet(data)
    updateDisplay()
})
$(document).on('change', '.spritesheet-default-width', function () {
    let data = spritesheetData()
    if (!data.defaults) data.defaults = {}
    let val = $(this).val()
    data.defaults.width = (val === '' ? null : parseInt(val, 10))
    setSpritesheet(data)
    updateDisplay()
})
$(document).on('change', '.spritesheet-default-height', function () {
    let data = spritesheetData()
    if (!data.defaults) data.defaults = {}
    let val = $(this).val()
    data.defaults.height = (val === '' ? null : parseInt(val, 10))
    setSpritesheet(data)
    updateDisplay()
})

// Preview toggling
$(document).on('click', '.preview-toggles button', function () {
    const $this = $(this)
    $('.preview').toggleClass('active', false)
    $(`.preview.${$this.attr('data-for')}`).toggleClass('active', true)
})

///// debugging shit /////

$(document).on('click', '.test-generate-data', function () {
    setSpritesheet({
        title: 'SomeSheet',
        faces: [
            {code: 'yes', bgX: 0, bgY: 0, width: 100, height: 100},
            {code: 'no', bgX: 0, bgY: 100, width: 100, height: 50},
            {code: 'abstain', bgX: 0, bgY: 150, width: 100, height: 50}
        ],
        defaults: {
            width: 100,
            height: 50,
        }
    })
    updateDisplay()
})
