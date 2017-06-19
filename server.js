const express = require('express');
const bodyParser = require('body-parser');
const { spawn } = require('child_process');
const app = express();
// static file server in dir public
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.get('/', function(req, res) {
    res.send('Hello World!');
});
// get info about a stream
app.post('/info', function(req, res) {
    console.log(req.body.inputUrl);
    let wholeInfo = '';
    const { spawn } = require('child_process');
    const ffprobe = spawn('ffprobe', [
        req.body.inputUrl,
        '-print_format',
        'json',
        '-v',
        'quiet',
        '-show_format',
        //'-show_streams',
        '-pretty'

    ]);
    let counter = 0;
    ffprobe.stdout.on('data', (data) => {
        //console.log(`${data}`);
        //res.send({ "info": data });
        // if (data.streams.length > 0) wholeInfo.push(data.streams);
        console.log('type', typeof(data));
        console.log('data ', data.toString('utf8'));
        console.log('counter ', counter++);
        wholeInfo += data.toString('utf8');
    });

    ffprobe.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`);
        //res.send({ "message": data });
    });

    ffprobe.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
        console.log(wholeInfo);
        res.send({ "message": code, "info": JSON.parse(wholeInfo).format });

        // res.send({ wholeInfo });
    });

});
// restream stream
let ffmpegRestream;
app.post('/restream', function(req, res) {
    let inputUrl = req.body.inputUrl;
    let outputUrl = req.body.outputUrl;
    let action = req.body.action;
    if (action == 'run') {
        res.send({ "status": "starting" });
        ffmpegRestream = spawn('ffmpeg', [
            '-hide_banner',
            '-re',
            '-i',
            inputUrl,
            '-codec',
            'copy',
            '-f',
            'flv',
            outputUrl
        ]);
        ffmpegRestream.stderr.on('data', (data) => {

            console.log(`${data}`);
        });
        ffmpegRestream.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
            //res.send({ "status": "closed" });
        });
    } else if (action == 'keep') {
        // do something
    } else if (action == 'kill') {
        ffmpegRestream.kill();
        res.send({ "status": "killed" });
    }


});

app.listen(3003, function() {
    console.log('listening on port 3000!');
});