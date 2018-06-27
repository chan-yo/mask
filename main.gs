// TODO: 閾値の決定
// TODO: git clone からのてんかいほうほう

var time;
var mainSheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

function setUp(){
  var spreadsheet = SpreadsheetApp.create("mask");
  var sheet = spreadsheet.getActiveSheet()
  var output = [
    [
      '対象',
      'サイトURL',
      '観測値ID',
      'データURL',
      'charset'
    ],[
      'PM2.5',
      'http://soramame.taiki.go.jp/',
      '',
      '="http://soramame.taiki.go.jp/DataListHyou.php?MstCode="&C2&"&Time=:time"',
      'EUC-JP'
    ],[
      '花粉',
      'http://kafun.taiki.go.jp/',
      '',
      '',
      ''
    ]
  ];
  sheet.getRange
  var range = sheet.getRange(1,1,3,5);
  for(var row = 1; row <= range.getNumRows(); row++) {
    for(var collumn = 1; collumn <= range.getNumColumns(); collumn++) {
      range.getCell(row, collumn).setValue(output[row-1][collumn-1]);
    }
  }
}

function main() {
  mainSheet.getRange('B10').setValue('');
  var inputCellsRange = mainSheet.getRange(2, 4, 1, 2);
  for(var row = 1; row <= inputCellsRange.getNumRows(); row++) {
    var url = inputCellsRange.getCell(row, 1).getValue();
    var now = new Date();
    var time = Utilities.formatDate(new Date(now.getYear(), now.getMonth(), now.getDate(), now.getHours() - 1) , 'Asia/Tokyo' , 'yyyyMMddHH');
    url = url.replace(':time', time);
    var charset = inputCellsRange.getCell(row, 2).getValue();
    var response = request(url, charset);
    if (response.code === 200) {
      var parsedHtml = parseTableHtml(response.body, '<table style="font-size:12px;" border="1" class="hyoMenu" width="870">');
      var parsedTime = parsedHtml[0] + parsedHtml[1] + parsedHtml[2] + parsedHtml[3];
      // スクレイピングしたエリアに記載されている日時と、リクエストパラメータの日時が等しいことを確認する
      if (time !== parsedTime) {
        handleError('最新の情報が取得できませんでした。サイトの更新が止まっているか、サイトのhtml構成が変化している可能性があります。',
                    'サイトから取得できた最新の日時： ' + parsedTime);
      }

      Logger.log(formatOutout(parsedHtml));
    } else {
      handleError('クローリングが正常に行われませんでした。', response.code + " : " + response.body);
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
    'contentType' : 'text/html; charset='+ charset,
    'muteHttpExceptions' : true
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
  var result = [];
  if (index !== -1) {
    html = html.substring(index);
    var startIndex = html.indexOf('<tr');
    var endIndex = html.indexOf('</tr>');
    // 1つ目のtrタグが、最新の時刻の情報なのでそこだけ見る
    html = html.substring(startIndex,endIndex + '</tr>'.length);
    
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

/**
 * 例外発生時の処理
 * 特定のセルにエラーメッセージを出力
 * TODO: いずれはslackにメッセージを投げたい。スプレッドシートに出力しても誰も気が付かない
 */
function handleError(title, body){
  mainSheet.getRange('B10').setValue(title + String.fromCharCode(10) + body);
}

/**
 * 出力用に整形する
 */
function formatOutout(html){
  // 各物質の説明はこちらを参照 http://soramame.taiki.go.jp/KomokuDetail.html
  var obj = {
    'year' : html[0],
    'month' : html[1],
    'day' : html[2],
    'hour' : html[3],
    'so2' : html[4],
    'no' : html[5],
    'no2' : html[6],
    'nox' : html[7],
    'co' : html[8],
    'ox' : html[9],
    'nmhc' : html[10],
    'ch4' : html[11],
    'thc' : html[12],
    'spm' : html[13],
    'pm2_5' : html[14],
    'sp' : html[15],
    'wd' : html[16],
    'ws' : html[17],
    'temperature' : html[18],
    'hum' : html[19]
  };
  return obj.year + "年" + obj.month + "月" + obj.day + "日" + obj.hour + "時の情報です。" + String.fromCharCode(10)
    + "  SO2:二酸化硫黄 " + obj.so2 + "(ppm)" + String.fromCharCode(10)
    + "  NO:一酸化窒素 " + obj.no + "(ppm)" + String.fromCharCode(10)
    + "  NO2:二酸化窒素 " + obj.no2 + "(ppm)" + String.fromCharCode(10)
    + "  NOX:窒素酸化物 " + obj.nox + "(ppm)" + String.fromCharCode(10)
    + "  CO:一酸化炭素 " + obj.co + "(ppm)" + String.fromCharCode(10)
    + "  OX:光化学オキシダント " + obj.ox + "(ppm)" + String.fromCharCode(10)
    + "  NMHC:非メタン炭化水素 " + obj.nmhc + "(ppmC)" + String.fromCharCode(10)
    + "  CH4:メタン " + obj.ch4 + "(ppmC)" + String.fromCharCode(10)
    + "  THC:全炭化水素 " + obj.thc + "(ppmC)" + String.fromCharCode(10)
    + "  SPM:浮遊粒子状物質 " + obj.spm + "(mg/m3)" + String.fromCharCode(10)
    + "  PM2.5:微小粒子状物質 " + obj.pm2_5 + "(μg/m3)" + String.fromCharCode(10)
    + "  SP:浮遊粉じん " + obj.sp + "(mg/m3)" + String.fromCharCode(10)
    + "  WD:風向 " + obj.wd + "(16方位)" + String.fromCharCode(10)
    + "  WS:風速 " + obj.ws + "(m/s)" + String.fromCharCode(10)
    + "  TEMP:気温 " + obj.temperature + "(℃)" + String.fromCharCode(10)
    + "  HUM:相対湿度 " + obj.hum + "(%)";
}
