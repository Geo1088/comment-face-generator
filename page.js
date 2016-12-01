window.$ = window.jQuery = require('jquery')
const {dialog} = require('electron').remote
let createdSpritesheets = 0

/******************/
/* CSS generation */
/******************/

function cssFromSpritesheet (spritesheet) {
    let rules = '' // Stores the rules for each individual face
    if (spritesheet.faces[0] == null) return // enpty faces array

    spritesheet.faces.forEach(face => {
        if (face.bgX == null || face.bgY == null) return console.log('Error doing thing with face: no bgX or bgY\n', face)

        let width = '', height = ''
        if (face.width && face.width !== spritesheet.defaults.width)
            width = `; width: ${face.width}px !important`
        if (face.height && face.height !== spritesheet.defaults.height)
            height = `; height: ${face.height}px !important`

        let rule = `.md [href="${face.code}"] { background:${face.bgX} ${face.bgY}${width}${height} }\n`
        rules += rule
    })

    // The base rule that applies to all faces in the spritesheet
    const allFacesRule = `${spritesheet.faces.map(face => `.md [href="${face.code}"]`).join(',')} {
\tbackground-image: url(%%${spritesheet.title}%%);
${spritesheet.defaults.width != null ? `\twidth: ${spritesheet.defaults.width}px;\n` : ''}${
spritesheet.defaults.height != null ? `\theight: ${spritesheet.defaults.height}px;\n` : ''}}`
    const comment = `/* ${spritesheet.title} */`
    return rules + '\n' + allFacesRule
}

/***************************************/
/* Spritesheet data accessor utilities */
/***************************************/

const spritesheetItem = () => $('.spritesheet.active')
const spritesheetData = () => spritesheetItem().data('spritesheet')
const setSpritesheet = (spritesheetData) => spritesheetItem().data('spritesheet', spritesheetData)

function renameSpritesheet (text) {
    let data = spritesheetData()
    data.title = text
    spritesheetItem().html(text)
    setSpritesheet(data)
}

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
    // CSS preview
    $('.preview.css').html(cssFromSpritesheet(data) || '/* No CSS to display */')
    $('.spritesheet').each(function () {
        let $this = $(this)
        $this.html($this.data('spritesheet').title)
    })
    $('.spritesheet-title').val(data.title)
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
    renameSpritesheet($(this).val())
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
            {code: 'yes', bgX: 0, bgY: 0, height: 100},
            {code: 'no', bgX: 0, bgY: 100},
            {code: 'abstain', bgX: 0, bgY: 150}
        ],
        defaults: {
            width: 100,
            height: 50,
        }
    })
    updateDisplay()
})
