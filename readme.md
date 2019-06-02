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

———————————————————————————————————————————————————
### 更新紀錄
#### 2019-06-01
* decodeAudioData()太花時間的問題暫時無法解決，目前對於超過一分鐘的聲音檔案會有明顥的等待時間
* 改善頁面<audio>中src的做法為URL.createObjectURL(file)，網址比base64短，寫入HTML的速度快
* 改善一些變數的使用方式，減少重覆宣告的次數
* 改善canvas的繪圖機制，增加圖形快取陣列，改變繪圖流程，速度明顯提升不少
* 增加一個解碼中的提示畫面
* 視覺化播放器的canvas效能小幅度提升

#### 2019-06-02
* 解決一個context.onaudioprocess()時的memory leak問題，在解析完後會釋放出資源
* 檢查變數參照問題，儘可能在每個階段減少記憶體的佔用
* 增加一個檢查檔案容量的機制，總量小於100mb的檔案才進行解析。
* 限制同時間只能播放一個聲音檔