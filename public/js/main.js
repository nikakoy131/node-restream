(function() {
    console.log('JS WORK!!!');
    $('#btn-info').on('click', function(evt) {
        var inputUrl = document.getElementById('in-str-url').value;
        $.post('/info', { "inputUrl": inputUrl }, function(data) {
            console.log('url to send', inputUrl);
            console.log('data recieved!! ', data.info);
            document.getElementById('stream-info').innerHTML = '<p> Source = ' + data.info.filename + '</p><p> Format = ' + data.info.format_long_name + '</p>' +
                '<p> FPS = ' + data.info.tags.fps + '</p>' +
                '<p> Size = ' + data.info.tags.displayWidth + 'x' + data.info.tags.displayHeight + '</p>';
        })
    });
    $('#btn-start-stop').on('click', function(evt) {
        var inputUrl = document.getElementById('in-str-url').value;
        var outputUrl = document.getElementById('out-str-url').value;
        var btnStartStop = document.getElementById('btn-start-stop');
        if (btnStartStop.innerText == 'Start') {
            $.post('/restream', { "inputUrl": inputUrl, "outputUrl": outputUrl, "action": "run" }, function(data) {
                console.log('status - ', data.status);
                document.getElementById('btn-start-stop').innerText = "Stop";
            })
        } else if (btnStartStop.innerText == "Stop") {
            $.post('/restream', { "inputUrl": inputUrl, "outputUrl": outputUrl, "action": "kill" }, function(data) {
                console.log('status - ', data.status);
                document.getElementById('btn-start-stop').innerText = "Start";
            })
        }
    });
})();