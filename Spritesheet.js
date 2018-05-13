const Jimp = require('jimp')
const Face = require('./Face')

// im bad - http://stackoverflow.com/a/1053865
function mode (array) {
  if (array.length === 0) return null

  let modeMap = {}
  let maxEl = array[0]
  let maxCount = 1

  for (let i = 0; i < array.length; i++) {
    let el = array[i]
    if (modeMap[el] == null) {
      modeMap[el] = 1
    } else {
      modeMap[el]++
    }
    if (modeMap[el] > maxCount) {
      maxEl = el
      maxCount = modeMap[el]
    }
  }
  return maxEl
}

class Spritesheet {
  constructor (data) {
    this.name = data.name || 'Sheet'
    this.faces = []

    this.project = null

    // If faces are provided, add them
    if (data.faces) {
      for (let faceData of data.faces) {
        this.createFace(faceData)
      }
    }
  }

  createFace (data) {
    const face = new Face(data)
    this.addFace(face)
    return face
  }

  addFace (face) {
    this.faces.push(face)
    face.spritesheet = this
  }

  removeFace (face) {
    const index = (typeof face === 'number' ? face : this.faces.indexOf(face))
    this.faces[index].spritesheet = null
    this.faces.splice(index, 1)
  }

  get listItem () {
    return `<li class="spritesheet">${this.name}</li>`
  }

  get fullCSS () {
    // First, we have to figure out what the modt-used width and height are
    let widths = []
    let heights = []
    for (let face of this.faces) {
      widths.push(face.width)
      heights.push(face.height)
    }
    const defaultWidth = mode(widths)
    const defaultHeight = mode(heights)

    // Now we can do a bunch of mapping and return a string
    return this.faces.map(f => f.fullCSS(defaultWidth, defaultHeight)).join('\n') + `\n
${this.faces.map(f => f.selector).join(',')}{
\tbackground-image: url(%%${this.name}%%);
\twidth: ${defaultWidth}px;
\theight: ${defaultHeight}px;
}`
  }

  generateSpritesheet (callback) {
    console.log('# Generating spritesheet for sheet', this.name)
    // First, calculate the width and height needed for the new image by
    // taking the sum of heights and the largest width
    let fullWidth = 0
    let fullHeight = 0
    for (let face of this.faces) {
      fullWidth = Math.max(face.width, fullWidth)
      fullHeight += face.height
    }

    // Now that we know the dimensions, we can create a new image and add
    // each face image to it.
    new Jimp(fullWidth, fullHeight, (err, spritesheetImage) => {
      if (err) callback(err)

      // Recursive function to construct the spritesheet from each face
      const faces = this.faces // using `this` inside the recursive function is hard
      ;(function placeFace (index = 0, traversedHeight = 0) {
        // If we're done, call back with the full image
        if (index >= faces.length) return callback(null, spritesheetImage)
        // Get the image data
        faces[index].sizedImage((err, faceImage) => {
          console.log('Placing image on spritesheet at height', traversedHeight)
          if (err) callback(err)
          // Blit the image
          spritesheetImage.blit(faceImage, 0, traversedHeight)
          // Bump vars and move to next image
          placeFace(index + 1, traversedHeight + faceImage.bitmap.height)
        })
      })()
    })
  }

  // // generateSpritesheet() can be called from the console like so
  // project.spritesheets[0].generateSpritesheet((err, image) => {
  //     image.write('test.png')
  // })

  get object () {
    return {
      name: this.name,
      faces: this.faces.map(face => face.object)
    }
  }
}

module.exports = Spritesheet
