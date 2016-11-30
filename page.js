window.$ = window.jQuery = require('jquery')
const {dialog} = require('electron').remote

// Initialization
let createdSpritesheets = 0

// Code creation
function

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
    // let listItem = spritesheetItem()
    // listItem.toggleClass('active', true)
    // return listItem
}

// asdf
function updateDisplay () {
    let data = spritesheetData()
    console.log(data)
    // CSS preview
    $('#preview-css').html(cssFromFaces(data.faces) || '/* No CSS to display */')
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
        faces: [
            'yes',
            'no',
            'abstain'
        ]
    })
    updateDisplay()
})
