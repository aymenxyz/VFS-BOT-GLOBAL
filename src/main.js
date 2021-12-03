var childProcess = require('child_process');
var telegramBot = require('./telegramBot');
function runScript(scriptPath, callback) {

    // keep track of whether callback has been invoked to prevent multiple invocations
    var invoked = false;

    var process = childProcess.fork(scriptPath);

    // listen for errors as they may prevent the exit event from firing
    // execute the callback once the process has finished running
    process.on('exit', function (code) {
        if (invoked) return;
        invoked = true;
        var err = code === 0 ? null : new Error('exit code ' + code);
        telegramBot.sendMessage('botExited');
        runScript('./index.js');
       // callback(err);
    });

}

// Now we can run a script and invoke a callback when complete, e.g.
runScript('./index.js', function (err) {
    if (err) throw err;
    console.log('finished running index.js');
});