const {dialog} = require('electron').remote

function doThing () {
    dialog.showOpenDialog({
        title: 'test'
    }, filenames => {
        if (filenames.length < 1) return

        document.getElementById('preview-img').setAttribute('src', filenames[0])
    })
}
