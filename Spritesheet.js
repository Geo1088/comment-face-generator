const Face = require('./Face.js')

class Spritesheet {
    constructor (data) {
        this.name = data.name || 'Sheet'
        this.faces = []
        this.defaultWidth = data.defaultWidth
        this.defaultHeight = data.defaultHeight
    }

    createFace (data) {
        this.addFace(new Face(data))
    }

    addFace (face) {
        this.faces.push(face)
        face.spritesheet = this
    }

    removeFace (face) {
        if (typeof face === 'number')
            delete this.faces[face]
        else
            delete this.faces[this.faces.indexOf(face)]
    }

    get listItem () {
        return `<li class="spritesheet">${this.name}</li>`
    }

    get CSS () {
        let css = this.faces.map(f => f.fullCSS).join('\n') + `\n
${this.faces.map(f => f.selector).join(',')}{
\tbackground-image: url(%%${this.name}%%);
\twidth: ${this.defaultWidth}px;
\theight: ${this.defaultHeight}px;
}`
        return css
    }

    clickHandler () {

    }
}

module.exports = Spritesheet
