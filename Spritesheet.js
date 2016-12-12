const jimp = require('jimp')
const Face = require('./Face.js')

class Spritesheet {
    constructor (data) {
        this.name = data.name || 'Sheet'
        this.faces = []
        this.defaultWidth = data.defaultWidth
        this.defaultHeight = data.defaultHeight

        this.project = null
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
        return this.faces.map(f => f.fullCSS).join('\n') + `\n
${this.faces.map(f => f.selector).join(',')}{
\tbackground-image: url(%%${this.name}%%);
\twidth: ${this.defaultWidth}px;
\theight: ${this.defaultHeight}px;
}`
    }

    generateSpritesheet (callback) {
        console.log('# Generating spritesheet for sheet', this.name)
        // First, calculate the width and height needed for the new image by
        // taking the sum of heights and the largest width
        let fullWidth = 0
        let fullHeight = 0
        for (let face of this.faces) {
            fullWidth = Math.max(face.computedWidth, fullWidth)
            fullHeight += face.computedHeight
        }

        // Now that we know the dimensions, we can create a new image and add
        // each face image to it.
        new jimp(fullWidth, fullHeight, (err, spritesheetImage) => {
            if (err) callback(err)

            // Recursive function to construct the spritesheet from each face
            let index = 0
            let traversedHeight = 0
            let faces = this.faces

            function placeFace() {
                // If we're done, call back with the full image
                if (index >= faces.length) return callback(null, spritesheetImage)
                // Get the image data
                faces[index].sizedImage((err, faceImage) => {
                    console.log('Placing image on spritesheet at height', traversedHeight)
                    if (err) callback(err)
                    // Blit the image
                    spritesheetImage.blit(faceImage, 0, traversedHeight)
                    // Bump vars and move to next image
                    traversedHeight += faceImage.bitmap.height
                    placeFace(index++)
                })
            }
            placeFace(index)
        })
    }

    // // generateSpritesheet() can be called from the console like so
    // project.spritesheets[0].generateSpritesheet((err, image) => {
    //     image.write('test.png')
    // })
}

module.exports = Spritesheet
