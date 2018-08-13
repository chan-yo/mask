# 基本仕様  
- 環境省の HP から、大気汚染物質と花粉情報をクローリングする  
花粉情報については以下の期間内のみ提供される。  
    - 北海道 : 2/1 ~ 6/30  
    - それ以外の地域 : 2/1 ~ 5/31  
- 取得対象の都市は自由に指定できる( HP に掲載されている範囲内で)  
- 花粉については、通知する際の閾値を自由に変更可能  
大気汚染物質は環境基準値に従って通知されます(個人で強い弱いとか無いと思うので)  
- 1日3回自動的に Slack に通知される  
- github のコードのバージョンアップを確認したら Slack へ通知する

# 導入方法
## Slack の設定  

クローリングした結果を Slack へ投稿するので、 Slack 側で API の受口を用意する。  
1. 「mask」チャンネルを作成する。  

### Slack Incoming の設定

1. https://{slack_name}.slack.com/admin へアクセス  
2. 左メニューの Configure apps -> 左メニューの Custom Integrations  -> Incoming WebHooks -> 左メニューの Add Configuration の順にクリックする。  
3. Post to Channel に 先ほど作成した「mask」チャンネルを指定する。  
4. Add Incoming WebHooks integration をクリックする。  
5. 遷移したページの Webhook URL の下に書かれている URL をメモしておく。  
6. 下部にある Customize Name に 「mask」 と入力する。  
Customize Name, Customize Icon は Slack にメッセージを投稿する際の bot ユーザ名などなので自由につけても良い。  
7. Save Settings をクリックする。  

### 通知設定
マスク着用の必要が有る場合のみ通知されるようにする。  
「mask」チャンネル -> Notification preference -> Desktop, Mobile ともに Just mentions を選択  
※Ignore notifications for @channel and @here にはチェックを入れないこと
![Notification preference](https://github.com/chan-yo/mask/raw/master/image/slack_notification_preference1.png "Notification preference")
![Notification preference](https://github.com/chan-yo/mask/raw/master/image/slack_notification_preference2.png "Notification preference")



## Spreadsheet の設定  
### 初期化  
1. [GoogleDrive](https://drive.google.com/drive/u/0/my-drive) へアクセスする。
2. 新規 -> Google スプレッドシート をクリックする。  
3. スプレッドシート名を「無題のスプレッドシート」から「mask」に変更する。  
4. ツール -> スクリプトエディタをクリックする。  
5. プロジェクト名を「無題のプロジェクト」から「mask」に変更する。  
6. 左側サイドメニュー -> コード.gs -> 三角アイコン -> 名前を変更 をクリックする。  
7. 「main」に書き換えて OK をクリックする。  
8. [main.gs](https://raw.githubusercontent.com/chan-yo/mask/master/main.gs) の内容をコピーして、先程操作していた main.gs に貼り付け・保存する。  
7. ファイル -> プロジェクトのプロパティ -> タイムゾーン を東京に変更する。  
8. 関数を選択 -> 「setUp」を選択し、▷をクリックする。  
承認を求められた場合は、「許可を確認」をクリックし画面の指示に従う。  

### 観測地設定  

1. 先ほど作成された Spreadsheet の「mask」を開く。
2. B2,B3 セルに観測地IDを入力する。  
観測地 ID の調べ方は後述。  
3. B4 セルで花粉についての通知を行う閾値を定義している。花粉の影響を受けやすい人は小さめの数値に変更すること。  

#### 大気汚染物質についての観測地 ID の調べ方
http://soramame.taiki.go.jp
1. http://soramame.taiki.go.jp/MstItiran.php へアクセスする
2. 都道府県を選択する。
3. 自分が住んでいる地域に「住所」が近い「測定局名称」の「測定局コード」が観測地 ID。

#### 花粉についての観測地 ID の調べ方
http://kafun.taiki.go.jp/
1. http://kafun.taiki.go.jp/Library.html#6 へアクセスする。
2. 自分が住んでいる地域に「所在地」が近い「都道府県」「設置場所」をメモする。
3. http://kafun.taiki.go.jp/ ヘアクセスして、「花粉の情報を見る」内の、先程メモした都道府県が含まれる地域をクリックする。
4. 「全局の最新情報を見る」内の「測定局選択」から先程メモした「設置場所」を選択する。
5. 「全局の最新情報を見る」内の「表」をクリックする。
6. 表示されたページの URL 内の MstCode=xxxxxx の xxxxxx 部分が観測地 ID。

### Incoming WebHooks の設定

1. B1 セルに先ほどメモした Webhook URL を貼り付ける。 

# 使い方
毎日 8, 12, 18 時に自動的に「mask」チャンネルに大気汚染物質、花粉の情報が投稿される。  
任意の大気汚染物質について環境基準値を超える。もしくは花粉量が閾値を超えた場合のみ`@here` **<font color="#EE4545">有り</font>** で「mask」チャンネルに投稿される。  
上記条件を満たさない場合は`@here` **<font color="#5358EE">無し</font>** で「mask」チャンネルに投稿される。  

## マスク着用を促す`@here` **<font color="#EE4545">有り</font>** の通知  
![大気汚染物質、花粉量が基準値を超えた場合](https://github.com/chan-yo/mask/raw/master/image/notice.png "大気汚染物質、花粉量が基準値を超えた場合")

## マスクが必要ない`@here` **<font color="#EE4545">無し</font>** の通知  
![大気汚染物質、花粉量が基準値を超えていない場合](https://github.com/chan-yo/mask/raw/master/image/no_notice.png "大気汚染物質、花粉量が基準値を超えていない場合")

## 花粉情報の収集期間外の通知  
![花粉情報の収集期間外](https://github.com/chan-yo/mask/raw/master/image/period_not_notice_about_pollen.png "花粉情報の収集期間外")

## 最新のソースコードが公開されている際の通知
![花粉情報の収集期間外](https://github.com/chan-yo/mask/raw/master/image/latest_version.png "花粉情報の収集期間外")

# 残タスクとか

- 例外処理適当だから、なにかエラーが起こったときに Slack 上へエラーが発生したという通知が来ないかもしれない。  
その場合は8,12,18時になってもslackへ何もメッセージが表示されないということから気が付くことは可能だと思いますがちょっと不親切。。。  