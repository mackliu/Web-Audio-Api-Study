//audioContext 相容性判斷
isSupport()

function isSupport() {
  try {
    window.AudioContext = window.AudioContext || webkitAudioContext;
    window.OfflineAudioContext = window.OfflineAudioContext || window.webkitOfflineAudioContext
  } catch {
    document.write("你的瀏灠器可能不支援新的網頁音源技術，建議使用Chrome或是firefox來瀏灠")
  }
}

$("#open").on("change", function () {
  let files = $("#open").get(0).files[0];

  let infoReader = new FileReader();
  infoReader.onload = function (e) {
    $("audio").get(0).setAttribute("src", e.target.result);
    if(draw){
      clearInterval(draw)
    }

  }
  infoReader.readAsDataURL(files)
})

//全域變數
let context = null;
let audio = null;
let source = null;
let analyser = null;
let draw = null;
let waveQueue = new Uint8Array(0);

//取得頁面上的canvas物件
let cvf = $("#frequency").get(0).getContext("2d");
let cvw = $("#wave").get(0).getContext("2d");
let advcvf = $("#advFreq").get(0).getContext("2d");
let advcvw = $("#advWave").get(0).getContext("2d");
let cvwWidth = $("#wave").width();
let cvwHeight = $("#wave").height();


//設定頻率條的漸層顏色
let gradientf = cvf.createLinearGradient(0, 0, 0, 260);
gradientf.addColorStop(1, '#0f0');
gradientf.addColorStop(0.5, '#ff0');
gradientf.addColorStop(0, '#f00');

//設定波形圖線條的漸層顏色
let gradientw = cvw.createLinearGradient(0, 0, 0, 256);
gradientw.addColorStop(1, '#f00');
gradientw.addColorStop(0.65, '#ff0');
gradientw.addColorStop(0.5, '#0f0');
gradientw.addColorStop(0.35, '#ff0');
gradientw.addColorStop(0, '#f00');

//使用者按下播放鍵時開始執行繪圖更新的動作
$("audio").on("playing", function () {
  if (this.currentTime > 0) {
    draw = setInterval(update, 100, analyser);
    $(this).get(0).volume=0.5
  } else {
    $(this).get(0).volume=0.5
    playing();
  }
})

//播放結束時，停止繪製
$("audio").on("ended", function () {
  clearInterval(draw);
})

//暫停播放時，停止繪製
$("audio").on("pause", function () {
  clearInterval(draw);
})

function playing() {
  if (context == null) {
    context = new AudioContext();
  }
  audio = $("audio").get(0)
  if (source == null) {
    source = context.createMediaElementSource(audio);
  }
  analyser = context.createAnalyser();
  analyser.fftSize = 256;
  analyser.connect(context.destination);
  source.connect(analyser);
  draw = setInterval(update, 100, analyser);
}

//更新當前聲音資料
function update(analyser) {
  let frequency = new Uint8Array(analyser.frequencyBinCount);
  let wave = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(frequency);
  analyser.getByteTimeDomainData(wave);
  drawFrequency(frequency);
  advFreq(frequency)
  drawWave(wave);
  advWave(wave)
}

//繪製頻率的函式
function drawFrequency(array) {
  cvf.clearRect(0, 0, 400, 260);
  array.forEach(function (val, index) {
    cvf.fillStyle = gradientf;
    cvf.fillRect(index * 3, 260 - val, 2, val);
  })
}

function advFreq(array) {
  advcvf.clearRect(0, 0, 800, 256);
  let na = array.filter(function (val, index) {
    return val > 1
  })
  let start = ((160 - na.length) / 2) * 5
  na.sort(function (a, b) {
    return Math.random() > 0.5 ? -1 : 1;
  })
  na.forEach(function (val, index) {
    advcvf.fillStyle = gradientf;
    advcvf.fillRect(start + index * 5, 260 - (val * 0.85), 4, val * 0.85);
  })
}

//繪製波形的函式
function drawWave(array) {
  cvw.clearRect(0, 0, 128, 256);
  array.forEach(function (val, index) {
    cvw.fillStyle = gradientw;
    let y, h;
    if (val - 128 > 0) {
      h = ((val - 128) / 128) * (cvwHeight / 2);
      y = (cvwHeight / 2) - h;
    } else {
      y = (cvwHeight / 2);
      h = Math.abs(val - 128) / 128 * (cvwHeight / 2);
    }
    cvw.fillRect(index, y, 1, h);
  })
}


function advWave(array) {
  advcvw.clearRect(0, 0, 800, 256);
  waveQueue = appendBuffer(waveQueue, array)
  if (waveQueue.length > 896) {
    waveQueue = waveQueue.filter(function (val, index) {
      return index > 127;
    })
  }
  waveQueue.forEach(function (val, index) {
    if (index < 800) {
      advcvw.fillStyle = gradientw;
      let y, h;
      if (val - 128 > 0) {
        h = ((val - 128) / 128) * (cvwHeight / 2);
        y = (cvwHeight / 2) - h;
      } else {
        y = (cvwHeight / 2);
        h = Math.abs(val - 128) / 128 * (cvwHeight / 2);
      }
      advcvw.fillRect(index, y, 1, h);
    }
  })
}

//連接兩個Uni8Array
function appendBuffer(buffer1, buffer2) {
  let tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
  tmp.set(new Uint8Array(buffer1), 0);
  tmp.set(new Uint8Array(buffer2), buffer1.byteLength)
  return tmp;
}