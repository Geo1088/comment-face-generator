'use strict'

// Packages
const {dialog, getCurrentWindow, Menu, app, shell} = require('electron').remote
const defaultMenu = require('electron-default-menu')
const path = require('path')
const fs = require('fs')
const Jimp = require('jimp')
const $ = window.$ = window.jQuery = require('jquery')
// Classes
const Project = require('./Project')
// Runtime constants
const browserWindow = getCurrentWindow()
const $document = $(document)

// Data initialization
let project = new Project() // The current project - one per window
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
  if (!spritesheet) {
    return $('.spritesheet-actions input, .spritesheet-actions button').attr('disabled', true)
  }
  // Otherwise, update the things
  $('.spritesheet-actions input, .spritesheet-actions button').attr('disabled', false)
  $('.spritesheet-title').val(spritesheet.name)

  // We also need to re-create the face list now
  $('.face').remove()
  // Do this via a recursive function because otherwise things get out of order
  ;(function addFaceToList (index = 0) {
    const face = spritesheet.faces[index]
    if (face == null) return
    face.getFullHTML((err, html) => {
      if (err) throw new Error(err)
      $('.faces-container').append($(html))
      addFaceToList(index + 1)
    })
  })()
}
function createSpritesheet (data) {
  if (!data) {
    data = {
      name: `Sheet${project.createdSpritesheets + 1}`,
      defaultWidth: 100,
      defaultHeight: 100
    }
  }

  const newSheet = project.createSpritesheet(data)
  $('.spritesheets-list').append($(newSheet.listItem))
  selectSpritesheet(newSheet)
  project.unsaved = true
}
function deleteSpritesheet (data = getSelectedSpritesheetIndex()) {
  let index = (typeof data === 'number' ? data : project.spritesheets.indexOf(data))
  project.spritesheets.splice(index, 1)
  $('.spritesheet').eq(index).remove()
  if (index > 0) index--
  selectSpritesheet(index)
  project.unsaved = true
}
// Completely refresh the display, reconstructing the spritesheet and face lists
function refreshDisplay () {
  // Clean slate
  $('.spritesheets-list .spritesheet').remove()
  // Apply things
  for (let spritesheet of project.spritesheets) {
    $('.spritesheets-list').append($(spritesheet.listItem))
  }
  // Now we do the things
  selectSpritesheet(0)
}

// Add faces from a list of images the user selects
function addFaces () {
  // Get an image path from the user, and load it
  let filepaths = dialog.showOpenDialog(browserWindow, {
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
  ;(function handlePath (index) {
    const filepath = filepaths[index]
    if (!filepath) return // We're done once we hit the end of the list

    console.log('Handling face', path.basename(filepath))
    // Create a new face object and add it to the current spritesheet
    const spritesheet = getSelectedSpritesheet()
    const face = spritesheet.createFace({
      name: path.basename(filepath)
      .replace(/\.[^.]*$/, '')
      .replace(/\s/g, '_'),
      image: {
        path: filepath
      }
    })

    face.getFullHTML((err, html) => {
      if (err) return
      $('.faces-container').append($(html))
      handlePath(index + 1)
    })
  })(0)
  project.unsaved = true
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
    image.getBase64(Jimp.AUTO, (err, url) => {
      if (err) return console.log('Oh crap.\n', err)
      $('.preview-spritesheets').html(`
        <img src="${url}" alt="Spritesheet preview" class="final-spritesheet">
      `)
    })
  })
})

// Events - spritesheet controls
$document.on('click', '.create-spritesheet', newSpritesheet)
// TODO: This should be handled by the Project initializer
$(window).on('load', function () {
  createSpritesheet()
  project.unsaved = false
})

$document.on('click', '.delete-spritesheet', deleteSpritesheet)
$document.on('click', '.save-spritesheet', function () {
  if (!currentImageData) return
  const path = dialog.showSaveDialog(browserWindow, {
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
  project.unsaved = true
})
function updateAllFacePreviews () {
  const spritesheet = getSelectedSpritesheet()
  $('.face').each(function (index) {
    const $this = $(this)
    if ($this.find('.face-width[value=""]')) {
      spritesheet.faces[index].getPreviewHTML((err, html) => {
        if (err) throw new Error(err)
        $this.children('.face-preview-wrap').remove()
        $this.prepend($(html))
      })
    }
  })
}
$document.on('click', '.set-all-face-dimensions', function () {
  const spritesheet = getSelectedSpritesheet()
  const width = Math.max(parseInt($('.all-width').val()), 0)
  const height = Math.max(parseInt($('.all-height').val()), 0)
  spritesheet.faces.forEach((face, index) => {
    face.width = width
    face.height = height
    $('.faces-container').eq(index).find('.face-width').val(width)
    $('.faces-container').eq(index).find('.face-height').val(height)
  })
  updateAllFacePreviews()
  project.unsaved = true
})

// Events - face controls
$document.on('click', '.add-face', addFaces)
$document.on('click', '.delete-face', function () {
  const $face = $(this).closest('.face')
  getSelectedSpritesheet().faces.splice($face.index(), 1)
  $face.remove()
  // $face.remove()
  project.unsaved = true
})
$document.on('change', '.face-name', function () {
  const $this = $(this)
  const $face = $this.closest('.face')
  const index = $face.index()
  const face = getSelectedSpritesheet().faces[index]
  const val = $this.val()

  // Update face name with value, no checks or anything
  face.name = val
  project.unsaved = true
})
$document.on('change', '.face-width', function () {
  const $this = $(this)
  const $face = $this.closest('.face')
  const index = $face.index()
  const face = getSelectedSpritesheet().faces[index]

  // Get the current value
  let val = parseInt($this.val(), 10)
  // If it's invalid, just set it back to what it was
  if (isNaN(val)) return $this.val(face.width)

  // Write back to the data object
  face.width = val

  // Update the display image with the new dimensions
  face.getPreviewHTML((err, html) => {
    if (err) throw new Error(err)
    $face.children('.face-preview-wrap').remove()
    $face.prepend($(html))
  })
  project.unsaved = true
})
$document.on('change', '.face-height', function () {
  const $this = $(this)
  const $face = $this.closest('.face')
  const index = $face.index()
  const face = getSelectedSpritesheet().faces[index]

  // Get the current value, and change it around if necessary
  let val = parseInt($this.val(), 10)
  if (isNaN(val)) return $this.val(face.height)

  // Write back to the data object
  face.height = val

  // Update the display image with the new dimensions
  face.getPreviewHTML((err, html) => {
    if (err) throw new Error(err)
    $face.children('.face-preview-wrap').remove()
    $face.prepend($(html))
  })
  project.unsaved = true
})
// Resizing
$document.on('click', '.set-face-initial-dimensions', function () {
  const $face = $(this).closest('.face')
  const face = getSelectedSpritesheet().faces[$face.index()]

  // Regenerate face preview with initial resolution
  face.useNativeRes = true
  face.getPreviewHTML((err, html) => {
    if (err) throw new Error(err)
    $face.children('.face-preview-wrap').remove()
    $face.prepend($(html))

    // The width and height properties are updated in this call, so we can
    // set the input values now
    $face.find('.face-width').val(face.width)
    $face.find('.face-height').val(face.height)
  })
  project.unsaved = true
})
$document.on('click', '.scale-face-to-width', function () {
  const $this = $(this)
  const $face = $this.closest('.face')
  const face = getSelectedSpritesheet().faces[$face.index()]
  const $input = $face.find('.scale-face-value')

  // Get value, reset and return if it's 0 or blank
  let val = $input.val()
  if (isNaN(val = parseInt(val, 10)) || val === 0) return $input.val('')

  // Apply scaling things
  face.height = Math.round(val / (face.width / face.height))
  face.width = val

  // Update the display image with the new dimensions
  face.getPreviewHTML((err, html) => {
    if (err) throw new Error(err)
    $face.children('.face-preview-wrap').remove()
    $face.prepend($(html))
  })

  // Update the width and height inputs
  $face.find('.face-width').val(face.width)
  $face.find('.face-height').val(face.height)

  // Reset the value input
  $input.val('')
  project.unsaved = true
})
$document.on('click', '.scale-face-to-height', function () {
  const $this = $(this)
  const $face = $this.closest('.face')
  const face = getSelectedSpritesheet().faces[$face.index()]
  const $input = $face.find('.scale-face-value')

  // Get value, reset and return if it's 0 or blank
  let val = $input.val()
  if (isNaN(val = parseInt(val, 10)) || val === 0) return $input.val('')

  // Apply scaling things
  face.width = Math.round(val / (face.height / face.width))
  face.height = val

  // Update the display image with the new dimensions
  face.getPreviewHTML((err, html) => {
    if (err) throw new Error(err)
    $face.children('.face-preview-wrap').remove()
    $face.prepend($(html))
  })

  // Update the width and height inputs
  $face.find('.face-width').val(face.width)
  $face.find('.face-height').val(face.height)

  // Reset the value input
  $input.val('')
  project.unsaved = true
})

// Events - settings
$document.on('change', '.use-slashes-setting', function () {
  project.settings.useSlashes = $(this).is(':checked')
  project.unsaved = true
})

// Test
document.querySelectorAll('.popover-wrap').forEach(wrapper => {
  const button = wrapper.querySelector('.popover-trigger')
  const box = wrapper.querySelector('.popover-box')
  // Set up initial display
  box.style.display = 'none'
  // Add event listener to toggle later
  button.addEventListener('click', function () {
    if (box.style.display === 'none') {
      box.style.display = 'block'
    } else {
      box.style.display = 'none'
    }
  })
})
// Find closest ancestor with class - http://stackoverflow.com/a/22119674
function findAncestor (el, cls) {
  do {
    el = el.parentElement
  } while (!el.classList.contains(cls))
  return el
}
document.querySelectorAll('.dismisses-popover').forEach(button => {
  const box = findAncestor(button, 'popover-box')
  button.addEventListener('click', function () {
    box.style.display = 'none'
  })
})

// Saving and loading
function setWritePath () {
  const filepath = dialog.showSaveDialog(browserWindow, {
    title: 'Save spritesheet',
    defaultPath: 'MyProject.spset',
    filters: [
      {name: 'Spritesheet collection', extensions: ['spset', 'json']}
    ]
  })
  if (!filepath) return
  project.writePath = filepath
}
function writeProject () {
  const fileContents = JSON.stringify(project.object)
  fs.writeFileSync(project.writePath, fileContents, 'utf-8')
  project.unsaved = false
}
function save () {
  if (!project.writePath) setWritePath()
  writeProject()
}
function saveAs () {
  setWritePath()
  writeProject()
}
function alertIfNotSaved () {
  if (!project.unsaved) return // Only do things if we haven't saved
  const result = dialog.showMessageBox({
    type: 'warning',
    title: 'Unsaved changes',
    message: 'The current project has unsaved changes. What do you want to do?',
    buttons: [
      'Save',
      "Don't Save",
      'Cancel'
    ]
  })
  switch (result) {
    case 0: // "Save" - Save changes, then continue
      save()
      return false
    case 1: // "Don't save" - Ignore changes, continue
      return false
    case 2: // "Cancel" - Stop whatever we were doing
      return true
  }
}

function open () {
  if (alertIfNotSaved()) return
  let filepath = dialog.showOpenDialog(browserWindow, {
    title: 'Import a project',
    properties: [
      'openFile'
    ],
    filters: [
      {name: 'Spritesheet collection', extensions: ['spset', 'json']}
    ]
  })
  if (!filepath) return // showOpenDialog returns undefined on cancel
  filepath = filepath[0]
  const data = fs.readFileSync(filepath, 'utf-8')
  project = new Project(JSON.parse(data))
  project.writePath = filepath
  refreshDisplay()
  project.unsaved = false
}

function newProject () {
  if (alertIfNotSaved()) return
  project = new Project()
  createSpritesheet()
  refreshDisplay()
}

function newSpritesheet () {
  createSpritesheet()
  $('.spritesheet-actions input, .spritesheet-actions button').attr('disabled', false)
}

// Get the default menu, and add our custom file menu to it
let menu = defaultMenu(app, shell)
menu.unshift({
  label: 'Project',
  submenu: [
    {
      label: 'New Project',
      accelerator: 'CmdOrCtrl+Shift+N',
      click: newProject
    },
    {
      label: 'Open Project',
      accelerator: 'CmdOrCtrl+O',
      click: open
    },
    {
      type: 'separator'
    },
    {
      label: 'Save Project',
      accelerator: 'CmdOrCtrl+S',
      click: save
    },
    {
      label: 'Save Project As...',
      accelerator: 'CmdOrCtrl+Shift+S',
      click: saveAs
    }
  ]
}, {
  label: 'Spritesheet',
  submenu: [
    {
      label: 'New Spritesheet',
      accelerator: 'CmdOrCtrl+N',
      click: newSpritesheet
    },
    {
      label: 'Delete This Spritesheet',
      accelerator: 'CmdOrCtrl+Backspace',
      click: deleteSpritesheet
    },
    {
      type: 'separator'
    },
    {
      label: 'Add Faces...',
      accelerator: 'CmdOrCtrl+I',
      click: addFaces
    }
  ]
})
menu[3] = {
  label: 'Dev stuff',
  submenu: [
    {
      label: 'Reload Interface',
      accelerator: 'CmdOrCtrl+Shift+R',
      click: function (item, focusedWindow) {
        if (focusedWindow) focusedWindow.reload()
      }
    },
    {
      label: 'Toggle Developer Tools',
      accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
      click: function (item, focusedWindow) {
        if (focusedWindow) focusedWindow.toggleDevTools()
      }
    }
  ]
} // The original "View" menu
browserWindow.setMenu(Menu.buildFromTemplate(menu))

// Random style thing
// TODO: No inline styles this is shit
$document.ready(function () {
  if (process.platform !== 'darwin') {
    $('body').css('border-top', '1px solid #BBB')
  }
})

// Custom event handler for closing the window. The default close behavior is
// disabled from the main process.
function tryCloseWindow () {
  // Cancel the close if the user hits "cancel"
  if (alertIfNotSaved()) return
  // Otherwise destroy the window, which skips this listener (but still
  // triggers onbeforeunload, etc.)
  browserWindow.destroy()
}
browserWindow.on('close', tryCloseWindow)
// Clean up after ourselves - because parts of the window are dereferenced on
// reload, having leftover listeners creates exceptions
window.addEventListener('beforeunload', function removeCloseListenerBeforeUnload () {
  browserWindow.removeListener('close', tryCloseWindow)
})
