/* global $ */
// eslint-disable-next-line func-names
(function () {
  function logger(...args) {
    // eslint-disable-next-line no-console
    console.log(...args);
  }
  function renderStreamList(data) {
    let dataToMount = '';
    let i;
    for (i = 0; i < data.length; i++) {
      dataToMount += `<li id="${data[i].id}"> Stream name - ${data[i].name} ${data[i].outputUrl} id = ${
        data[i].id} <button class="btn-kill" id="${data[i].id}"> Kill! </button></li>`;
    }
    document.getElementById('stream-list-ul').innerHTML = dataToMount;
  }
  // render stream list on page load
  $.get('liststreams', (data) => {
    renderStreamList(data);
  });
  logger('JS WORK!!!');
  $('#btn-info').on('click', () => {
    const inputUrl = document.getElementById('in-str-url').value;
    $.post('info', { inputUrl }, (data) => {
      logger('url to send', inputUrl);
      logger('data received!! ', data.info);
      if (data.message === 0) {
        document.getElementById('stream-info').innerHTML = `<p> Source = ${data.info.filename}</p>`
        + `<p> Format = ${data.info.format_long_name}</p>`
        + `<p> FPS = ${data.info.tags.fps}</p>`
        + `<p> Size = ${data.info.tags.displayWidth}x${data.info.tags.displayHeight}</p>`;
      } else {
        document.getElementById('stream-info').innerHTML = `<p> Source = ${data.message}</p>`;
      }
    });
  });
  $('#btn-start-stop').on('click', () => {
    const inputUrl = document.getElementById('in-str-url').value;
    const outputUrl = document.getElementById('out-str-url').value;
    const btnStartStop = document.getElementById('btn-start-stop');
    if (btnStartStop.innerText === 'Start') {
      $.post('restream', { inputUrl, outputUrl, action: 'run' }, (data) => {
        logger('status - ', data.status);
        document.getElementById('btn-start-stop').innerText = 'Stop';
      });
    } else if (btnStartStop.innerText === 'Stop') {
      $.post('restream', { inputUrl, outputUrl, action: 'kill' }, (data) => {
        logger('status - ', data.status);
        document.getElementById('btn-start-stop').innerText = 'Start';
      });
    }
  });
  $('#btn-add-new').on('click', () => {
    const input = document.getElementById('in-str-url-reg').value;
    const output = document.getElementById('out-str-url-reg').value;
    const name = document.getElementById('name-reg').value;
    // var streamList = document.getElementById('stream-list-ul').innerHTML;
    // var btnStartStop = document.getElementById('btn-start-stop');
    $.post('addstream', { inputUrl: input, outputUrl: output, name }, (data) => {
      logger('after_add_response = ', data);
      logger('data length = ', data.length);
      renderStreamList(data);
    });
  });
  $('#btn-refrash-list').on('click', () => {
    $.get('liststreams', (data) => {
      renderStreamList(data);
    });
  });
  $('#stream-list-ul').on('click', (evt) => {
    logger('evt target = ', evt.target);
    if ($(evt.target).hasClass('btn-kill')) {
      $.ajax({
        url: 'streams',
        type: 'delete',
        data: { id: $(evt.target).attr('id') },
        success(newData) { renderStreamList(newData); },
      });
    }
  });
}());
