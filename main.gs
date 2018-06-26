var time;

function onOpen() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet();
  var entries = [
    {
      name : "Qiita ユーザー コントリビュート数取得",
      functionName : "myFunction"
    }
  ];
  sheet.addMenu("スクリプト実行", entries);
  //メインメニュー部分に[スクリプト実行]メニューを作成して、
  //下位項目のメニューを設定している
};

function myFunction () {
  Browser.msgBox("確認", "Hello GAS World.", Browser.Buttons.OK);
}

function main() {
  var activeSheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var inputCellsRange = activeSheet.getRange(2, 4, 1, 2);
  for(var row = 1; row <= inputCellsRange.getNumRows(); row++) {
    var url = inputCellsRange.getCell(row, 1).getValue();
    var now = new Date();
    var time = Utilities.formatDate(new Date(now.getYear(), now.getMonth(), now.getDate(), now.getHours() - 1) , 'Asia/Tokyo' , 'yyyyMMddHH');
    url = url.replace(':time', time);
    var charset = inputCellsRange.getCell(row, 2).getValue();
    var response = request(url, charset);
    if (response.code === 200) {
      var parsedHtml = parseTableHtml(response.body, '<table style="font-size:12px;" border="1" class="hyoMenu" width="870">')
      // スクレイピングしたエリアに記載されている日時と、リクエストパラメータの日時が等しいことを確認する
      if (time !== parsedHtml[0] + parsedHtml[1] + parsedHtml[2] + parsedHtml[3]) {
        handleError();
      }
      var so2 = parsedHtml[4];
      var no = parsedHtml[5];
      var no2 = parsedHtml[6];
      var nox = parsedHtml[7];
      var nmhc = parsedHtml[8];
      var ch4 = parsedHtml[9];
      var thc = parsedHtml[10];
      var spm = parsedHtml[11];
      var pm2_5 = parsedHtml[12];
      var wd_ws = parsedHtml[13];
      var temperature = parsedHtml[14];

      /*
          http://soramame.taiki.go.jp/KomokuDetail.html
          □大気汚染物質
          略称  物質名              単位  解説
          SO2   二酸化硫黄          ppm   石油、石炭等を燃焼したときに含有される硫黄（Ｓ）が酸化されて発生するもので、高濃度で呼吸器に影響を及ぼすほか、森林や湖沼などに影響を与える酸性雨の原因物質になると言われている。
          NO    一酸化窒素          ppm   窒素酸化物は、ものの燃焼や化学反応によって生じる窒素と酸素の化合物で、主として一酸化窒素（ＮＯ）と二酸化窒素（ＮＯ２）の形で大気中に存在する。発生源は、工場・事業場、自動車、家庭等多種多様である。発生源からは、大部分が一酸化窒素として排出されるが、大気中で酸化されて二酸化窒素になる。二酸化窒素は、高濃度で呼吸器に影響を及ぼすほか、酸性雨及び光化学オキシダントの原因物質になると言われている。
          NO2   二酸化窒素          ppm   同上
          NOX   窒素酸化物          ppm   同上
          CO    一酸化炭素          ppm   炭素化合物の不完全燃焼等により発生し、血液中のヘモグロビンと結合して、酸素を運搬する機能を阻害するなどの影響を及ぼすほか、温室効果ガスである大気中のメタンの寿命を長くすることが知られている。
          OX    光化学オキシダント   ppm   大気中の窒素酸化物や炭化水素が太陽の紫外線を受けて化学反応を起こし発生する汚染物質で、光化学スモッグの原因となり、高濃度では、粘膜を刺激し、呼吸器への影響を及ぼすほか、農作物など植物への影響も観察されている。
          NMHC  非メタン炭化水素     ppmC  炭化水素は、炭素と水素が結合した有機物の総称である。大気中の炭化水素濃度の評価には、光化学反応に関与する非メタン炭化水素が用いられる。
          CH4   メタン              ppmC  同上
          THC   全炭化水素          ppmC  同上
          SPM   浮遊粒子状物質 mg/m3 浮遊粉じんのうち、１０μｍ以下の粒子状物質のことをいい、ボイラーや自動車の排出ガス等から発生するもので、大気中に長時間滞留し、高濃度で肺や気管などに沈着して呼吸器に影響を及ぼす。
          PM2.5 微小粒子状物質 μg/m3 大気中に浮遊する粒子状物質であって、その粒径が2.5μmの粒子を50%の割合で分離できる分粒装置を用いて、より粒径の大きい粒子を除去した後に採取される粒子をいう。
          SP    浮遊粉じん mg/m3 　 ○ 大気中に長時間浮遊しているばいじん、粉じん等をいう。ばいじんとは、ものの燃焼によって生じたすす等の固体粒子を総称したものをいう。
          □気象項目
          略称  物質名       単位    解説
          WD    風向        16方位  風の吹いてくる方向。１６の向きで示す。たとえば、風向が北であれば、北から南に風が吹いている状態をいう。
          WS    風速        m/s     1秒間に大気が移動した距離。たとえば、平均風速10m/sは、おおむね、強風注意報が発令されるレベルの風速をいう。
          TEMP  気温        ℃ 　   大気の温度。
          HUM   相対湿度     % 　    空気中の水蒸気量が飽和状態（含みうる水蒸気量が限界になった時）に比べ、どの程度含まれているかを％で表したもの。
      */
      // TODO: 閾値の決定
      // TODO: git管理
      // TODO: git clone からのてんかいほうほう
      // TODO: スプレッドシートの土台を生成する function
      
      

    } else {
      handleError();
    }
  }
}

/**
 * @param {string} url
 * @param {string} charset
 * @return object
 */
function request(url, charset) {
  var option = {
    'method' : 'get',
    'contentType' : 'text/html; charset='+ charset
  };
 
  /** @see https://developers.google.com/apps-script/reference/url-fetch/url-fetch-app */
  var response = UrlFetchApp.fetch(url, option);
  return {
    'code' : response.getResponseCode(),
    'body' : response.getContentText(charset)
  };
}

/**
 * だいぶざっくり、単純なtableタグくらいしか抽出できない
 * @param {string} html htmlを文字列で表現したもの
 * @param {string} root 検索対象とするtableタグ
 * @return array
 */
function parseTableHtml(html, root) {
  var index = html.indexOf(root);
  if (index !== -1) {
    html = html.substring(index);
    var startIndex = html.indexOf('<tr');
    var endIndex = html.indexOf('</tr>');
    // 1つ目のtrタグが、最新の時刻の情報なのでそこだけ見る
    html = html.substring(startIndex,endIndex + '</tr>'.length);
    
    var result = [];
    while(true) {
      startIndex = html.indexOf('<td');
      endIndex = html.indexOf('</td>');
      if (startIndex === -1) {
        break;
      }
      var tmp = html.match(/<td[^>]*>(.*?)<\/td>/);
      result.push(tmp[1]);
      html = html.substring(endIndex + '</td>'.length);
    }
  }
  return result;
}
