(function() {
    function renderStreamList(data) {
        var dataToMount = '';
        for (var i = 0; i < data.length; i++) {
            dataToMount += '<li id="' + data[i].id + '"> Stream name - ' + data[i].name + ' ' + data[i].outputUrl + ' id = ' +
                data[i].id + ' <button class="btn-kill" id="' + data[i].id + '"> Kill! </button></li>';
        }
        document.getElementById('stream-list-ul').innerHTML = dataToMount;

    }
    // render stream list on page load
    $.get('/liststreams', function(data) {
        renderStreamList(data);
    });
    console.log('JS WORK!!!');
    $('#btn-info').on('click', function(evt) {
        var inputUrl = document.getElementById('in-str-url').value;
        $.post('/info', { "inputUrl": inputUrl }, function(data) {
            console.log('url to send', inputUrl);
            console.log('data recieved!! ', data.info);
            if (data.message == 0) {
                document.getElementById('stream-info').innerHTML = '<p> Source = ' + data.info.filename + '</p><p> Format = ' + data.info.format_long_name + '</p>' +
                    '<p> FPS = ' + data.info.tags.fps + '</p>' +
                    '<p> Size = ' + data.info.tags.displayWidth + 'x' + data.info.tags.displayHeight + '</p>';
            } else {
                document.getElementById('stream-info').innerHTML = '<p> Source = ' + data.message + '</p>';
            }

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
    $('#btn-add-new').on('click', function(evt) {
        var input = document.getElementById('in-str-url-reg').value;
        var output = document.getElementById('out-str-url-reg').value;
        var name = document.getElementById('name-reg').value;
        var streamList = document.getElementById('stream-list-ul').innerHTML;
        // var btnStartStop = document.getElementById('btn-start-stop');
        $.post('/addstream', { "inputUrl": input, "outputUrl": output, "name": name }, function(data) {
            console.log('after_add_response = ', data);
            console.log('data length = ', data.length);
            renderStreamList(data);
        });
    });
    $('#btn-refrash-list').on('click', function(evt) {
        $.get('/liststreams', function(data) {
            renderStreamList(data);
        });
    });
    $('#stream-list-ul').on('click', function(evt) {
        console.log('evt target = ', evt.target);
        if ($(evt.target).hasClass('btn-kill')) {
            $.ajax({
                url: '/streams',
                type: 'delete',
                data: { "id": $(evt.target).attr('id') },
                success: function(newdata) { renderStreamList(newdata) }
            })
        }
    });
})();