const express = require('express');
const bodyParser = require('body-parser');
const { spawn } = require('child_process');
const idGen = require('uuid');
// const MongoClient = require('mongodb').MongoClient;
const { MongoClient } = require('mongodb');
// const assert = require('assert');
const NODE_PORT = process.env.PORT || 3003
const app = express();
// static file server in dir public
app.use(express.static('public'));
app.use('/restream', express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.listen(NODE_PORT, () => {
    console.log(`listening on port ${NODE_PORT}!`);
});
const registredStream = [];
/* eslint-disable no-plusplus */

// Promise based getting info about stream
function ffprobeAsync(streamUrl) {
    return new Promise((resolve, reject) => {
        const rtmpTimeoutMs = 5000;
        let data = '';
        const ffprobeOptions = [
            streamUrl,
            '-print_format',
            'json',
            '-v',
            'quiet',
            '-show_format',
            // '-show_streams',
            '-pretty'
        ];
        setTimeout(() => {
            ffprobe.kill();
            reject('response timeout');
        }, rtmpTimeoutMs);
        const ffprobe = spawn('ffprobe', ffprobeOptions);
        ffprobe.stdout.on('data', (dataChunk) => {
            data += dataChunk.toString('utf8');
        });

        ffprobe.stderr.on('data', (probeData) => {
            console.log(`ffprobeAsync stderr: ${probeData}`);
        });

        ffprobe.on('close', (code) => {
            if (code === 0) {
                resolve({ "message": code, "info": JSON.parse(data).format });
            } else {
                console.log('Ffprobe killed code = ', code);
            }

        });
    });
}
// get info about a stream
app.post('/info', (req, res) => {
    console.log(req.body.inputUrl);
    ffprobeAsync(req.body.inputUrl)
        .then((data) => {
            console.log('data from ffprobeAsync = ', data);
            res.send(data);
        })
        .catch((reason) => {
            res.send({ "message": reason, "info": "Cannot connect to stream!" });
        });
});
// restream stream
let ffmpegRestream;
// app.post('/restream', (req, res) => {
//     let counter = 0;
//     const { inputUrl, outputUrl, action } = req.body;
//     const ffmpegOptions = [
//         '-hide_banner',
//         '-re',
//         '-i',
//         inputUrl,
//         '-codec',
//         'copy',
//         '-f',
//         'flv',
//         outputUrl
//     ];
//     console.log('action = ', action);
//     if (action === 'run') {
//         res.send({ "status": "starting" });

//         // set ffmpeg options
//         ffmpegRestream = spawn('ffmpeg', ffmpegOptions, { stdio: ['pipe', 'pipe', process.stderr] });

//         // yes ffmpeg send status to stderr
//         ffmpegRestream.stderr.on('data', (data) => {
//             console.log('datachunk #=', counter++);
//             console.log(+data.toString());
//         });
//         ffmpegRestream.on('close', (code) => {
//             console.log(`child process exited with code ${code}`);
//             // res.send({ "status": "closed" });
//         });
//     } else if (action === 'keep') {
//         // do something
//         ffmpegRestream.stderr.on('data', (data) => {
//             console.log('datachunk #=', counter++);
//             console.log(`${data}`);
//         });
//     } else if (action === 'kill') {
//         ffmpegRestream.kill();
//         res.send({ "status": "killed" });
//     }
// });

function ffmpegSpawnAsync(input, output, action) {
    const ffmpegOptions = [
        '-loglevel',
        'warning',
        '-hide_banner',
        '-re',
        '-i',
        input,
        '-codec',
        'copy',
        '-f',
        'flv',
        output
    ];
    return spawn('ffmpeg', ffmpegOptions);
}
app.post('/addstream', (req, res) => {
    // get info about input stream
    ffprobeAsync(req.body.inputUrl)
        .then((data) => {
            registredStream.push({
                id: idGen.v1(),
                name: req.body.name,
                inputUrl: req.body.inputUrl,
                outputUrl: req.body.outputUrl,
                data: data,
                procObj: ffmpegSpawnAsync(req.body.inputUrl, req.body.outputUrl)

            });
            const idToKill = registredStream[registredStream.length - 1].id;
            registredStream[registredStream.length - 1].procObj.on('close', (code) => {
                console.log(`child process exited with code ${code}`);
                const curId = idToKill;
                console.log('id = ', curId);

                // register callback for auto removing stream proces from db when proces die
                registredStream.forEach((item, i, arr) => {
                    if (item.id === idToKill) {
                        console.log('item id', item.id);
                        // remove selected stream srom database
                        registredStream.splice(i, 1);

                    }
                });

            });
            registredStream[registredStream.length - 1].procObj.stderr.on('data', (code) => {
                console.log(req.body.name + ' - ' + code.toString());
            });
            return registredStream;
        })
        .then((streams) => {
            // console.log('streams - ', streams);
            const dataForSend = [];
            // prepare data for sending to front
            streams.forEach((item, i, arr) => {
                dataForSend.push({ "id": item.id, "name": item.name, "inputUrl": item.inputUrl, "outputUrl": item.outputUrl, "data": item.data })
            })
            res.send(dataForSend);
        });
    // if input stream ok create stream object in streams array with name, input, id, proc object
    // return info with report and status
});
// list streams in db
app.get('/liststreams', (req, res) => {
    const dataForSend = [];
    registredStream.forEach((item, i, arr) => {
        dataForSend.push({ "id": item.id, "name": item.name, "inputUrl": item.inputUrl, "outputUrl": item.outputUrl, "data": item.data })
    })
    res.send(dataForSend);
});
// kill process and remove entry from db
app.delete('/streams', (req, res) => {
    const idToKill = req.body.id;
    console.log('id to kill', idToKill);
    registredStream.forEach((item, i, arr) => {
        if (item.id === idToKill) {
            console.log('Killed ' + item.name + ' - item id - ', item.id);
            item.procObj.kill();
            // remove selected stream srom database
            registredStream.splice(i, 1);

        }
    });
    const dataForSend = [];
    registredStream.forEach((item, i, arr) => {
        dataForSend.push({ "id": item.id, "name": item.name, "inputUrl": item.inputUrl, "outputUrl": item.outputUrl, "data": item.data })
    })
    res.send(dataForSend);
});