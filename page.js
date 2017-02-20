// Packages
const {dialog, BrowserWindow} = require('electron').remote
const path = require('path')
const jimp = require('jimp')
window.$ = window.jQuery = require('jquery')
// Classes
const Project = require('./Project.js')


// Initialization
const project = new Project() // The current project - one per window
const $document = $(document)
let currentImageData


// Utilities
function getSelectedSpritesheetIndex () {
    return $('.spritesheet.active').index()
}
function getSelectedSpritesheet () {
    return project.spritesheets[getSelectedSpritesheetIndex()]
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
            $('.faces-container').append($(html))
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
    $('.tab, .tab-buttons button').toggleClass('active', false)
    $(this).toggleClass('active', true)
    $(`.tab.${$(this).attr('data-for')}`).toggleClass('active', true)
})
$document.on('click', '.tab-buttons [data-for="preview-output"]', function () {
    // Update the output view with the current CSS and spritesheet
    $('.preview-css').html(project.fullCSS)
    getSelectedSpritesheet().generateSpritesheet((err, image) => {
        if (err) return console.log('Spritesheet generation failed.\n', err)
        // Store the image so we can get it again later
        currentImageData = image
        // Get the base64 URL and display the preview
        image.getBase64(jimp.AUTO, (err, url) => {
            if (err) return console.log('Oh crap.\n', err)
            $('.preview-spritesheets').html(`
                <img src="${url}" alt="Spritesheet preview" class="final-spritesheet">
            `)
        })
    })
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
$document.on('click', '.save-spritesheet', function () {
    if (!currentImageData) return
    const path = dialog.showSaveDialog(BrowserWindow.getFocusedWindow(), {
        title: 'Save spritesheet',
        defaultPath: `${getSelectedSpritesheet().name}.png`,
        filters: [
            {name: 'Images', extensions: ['png']}
        ]
    })
    if (!path) return
    currentImageData.write(path, (err) => {
        if (err) throw err
        console.log('Saved hopefully.')
    })
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
})
$document.on('change', '.spritesheet-default-height', function () {
    const spritesheet = getSelectedSpritesheet()
    const val = Math.max(parseInt($(this).val()), 0)
    spritesheet.defaultHeight = val

    // Update placeholders on existing faces
    $('.face-height').attr('placeholder', val)
})
function updateAllFacePreviews () {
    const spritesheet = getSelectedSpritesheet()
    $('.face').each(function (index) {
        const $this = $(this)
        if ($this.find('.face-width[value=""]')) {
            spritesheet.faces[index].getPreviewHTML((err, html) => {
                $this.children('.face-preview-wrap').remove()
                $this.prepend($(html))
            })
        }
    })
}
$document.on('click', '.reset-face-dimensions', function () {
    const spritesheet = getSelectedSpritesheet()
    spritesheet.faces.forEach((face, index) => {
        face.width = spritesheet.defaultWidth
        face.height = spritesheet.defaultHeight
        $('.faces-container').eq(index).find('.face-width').val(spritesheet.defaultWidth)
        $('.faces-container').eq(index).find('.face-height').val(spritesheet.defaultHeight)
    })
    updateAllFacePreviews()
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

    // Recursively loop through file paths and add the preview HTML for each
    ! function handlePath (index) {
        const filepath = filepaths[index]
        if (!filepath)
            return // We're done once we hit the end of the list

        console.log('Handling face', path.basename(filepath))
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
            if (err) return
            $('.faces-container').append($(html))
            handlePath(index + 1)
        })
    }(0)
})
$document.on('click', '.delete-face', function () {
    const $face = $(this).closest('.face')
    getSelectedSpritesheet().faces.splice($face.index(), 1)
    $face.remove()
    // $face.remove()
})
$document.on('change', '.face-name', function () {
    const $this = $(this)
    const $face = $this.closest('.face')
    const index = $face.index()
    const face = getSelectedSpritesheet().faces[index]
    const val = $this.val()

    // Update face name with value, no checks or anything
    face.name = val
})
$document.on('change', '.face-width', function () {
    const $this = $(this)
    const $face = $this.closest('.face')
    const index = $face.index()
    const face = getSelectedSpritesheet().faces[index]

    // Get the current value, and change it around if necessary
    let val = parseInt($this.val(), 10)
    if (isNaN(val)) val = face.spritesheet.defaultWidth

    // Write back to the data object
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
    const index = $face.index()
    const face = getSelectedSpritesheet().faces[index]

    // Get the current value, and change it around if necessary
    let val = parseInt($this.val(), 10)
    if (isNaN(val)) val = face.spritesheet.defaultHeight

    // Write back to the data object
    face.height = val

    // Update the display image with the new dimensions
    face.getPreviewHTML((err, html) => {
        $face.children('.face-preview-wrap').remove()
        $face.prepend($(html))
    })
})
// Resizing
$document.on('click', '.set-face-default-dimensions', function () {
    const $face = $(this).closest('.face')
    const face = getSelectedSpritesheet().faces[$face.index()]

    // Get the spritesheet's default dimensions and assign them to the face
    face.width = face.spritesheet.defaultWidth
    face.height = face.spritesheet.defaultHeight

    // Update the display image with the new dimensions
    face.getPreviewHTML((err, html) => {
        $face.children('.face-preview-wrap').remove()
        $face.prepend($(html))
    })

    // Update the width and height inputs
    $face.find('.face-width').val(face.width)
    $face.find('.face-height').val(face.height)
})
$document.on('click', '.set-face-initial-dimensions', function () {
    const $face = $(this).closest('.face')
    const face = getSelectedSpritesheet().faces[$face.index()]

    // Regenerate face preview with initial resolution
    face.useNativeRes = true
    face.getPreviewHTML((err, html) => {
        $face.children('.face-preview-wrap').remove()
        $face.prepend($(html))

        // The width and height properties are updated in this call, so we can
        // set the input values now
        $face.find('.face-width').val(face.width)
        $face.find('.face-height').val(face.height)
    })
})
$document.on('click', '.scale-face-to-width', function () {
    const $this = $(this)
    const $face = $this.closest('.face')
    const face = getSelectedSpritesheet().faces[$face.index()]
    const $input = $face.find('.scale-face-value')

    // Get value, reset and return if it's 0 or blank
    let val = $input.val()
    if (isNaN(val = parseInt(val, 10)) || val === 0)
        return $input.val('')

    // Apply scaling things
    face.height = Math.round(val / (face.width / face.height))
    face.width = val

    // Update the display image with the new dimensions
    face.getPreviewHTML((err, html) => {
        $face.children('.face-preview-wrap').remove()
        $face.prepend($(html))
    })

    // Update the width and height inputs
    $face.find('.face-width').val(face.width)
    $face.find('.face-height').val(face.height)

    // Reset the value input
    $input.val('')
})
$document.on('click', '.scale-face-to-height', function () {
    const $this = $(this)
    const $face = $this.closest('.face')
    const face = getSelectedSpritesheet().faces[$face.index()]
    const $input = $face.find('.scale-face-value')

    // Get value, reset and return if it's 0 or blank
    let val = $input.val()
    if (isNaN(val = parseInt(val, 10)) || val === 0)
        return $input.val('')

    // Apply scaling things
    face.width = Math.round(val / (face.height / face.width))
    face.height = val

    // Update the display image with the new dimensions
    face.getPreviewHTML((err, html) => {
        $face.children('.face-preview-wrap').remove()
        $face.prepend($(html))
    })

    // Update the width and height inputs
    $face.find('.face-width').val(face.width)
    $face.find('.face-height').val(face.height)

    // Reset the value input
    $input.val('')
})

// Events - settings
$document.on('click', '.project-settings-collapse', function () {
    $('.project-settings-header').toggleClass('show')
})
$document.on('change', '.use-slashes-setting', function () {
    project.settings.useSlashes = $(this).is(':checked')
})

// Test
document.querySelectorAll('.popover-wrap').forEach(wrapper => {
    const button = wrapper.querySelector('.popover-trigger')
    const box = wrapper.querySelector('.popover-box')
    // Set up initial display
    box.style.display = 'none'
    // Add event listener to toggle later
    button.addEventListener('click', function () {
        if (box.style.display === 'none')
            box.style.display = 'block'
        else
            box.style.display = 'none'
    })
})
// Find closest ancestor with class - http://stackoverflow.com/a/22119674
function findAncestor (el, cls) {
    while ((el = el.parentElement) && !el.classList.contains(cls));
    return el;
}
document.querySelectorAll('.dismisses-popover').forEach(button => {
    const box = findAncestor(button, 'popover-box')
    button.addEventListener('click', function () {
        box.style.display = 'none'
    })
})
