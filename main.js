const {app, BrowserWindow} = require('electron')
const path = require('path')
const url = require('url')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

function createWindow () {
    // Create the browser window and load our stuff
    win = new BrowserWindow({
        width: 1000,
        height: 600,
        autoHideMenuBar: false
    })
    win.setMenu(null) // The menu is loaded from page.js after window load
    win.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }))

    // Emitted when the window wants to close. We override the close function
    // from the renderer process, so we cancel the event beforehand from here.
    win.on('close', function cancelClose (e) {
        e.preventDefault()
    })

    // Emitted when the window is closed.
    win.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        win = null
    })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    // if (process.platform !== 'darwin') {
    //     app.quit()
    // }

    // ... however, we won't do that
    app.quit()
})

// On macOS it's common to re-create a window in the app when the
// dock icon is clicked and there are no other windows open.
// ...however, this would only happen on mac if we allowed the app to stay
// active after closing all windows, which we didn't.

// app.on('activate', () => {
//     if (win === null) {
//         createWindow()
//     }
//
// })
