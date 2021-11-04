const express = require('express');
const bodyParser = require('body-parser');
const { spawn } = require('child_process');
const idGen = require('uuid');
const logger = require('./logger');
// const MongoClient = require('mongodb').MongoClient;
// const assert = require('assert');
const NODE_PORT = process.env.PORT || 3003;
const app = express();
// static file server in dir public
app.use(express.static('public'));
app.use('/restream', express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true,
}));
app.listen(NODE_PORT, () => {
  logger(`listening on port ${NODE_PORT}!`);
});
const registeredStreams = [];
/* eslint-disable no-plusplus */

// Promise based getting info about stream
function ffprobeAsync(streamUrl) {
  return new Promise((resolve, reject) => {
    const rtmpTimeoutMs = 10000;
    let data = '';
    const ffprobeOptions = [
      streamUrl,
      '-print_format',
      'json',
      '-v',
      'quiet',
      '-show_format',
      // '-show_streams',
      '-pretty',
    ];
    const ffprobe = spawn('ffprobe', ffprobeOptions);
    setTimeout(() => {
      ffprobe.kill();
      reject(new Error('Stream response timeout'));
    }, rtmpTimeoutMs);
    ffprobe.stdout.on('data', (dataChunk) => {
      data += dataChunk.toString('utf8');
    });

    ffprobe.stderr.on('data', (probeData) => {
      logger(`ffprobeAsync stderr: ${probeData}`);
    });

    ffprobe.on('close', (code) => {
      if (code === 0) {
        resolve({ message: code, info: JSON.parse(data).format });
      } else {
        logger('Ffprobe killed code = ', code);
      }
    });
  });
}
// get info about a stream
app.post('/info', (req, res) => {
  logger(req.body.inputUrl);
  ffprobeAsync(req.body.inputUrl)
    .then((data) => {
      logger('data from ffprobeAsync = ', data);
      res.send(data);
    })
    .catch((reason) => {
      res.send({ message: reason, info: 'Cannot connect to stream!' });
    });
});
// restream stream
// let ffmpegRestream;
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
//     logger('action = ', action);
//     if (action === 'run') {
//         res.send({ "status": "starting" });

//         // set ffmpeg options
//         ffmpegRestream = spawn('ffmpeg', ffmpegOptions, { stdio: ['pipe', 'pipe', process.stderr] });

//         // yes ffmpeg send status to stderr
//         ffmpegRestream.stderr.on('data', (data) => {
//             logger('datachunk #=', counter++);
//             logger(+data.toString());
//         });
//         ffmpegRestream.on('close', (code) => {
//             logger(`child process exited with code ${code}`);
//             // res.send({ "status": "closed" });
//         });
//     } else if (action === 'keep') {
//         // do something
//         ffmpegRestream.stderr.on('data', (data) => {
//             logger('datachunk #=', counter++);
//             logger(`${data}`);
//         });
//     } else if (action === 'kill') {
//         ffmpegRestream.kill();
//         res.send({ "status": "killed" });
//     }
// });

function ffmpegSpawnAsync(input, output) {
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
    output,
  ];
  return spawn('ffmpeg', ffmpegOptions);
}
app.post('/addstream', async (req, res) => {
  // get info about input stream
  const streamInfo = await ffprobeAsync(req.body.inputUrl);

  const procObj = ffmpegSpawnAsync(req.body.inputUrl, req.body.outputUrl);
  const stream = {
    id: idGen.v1(),
    name: req.body.name,
    inputUrl: req.body.inputUrl,
    outputUrl: req.body.outputUrl,
    data: streamInfo,
    procObj,
  };
  registeredStreams.push(stream);
  const idToKill = stream.id;
  stream.procObj.on('close', (code) => {
    logger(`child process exited with code ${code}`);
    const curId = idToKill;
    logger('id = ', curId);

    // register callback for auto removing stream proces from db when proces die
    registeredStreams.forEach((item, i) => {
      if (item.id === idToKill) {
        logger('item id', item.id);
        // remove selected stream srom database
        registeredStreams.splice(i, 1);
      }
    });
  });
  stream.procObj.stderr.on('data', (code) => {
    logger(`${req.body.name} - ${code.toString()}`);
  });

  // logger('streams - ', streams);

  // prepare data for sending to front
  const dataForSend = registeredStreams.map(({
    id, name, inputUrl, outputUrl, data,
  }) => ({
    id,
    name,
    inputUrl,
    outputUrl,
    data,
  }));
  res.send(dataForSend);
  // if input stream ok create stream object in streams array with name, input, id, proc object
  // return info with report and status
});
// list streams in db
app.get('/liststreams', (req, res) => {
  const dataForSend = [];
  registeredStreams.forEach(({
    id, name, inputUrl, outputUrl, data,
  }) => {
    dataForSend.push({
      id,
      name,
      inputUrl,
      outputUrl,
      data,
    });
  });
  res.send(dataForSend);
});
// kill process and remove entry from db
app.delete('/streams', (req, res) => {
  const idToKill = req.body.id;
  logger('id to kill', idToKill);
  registeredStreams.forEach((item, i) => {
    if (item.id === idToKill) {
      logger(`Killed ${item.name} - item id - `, item.id);
      item.procObj.kill();
      // remove selected stream srom database
      registeredStreams.splice(i, 1);
    }
  });
  const dataForSend = [];
  registeredStreams.forEach(({
    id, name, inputUrl, outputUrl, data,
  }) => {
    dataForSend.push({
      id,
      name,
      inputUrl,
      outputUrl,
      data,
    });
  });
  res.send(dataForSend);
});
