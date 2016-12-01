window.$ = window.jQuery = require('jquery')
const {dialog} = require('electron').remote

// Initialization
let createdSpritesheets = 0

// Code creation
function cssFromSpritesheet (spritesheet) {
    console.log(spritesheet)
    let rules = '' // Stores the rules for each individual face
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
\tbackground-image: url(%%${spritesheet.sheetName}%%);
${spritesheet.defaults.width != null ? `\twidth: ${spritesheet.defaults.width}px;\n` : ''}${
spritesheet.defaults.height != null ? `\theight: ${spritesheet.defaults.height}px;\n` : ''}}`
    return rules + '\n' + allFacesRule
}

// Utilities
function spritesheetItem () {
    return $('.spritesheet.active')
}
function spritesheetData () {
    return spritesheetItem().data('spritesheet')
}
function setSpritesheet (spritesheet) {
    return spritesheetItem().data('spritesheet', spritesheet)
}
function addFace (face) {
    let spritesheet = spritesheetData()
    if (!spritesheet.faces.push) spritesheet.faces = []
    spritesheet.faces.push(face)
    setSpritesheet(spritesheet)
}
// function removeFace (face) {
//     let spritesheet = spritesheetData()
//     let index =
// }


// Make a new spritesheet in the sidebar
function createNewSpritesheet () {
    // Default spritesheet data
    const defaults = {title: `Spritesheet ${++createdSpritesheets}`}
    // Template for thing
    const newListItem = $(`<li class="spritesheet active"><a href="#">${defaults.title}</a></li>`)
    // Set everything else to inactive (the new item is set to active in the template)
    $('.spritesheet').toggleClass('active', false)
    // Add to the list
    $('.sheets-list').append(newListItem)
    // Set the data
    setSpritesheet(defaults)
    // Reload the things
    updateDisplay()
}

// Update all the things
function updateDisplay () {
    let data = spritesheetData()
    console.log(data)
    // CSS preview
    $('#preview-css').html(cssFromSpritesheet(data) || '/* No CSS to display */')
}

$(document).on('click', '.spritesheet', function () {
    $('.sheets-list li').toggleClass('active', false)
    $(this).toggleClass('active', true)
    updateDisplay()
})

$(document).on('click', '.create-spritesheet', createNewSpritesheet)

$(document).on('ready', createNewSpritesheet)


///// debugging shit /////

$(document).on('click', '.test-generate-data', function () {
    setSpritesheet({
        title: 'Some Title',
        sheetName: 'YelloSheet',
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
