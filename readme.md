# Web Audio API 學習紀錄

[展示頁面DEMO](https://mackliu.github.io/Web-Audio-Api-Study/)

### 音頻視覺化
* 由本地端直接讀出檔案
  * 用fileReader方式轉成dataurl
  * dataurl給<audio>使用替換src網址
* 設定分析器(analyser)，視覺化的buffer不用太大，可以用canvas的寬度去回推
* 建立一個繪圖程式，用來計算傳遞過來的資料陣列內容
* 依照不同的資料類型建立不同的算法及畫法
* 設定繪畫間隔(內定是16ms左右畫一次，可能會太快)
* 建立事件監聽及變數變化(播放，暫停，跳至，換檔案等等)



### 音頻分析
* 由本地端直接讀出檔案
  * 用fileReader方式分別轉成dataurl網址及arraybuffer
  * dataurl給<audio>使用替換src網址
  * arraybuffer給audioContex使用，用來解析資料內容
* 先用audioContex來建立需要的音檔資訊
* 再建立offAudioContex來設定全檔案的容器
* 設定好分析器及程式處理器
* 在處理器中計算聲音的處理方式
* fftSize決定了取樣的次數，可以當成畫圖寬度的依據
* 根據聲音檔的長度來決定要產生的convas大小
* 解析檔案過程中可以抓取時間和資料內容做成另一個陣列，用來判斷頭尾空白。
  