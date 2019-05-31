let start = 0;
let end = Array();
let all = 0;
let decodeStart = Array();
let decodeEnd = 0;
let lines = Array();

let ca, cache, cal;

//建立一個各種漸層線條的快取陣列
for (let i = 0; i < 256; i++) {
  let ca = document.createElement("canvas")
  ca.width = 1;
  ca.height = i > 0 ? i : 1;
  let cache = ca.getContext("2d")
  if (i > 5) {
    cal = cache.createLinearGradient(0.5, 0, 0.5, i)
    cal.addColorStop(1, '#f00');
    cal.addColorStop(0.85, '#ff0');
    cal.addColorStop(0.5, '#0f0');
    cal.addColorStop(0.15, '#ff0');
    cal.addColorStop(0, '#f00');
  } else {
    cal = "#00ff00";
  }
  cache.strokeStyle = cal;
  cache.beginPath();
  cache.moveTo(0.5, 0)
  cache.lineTo(0.5, i)
  cache.closePath();
  cache.stroke();
  lines.push(ca)
}

$("#audio").on("change", function () {
  start = Date.now();
  let files = $("#audio").get(0).files;
  all = files.length;
  $("#audioList").html("");
  $.each(files, function (idx, file) {
    $("#audioList").append(function () {
      let listItem = document.createElement("li")
      let listH3 = document.createElement("h3")
      let tmp = file.name.split(".");
      let filename = "";
      tmp.forEach(function (val, index) {
        if (index < tmp.length - 1) {
          filename = filename + val;
        }
      })
      filename = filename.substr(0, 15)
      let listTitle = document.createTextNode(filename)
      let listAudio = document.createElement("audio")
      listAudio.setAttribute("src", URL.createObjectURL(file));
      let listPlayBtn = document.createElement("button")
      listPlayBtn.setAttribute("class", "audio-btn")
      listH3.appendChild(listTitle)
      listH3.appendChild(listPlayBtn)
      listH3.appendChild(listAudio)
      listItem.appendChild(listH3)
      let waitbar = document.createElement("div")
      waitbar.setAttribute("class", "wait")
      listItem.appendChild(waitbar)
      let bufferReader = new FileReader();
      bufferReader.onload = function (e) {
        audioInfo(e.target.result, listItem)
      }
      bufferReader.readAsArrayBuffer(file)
      return listItem;
    })
  })

  $("h3 .audio-btn").on("click", function () {
    if ($(this).next("audio").get(0).paused == true) {
      $(this).css({
        "background": "url('play-button.png')",
        "background-size": "contain"
      })

      $(this).next("audio").get(0).volume = 0.2;
      $(this).next("audio").get(0).play();

    } else {
      $(this).next("audio").get(0).pause();
      $(".audio-btn").css({
        "background": "url('pause-button.png')",
        "background-size": "contain"
      });
    }
  })

  $("audio").on("ended", function () {
    $(".audio-btn").css({
      "background": "url('pause-button.png')",
      "background-size": "contain"
    });
  })
})

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

//取得音源的資訊
function audioInfo(file, dom) {
  //建立一個AudioContext物件
  let context = new AudioContext();
  decodeStart.push(Date.now())
  context.decodeAudioData(file, function (buffer) {
    decodeEnd = Date.now();
    let source = context.createBufferSource();
    source.buffer = buffer;
    let duration = buffer.duration
    let sampleRate = context.sampleRate;
    let audioBuffer = sampleRate * duration;
    let channels = context.destination.channelCount;
    info = {
      duration: duration,
      sampleRate: sampleRate,
      audioBuffer: audioBuffer,
      channels: channels,
      dom: dom,
      buffer: buffer
    }
    getBufferSource(info)
  })
}
let draws = Array(); //計算繪圖時間的陣列


//轉換檔案為buffer並處理音源內容
function getBufferSource(info) {
  draws.push(Date.now());
  let context = new OfflineAudioContext(info.channels, info.audioBuffer, info.sampleRate);
  let fft = setFftSize(info.duration)
  let processor = context.createScriptProcessor(fft, 1, 1)
  let analyser = context.createAnalyser();
  analyser.fftSize = fft;
  let source = context.createBufferSource();
  processor.connect(context.destination);
  source.connect(analyser);
  analyser.connect(processor);
  let frequency = 0;
  let pos = 0;
  let clip = Math.ceil(info.audioBuffer / fft)
  let gap = Math.ceil(clip / 256);
  let dataSet = Array();
  let canvas = document.createElement("canvas");
  let width
  if (clip > 128) {
    width = 256;
  } else if (clip > 64) {
    width = 128;
  } else {
    width = 64;
  }
  canvas.setAttribute("width", width)
  canvas.setAttribute("height", "128")
  $(info.dom).append(canvas)
  let ctx = canvas.getContext("2d")
  let drawsData = Array();
  let data = new Uint8Array(analyser.frequencyBinCount)
  processor.onaudioprocess = function (e) {
    analyser.getByteTimeDomainData(data);
    let height = waveDistance(data);
    frequency++
    dataSet.push({
      time: context.currentTime,
      height: height
    });

    if (frequency % gap == 0) {
      drawsData.push([pos, height])
      pos++;
    }
  }
  source.buffer = info.buffer;
  source.start(0);
  context.startRendering();

  //解析完成時，解除連結，同時分析檔案中的空白
  context.oncomplete = function () {
    processor.disconnect();
    source.disconnect();
    analyser.disconnect();
    $(info.dom).children(".wait").hide();
    drawAudio(drawsData, 128, ctx)
    end.push(Date.now())
    if (end.length >= all) {
      console.log("full time : " + (Math.max.apply(Math, end) - start));
      console.log("decode time : " + (decodeEnd - Math.min.apply(Math, decodeStart)))
      console.log("draw timw : " + (Math.max.apply(Math, end) - Math.max.apply(Math, draws)))
    }
    //let chks = chkSlince(dataSet) //計算空白
  }
}

//執行畫圖
function drawAudio(drawsdata, canvash, canvas) {
  drawsdata.forEach(function (val, idx) {
    let y = (canvash / 2) - Math.ceil((val[1] / 2));
    canvas.drawImage(lines[val[1]], val[0], y)
  })
}

//設置緩衝切片的大小，每次要送進處理器處理的資料大小，關係到圖象要畫的寬度
function setFftSize(d) {
  let div = 0;
  if (d < 10) {
    div = 1;
  } else {
    div = Math.ceil(d / 30) + 1
  }
  switch (div) {
    case 1:
      return 512;
      break;
    case 2:
    case 3:
      return 1024;
      break;
    case 4:
    case 5:
    case 6:
      return 2048;
      break;
    default:
      return 4096;
      break;
  }
}

//檢查頭尾靜音位置
function chkSlince(obj) {
  obj = obj.sort(
    function (a, b) {
      return a.time > b.time ? 1 : -1;
    }
  )

  let res = [0, 0];
  let head = false;
  let tail = false;

  let length = obj.length;

  for (let i = 0; i < length / 2; i++) {
    if (obj[i].height == 1 && obj[i + 1].height > 1 && head == false) {
      res[0] = obj[i].time;
      head = true;
    }

    if (obj[length - 1 - i].height == 1 && obj[length - 2 - i].height > 1 && tail == false) {
      res[1] = obj[length - 1 - i].time;
      tail = true;
    } else {
      res[1] = obj[length - 1].time;
    }

    if (head == true && tail == true) {
      break;
    }
  }

  return res;
}

//計算波形長度的函式
function waveDistance(array) {
  let max = Math.max.apply(null, array);
  let min = Math.min.apply(null, array);
  return (max - min) > 0 ? Math.floor((max - min) / 2) : 1;
}