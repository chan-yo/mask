# 導入方法

1. main.gs をコピーして、貼り付ける
2. 保存
3. timeZoneを東京に



## Slack の設定  

クローリングした結果をslackへ投稿するので、slack側でAPIの受口を用意する。  
1. mask チャンネルを作成する(名称は各自自由につけても問題ない)。  

### Slack Incoming の設定

1. https://{slack_name}.slack.com/admin へアクセス  
2. 左メニューの Configure apps -> 左メニューの Custom Integrations
 -> Incoming WebHooks -> 左メニューの Add New Integration　の順にクリックする。
3. Post to Channel に 先ほど作成した mask を指定する。  
4. Add integration をクリックする。  
5. 遷移したページの Webhook URL の下に書かれている URL をメモしておく。
6. 下部にある Customize Name に mask と入力する。  
こちらは Slack にメッセージを投稿する際の bot ユーザ名なので自由につけても良い。  
7. Save Settings をクリックする。  

### 通知設定
大気汚染物質などが多い場合のみ通知されるようにする。  
maskチャンネル -> Notification preference -> Desktop, Mobile ともに Just mentions を選択  
※Ignore notifications for @channel and @here にはチェックを入れないこと

## スプレッドシートの設定  
### 初期化  

1. ツールバーの 関数を選択 から setUp を選び、左の再生ボタンを押す。
※権限の承認画面が出たら「承認する」を押す。
2. Google Drive上に mask という Spreadsheet が作成される。

### 観測地設定  

1. 先ほど作成された Spreadsheet の mask を開く。
2. C2,C3セルに観測地IDを入力する。
自分の住んでいるエリアのID。この画面から調べていく。URLにある値がそう
※C2,C3以外のセルは編集しないこと

### Incoming WebHooks の設定

1. B1セルに先ほどメモした Webhook URL を貼り付ける。 

### 定期実行の設定  

現在のプロジェクトのトリガー -> トリガーが設定されていません。今すぐ追加するにはここをクリックしてください。  
実行 : resetTrigger
イベント : 時間主導型, 日タイマー 午前0時～1時
