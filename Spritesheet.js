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

    clickHandler () {

    }
}

module.exports = Spritesheet
