window.$ = window.jQuery = require('jquery')
const {dialog} = require('electron').remote
let createdSpritesheets = 0 // Used for the naming of newly creates spritesheets

// Temporary icon data for messing with base64 image storage (may or may not have been taken from /r/toolbox's code)
const icon_thing = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAJdSURBVDjLpZP7S1NhGMf9W7YfogSJboSE\
UVCY8zJ31trcps6zTI9bLGJpjp1hmkGNxVz4Q6ildtXKXzJNbJRaRmrXoeWx8tJOTWptnrNryre5YCYuI3rh+8vL+/m8PA/PkwIg5X+y5mJWrxfOUBXm91QZM6UluUmthntHqplxUml2lciF6wrmdHri\
I0Wx3xw2hAediLwZRWRkCPzdDswaSvGqkGCfq8VEUsEyPF1O8Qu3O7A09RbRvjuIttsRbT6HHzebsDjcB4/JgFFlNv9MnkmsEszodIIY7Oaut2OJcSF68Qx8dgv8tmqEL1gQaaARtp5A+N4NzB0lMXxo\
n/uxbI8gIYjB9HytGYuusfiPIQcN71kjgnW6VeFOkgh3XcHLvAwMSDPohOADdYQJdF1FtLMZPmslvhZJk2ahkgRvq4HHUoWHRDqTEDDl2mDkfheiDgt8pw340/EocuClCuFvboQzb0cwIZgki4KhzlaE\
6w0InipbVzBfqoK/qRH94i0rgokSFeO11iBkp8EdV8cfJo0yD75aE2ZNRvSJ0lZKcBXLaUYmQrCzDT6tDN5SyRqYlWeDLZAg0H4JQ+Jt6M3atNLE10VSwQsN4Z6r0CBwqzXesHmV+BeoyAUri8EyMfi2\
FowXS5dhd7doo2DVII0V5BAjigP89GEVAtda8b2ehodU4rNaAW+dGfzlFkyo89GTlcrHYCLpKD+V7yeeHNzLjkp24Uu1Ed6G8/F8qjqGRzlbl2H2dzjpMg1KdwsHxOlmJ7GTeZC/nesXbeZ6c9OYnuxU\
c3fmBuFft/Ff8xMd0s65SXIb/gAAAABJRU5ErkJggg=='

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
function removeFaceFromSpritesheet (faceIndex) {
    let data = spritesheetData()
    delete data.faces[faceIndex]
    setSpritesheet(data)
    updateFaceDisplay()
}

/************/
/* UI Stuff */
/************/

function updateSheetDisplay () {
    // Thing if we fucked it up
    // if (spritesheetItem() == null) $('.spritesheet')[0].click()

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
    $('.preview-css').html(cssFromSpritesheet(data) || '/* No CSS to display */')

    // Raw data
    $('.preview-raw-data').html(JSON.stringify(data, null, '\t'))
}

function updateFaceDisplay () {
    const data = spritesheetData()
    console.log('Using defaults:', data.defaults)
    $('.face').remove()
    for (let face of data.faces) {
        console.log(face)
        const widthIsDefault = face.width == null
        const heightIsDefault = face.height == null
        console.log('IsDefault:', widthIsDefault, heightIsDefault)
        const width = (widthIsDefault ? data.defaults.width : face.width)
        const height = (heightIsDefault ? data.defaults.height : face.height)
        console.log('width, height:', width, height)

        let faceItem = $(`<div class="face"><pre>[](#${face.name})</pre><div>(${
            widthIsDefault ? width : `<strong>${width}</strong>`
        } x ${
            heightIsDefault ? height : `<strong>${height}</strong>`
        })</div></div>`)

        $('.tab.faces').append(faceItem)

        faceItem
            .css('width', width)
            .css('height', height)
            .css('background-image', `url(${face.imageData || ''})`)
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
// Update spritesheet title as the text box is updated
$(document).on('change', '.spritesheet-title', function () {
    let data = spritesheetData()
    data.title = $(this).val()
    setSpritesheet(data)
})
// Same for default width and height boxes
$(document).on('change', '.spritesheet-default-width', function () {
    let data = spritesheetData()
    if (!data.defaults) data.defaults = {}
    let val = $(this).val()
    data.defaults.width = (val === '' ? null : parseInt(val, 10))
    setSpritesheet(data)
})
$(document).on('change', '.spritesheet-default-height', function () {
    let data = spritesheetData()
    if (!data.defaults) data.defaults = {}
    let val = $(this).val()
    data.defaults.height = (val === '' ? null : parseInt(val, 10))
    setSpritesheet(data)
})
// Switch views when clicking tab buttons
$(document).on('click', '.tab-buttons button', function () {
    const $this = $(this)
    $('.tab').toggleClass('active', false)
    $(`.tab.${$this.attr('data-for')}`).toggleClass('active', true)
})

///// debugging shit /////

$(document).on('click', '.test-generate-data', function () {
    setSpritesheet({
        title: 'SomeSheet',
        defaults: {
            width: 100,
            height: 50
        }
    })
    addFaceToSpritesheet({
        name: 'yes',
        bgX: 0,
        bgY: 0,
        width: null,
        height: 100,
        imageData: 'data:image/png;base64,' + icon_thing
    })
    addFaceToSpritesheet({
        name: 'no',
        bgX: 0,
        bgY: 100,
        width: null,
        height: null
    })
    addFaceToSpritesheet({
        name: 'abstain',
        bgX: 0,
        bgY: 150,
        width: null,
        height: null
    })
    updateFaceDisplay()
})
