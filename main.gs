// TODO: git clone からのてんかいほうほう

var mainSheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
var slackIncomingUrl = mainSheet.getRange('B1').getValue();
var mstCodeSoramame = mainSheet.getRange('B2').getValue();
var mstCodeHanako = mainSheet.getRange('B3').getValue();
var pollenThreshold = mainSheet.getRange('B4').getValue();

// そらまめくんに 大気汚染物質の環境基準値載っていた http://soramame.taiki.go.jp/index/setsumei/koumoku.html
// あとは環境省 https://www.env.go.jp/kijun/taiki.html https://www.env.go.jp/council/former2013/07air/y078-01/mat03-1.pdf
var so2Threshold = 0.101;
var noThreshold = 0.201;
var no2Threshold = 0.061;
var noxThreshold = 10000  //TODO: ちゃんとした値に置き換える
var coThreshold = 10;
var oxThreshold = 0.061;
var nmhcThreshold = 0.32;
var ch4Threshold = 10000;  //TODO: ちゃんとした値に置き換える
var thcThreshold = 10000;  //TODO: ちゃんとした値に置き換える
var spmThreshold = 0.201;
var pm2_5Threshold = 36;
var spThreshold = 10000;   //TODO: ちゃんとした値に置き換える

var colorCodeNoMask = '#58FA82';
var colorCodeNeedMask = '#F79F81';

// 継承の書き方がよくわかんなかったのでそれっぽい感じでの実装
Crawler = function () {
  var Crawler = {};

  /**
   * @param {string} url
   * @param {string} charset
   * @param {array} cokkies
   * @return object
   */
  Crawler.request = function (url, charset, cokkies) {
    cokkies = typeof cokkies !== 'undefined' ? cokkies : [];
    options = {
      method : 'get',
      contentType : 'text/html; charset='+ charset,
      muteHttpExceptions : true,
      headers : {
        Cookie: cokkies.join(';')
      }
    };
    /** @see https://developers.google.com/apps-script/reference/url-fetch/url-fetch-app */
    return UrlFetchApp.fetch(url, options);
  }
  return Crawler;
}

SoramameCrawler = function (mstCode) {
  var SoramameCrawler = {};

  SoramameCrawler._Crawler = new Crawler();

  /**
   * @param {string} html htmlを文字列で表現したもの
   * @return array
   */
  SoramameCrawler._parseHtml = function (html) {
    // 検索対象とするtableタグ
    var root = '<table style="font-size:12px;" border="1" class="hyoMenu" width="870">';
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
   * @param {array} html
   * @return object
   */
  SoramameCrawler._formatOutout = function (html) {
    // 各物質の説明はこちらを参照 http://soramame.taiki.go.jp/KomokuDetail.html
    var obj = {
      year : html[0],
      month : html[1],
      day : html[2],
      hour : html[3],
      so2 : html[4],
      no : html[5],
      no2 : html[6],
      nox : html[7],
      co : html[8],
      ox : html[9],
      nmhc : html[10],
      ch4 : html[11],
      thc : html[12],
      spm : html[13],
      pm2_5 : html[14],
      sp : html[15],
      wd : html[16],
      ws : html[17],
      temperature : html[18],
      hum : html[19]
    };

    var need_mask = (obj.so2 > so2Threshold
                     || obj.no > noThreshold
                     || obj.no2 > no2Threshold
                     || obj.nox > noxThreshold
                     || obj.co > coThreshold
                     || obj.ox > oxThreshold
                     || obj.nmhc > nmhcThreshold
                     || obj.ch4 > ch4Threshold
                     || obj.thc > thcThreshold
                     || obj.spm > spmThreshold
                     || obj.pm2_5 > pm2_5Threshold
                     || obj.sp  > spThreshold) ? true: false;
    var color = need_mask ? colorCodeNeedMask : colorCodeNoMask;

    return {
      attachments : [
        {
          pretext : obj.year + '年' + obj.month + '月' + obj.day + '日' + obj.hour + '時の大気汚染物質の情報です',
          color : color,
          fields : [
            {
              title : need_mask ? 'マスクを付けて外出してください。' : '',
              value : '  SO2:二酸化硫黄 ' + obj.so2 + '(ppm)' + String.fromCharCode(10)
                + '  NO:一酸化窒素 ' + obj.no + '(ppm)' + String.fromCharCode(10)
                + '  NO2:二酸化窒素 ' + obj.no2 + '(ppm)' + String.fromCharCode(10)
                + '  NOX:窒素酸化物 ' + obj.nox + '(ppm)' + String.fromCharCode(10)
                + '  CO:一酸化炭素 ' + obj.co + '(ppm)' + String.fromCharCode(10)
                + '  OX:光化学オキシダント ' + obj.ox + '(ppm)' + String.fromCharCode(10)
                + '  NMHC:非メタン炭化水素 ' + obj.nmhc + '(ppmC)' + String.fromCharCode(10)
                + '  CH4:メタン ' + obj.ch4 + '(ppmC)' + String.fromCharCode(10)
                + '  THC:全炭化水素 ' + obj.thc + '(ppmC)' + String.fromCharCode(10)
                + '  SPM:浮遊粒子状物質 ' + obj.spm + '(mg/m3)' + String.fromCharCode(10)
                + '  PM2.5:微小粒子状物質 ' + obj.pm2_5 + '(μg/m3)' + String.fromCharCode(10)
                + '  SP:浮遊粉じん ' + obj.sp + '(mg/m3)' + String.fromCharCode(10)
                + '  WD:風向 ' + obj.wd + '(16方位)' + String.fromCharCode(10)
                + '  WS:風速 ' + obj.ws + '(m/s)' + String.fromCharCode(10)
                + '  TEMP:気温 ' + obj.temperature + '(℃)' + String.fromCharCode(10)
                + '  HUM:相対湿度 ' + obj.hum + '(%)'
            }
          ]
        }
      ]
    }
  }

  /**
   * @return object
   */
  SoramameCrawler.request = function () {
    var url = 'http://soramame.taiki.go.jp/DataListHyou.php?MstCode=:mstCode&Time=:time';
    var charset = 'EUC-JP';
    var now = new Date();
    // 最新の測定時刻は(現在時刻 - 1時間)で求められる
    var time = Utilities.formatDate(new Date(now.getYear(), now.getMonth(), now.getDate(), now.getHours() - 1) , 'Asia/Tokyo' , 'yyyyMMddHH');

    url = url.replace(':time', time);
    url = url.replace(':mstCode', mstCode);

    var response = this._Crawler.request(url, charset);
    return {
      'code' : response.getResponseCode(),
      'body' : response.getContentText(charset)
    };
  }

  /**
   * @param {array} body
   * @return object
   */
  SoramameCrawler.output = function (body) {
    var parsedHtml = this._parseHtml(body);
    var parsedTime = parsedHtml[0] + parsedHtml[1] + parsedHtml[2] + parsedHtml[3];
    return this._formatOutout(parsedHtml);
  }

  return SoramameCrawler;
}

HanakoCrawler = function (mstCode) {
  var HanakoCrawler = {};

  HanakoCrawler._Crawler = new Crawler();

  /**
   * @param {array} headers
   */
  HanakoCrawler._fetchCokkies = function (headers) {
    var cookies = [];
    if ( typeof headers['Set-Cookie'] !== 'undefined' ) {
      // Set-Cookieヘッダーが2つ以上の場合はheaders['Set-Cookie']の中身は配列
      var cookies = typeof headers['Set-Cookie'] == 'string' ? [ headers['Set-Cookie'] ] : headers['Set-Cookie'];
      for (var i = 0; i < cookies.length; i++) {
        // Set-Cookieヘッダーからname=valueだけ取り出し、セミコロン以降の属性は除外する
        cookies[i] = cookies[i].split( ';' )[0];
      };
    }
    return cookies;
  }

  /**
   * @param {string} html htmlを文字列で表現したもの
   * @return string
   */
  HanakoCrawler._parseHeaderHtml = function (html) {
    // 検索対象とするタグ
    var target = '<span id="lblDate" style="font-size:X-Small;">';
    var index = html.indexOf(target);
    var result = '';
    if (index !== -1) {
      html = html.substring(index);
      result = html.substring(target.length, html.indexOf('</span>'))
    }
    return result;
  }

  /**
   * @param {string} html htmlを文字列で表現したもの
   * @return array
   */
  HanakoCrawler._parseDataHtml = function (html) {
    // 検索対象とするタグ
    var root = '<table class="bun" cellspacing="0" cellpadding="0" rules="all" border="2" id="dgd1" style="background-color:Green;border-color:Green;border-width:2px;border-style:Solid;font-size:X-Small;width:430px;border-collapse:collapse;">';
    var index = html.indexOf(root);
    var result = [];
    if (index !== -1) {
      html = html.substring(index);
      // 抽出したhtmlには複数のtableタグが含まれているので、1つ分のtableタグだけ残す
      html = html.substring(0, html.indexOf('</table>'));
      // 最後のtrタグが、最新の時刻の情報なのでそこだけ見る
      var nextTrIndex = -1;
      while(true) {
        var endTag = '</tr>';
        index = html.indexOf(endTag);
        nextTrIndex = html.substring(index + endTag.length).indexOf(endTag);
        // 次のtrタグが見つからない場合は、今処理しているのが最後のtrタグと言える
        if (nextTrIndex === -1) {
          // tdタグすべてを処理する
          while(true) {
            var startIndex = html.indexOf('<td');
            var endIndex = html.indexOf('</td>');
            if (startIndex === -1) {
              return result;
            }
            var tmp = html.match(/<td[^>]*>(.*?)<\/td>/);
            result.push(tmp[1]);
            html = html.substring(endIndex + '</td>'.length);
          }
        }
        html = html.substring(index + endTag.length);
      }
    }
    return result;
  }

  /**
   * @param {string} date
   * @param {string} html
   * @return object
   */
  HanakoCrawler._formatOutout = function (date, html) {
    var obj = {
      hour : html[0],
      pollen : html[1],
      wd : html[2],
      ws : html[3],
      temperature : html[4],
      precipitation : html[5],
      radar : html[6],
    };
    var need_mask = obj.pollen > pollenThreshold;
    var color = need_mask ? colorCodeNeedMask : colorCodeNoMask;
    return {
      attachments : [
        {
          pretext : date + obj.hour + 'の花粉情報です',
          color : color,
          fields :[
            {
              title : need_mask ? 'マスクを付けて外出してください。' : '',
              value : (need_mask ? '<!here> ' + String.fromCharCode(10): '')
                + '  花粉量 ' + obj.pollen + '(個/m3)' + String.fromCharCode(10)
                + '  風向 ' + obj.wd + '(16方位)' + String.fromCharCode(10)
                + '  風速 ' + obj.ws + '(m/s)' + String.fromCharCode(10)
                + '  気温 ' + obj.temperature + '(℃)' + String.fromCharCode(10)
                + '  降水量 ' + obj.temperature + '(mm)' + String.fromCharCode(10)
                + '  レーダー降雨・降雪の有無 ' + obj.radar
            }
          ]
        }
      ]
    }
  }

  /**
   * @return object
   */
  HanakoCrawler.request = function () {
    var now = new Date();
    // 2/1 - 5/31 の期間のみ花粉情報が提供される
    var infoProvisionStartAt = new Date(now.getFullYear(), 1, 1);
    var infoProvisionEndAt;
    // 北海道のみ 6/30 まで提供される
    var hokkaidoAreas = [
      '50110100',
      '50110200',
      '50120100',
      '50120200'
    ];
    if (hokkaidoAreas.indexOf(mstCode) !== -1) {
      infoProvisionEndAt = new Date(now.getFullYear(), 5, 30);
    } else {
      infoProvisionEndAt = new Date(now.getFullYear(), 4, 31);
    }
    // 情報提供期間外であれば何もしない
    if (!(infoProvisionStartAt<= now && now <= infoProvisionEndAt)) {
      return {
        'code' : 503,
        'body' : '花粉情報は ' + (infoProvisionStartAt.getMonth()+1) + '/' + infoProvisionStartAt.getDate()
          + ' ～ ' + (infoProvisionEndAt.getMonth()+1) + '/' + infoProvisionEndAt.getDate() + ' の期間内のみ表示されます。'
      };
    }

    var charset = 'UTF-8';
    var mainUrl   = 'http://kafun.taiki.go.jp/Hyou0.aspx?MstCode=:mstCode&AreaCode=01';
    mainUrl = mainUrl.replace(':mstCode', mstCode);
    var headerUrl = 'http://kafun.taiki.go.jp/Hyou1.aspx';
    var dataUrl   = 'http://kafun.taiki.go.jp/Hyou2.aspx';

    // 後続処理のためにcokkieを先に取得する
    var response = this._Crawler.request(mainUrl, charset);
    if (response.getResponseCode() !== 200) {
      return {
        'code' : response.getResponseCode(),
        'body' : response.getContentText(charset)
      };
    }
    var cookies = this._fetchCokkies(response.getAllHeaders());

    // 日時取得のために、ヘッダー部のみ取得する
    response = this._Crawler.request(headerUrl, charset, cookies);
    if (response.getResponseCode() !== 200) {
      return {
        'code' : response.getResponseCode(),
        'body' : response.getContentText(charset)
      };
    }
    var header = response.getContentText(charset);

    // データ部取得
    response = this._Crawler.request(dataUrl, charset, cookies);
    if (response.getResponseCode() !== 200) {
      return {
        'code' : response.getResponseCode(),
        'body' : response.getContentText(charset)
      };
    }
    var data = response.getContentText(charset);
    return {
      code : response.getResponseCode(),
      body : {
        header : header,
        data : data
      }
    };
  }

  /**
   * @param {object} body
   * @return object
   */
  HanakoCrawler.output = function (body) {
    var date = this._parseHeaderHtml(body.header);
    var parsedHtml = this._parseDataHtml(body.data);
    return this._formatOutout(date, parsedHtml);
  }

  return HanakoCrawler;
}


/**
 * @return void
 */
function setUp(){
  var spreadsheet = SpreadsheetApp.create("mask");
  var sheet = spreadsheet.getActiveSheet()
  var output = [
    [
      'Slack Incoming URL',
      ''
    ],[
      '大気汚染物質についての観測地ID',
      ''
    ],[
      '花粉についての観測地ID',
      ''
    ],[
      '花粉の閾値',
      '50'  // はなこさんで使用している計測器の製作元HPに花粉量の目安の記載があった http://www.yamatronics.com/graph.html
    ]
  ];
  var range = sheet.getRange(1, 1, 4, 2);
  for(var row = 1; row <= range.getNumRows(); row++) {
    for(var collumn = 1; collumn <= range.getNumColumns(); collumn++) {
      range.getCell(row, collumn).setValue(output[row-1][collumn-1]);
    }
  }
}

/**
 * @return void
 */
function main() {
  try {
    var crawlers = [
      new SoramameCrawler(mstCodeSoramame),
      new HanakoCrawler(mstCodeHanako)
    ]
    for (var i = 0; i < crawlers.length; i++) {
      var response = crawlers[i].request();
      if (response.code === 200) {
        notifyToSlack(crawlers[i].output(response.body));
      } else {
        handleError('クローリングが正常に行われませんでした。', response.code + " : " + response.body);
      }
    }
  } catch (e) {
    handleError('エラーが発生しました。', e.name + " : " + e.message);
  }
}

/**
 * 引数で指定した内容で slack へ通知を投げる
 * @param {object} sendData
 * @return object
 */
function notifyToSlack(sendData) {
  var payload = JSON.stringify(sendData);
  options = {
    method : 'post',
    contentType : 'application/json',
    payload: payload,
    muteHttpExceptions : true,
  };
  /** @see https://developers.google.com/apps-script/reference/url-fetch/url-fetch-app */
  return UrlFetchApp.fetch(slackIncomingUrl, options);
}

/**
 * 例外発生時の処理
 * @param {string} title
 * @param {string} body
 * @return void
 */
function handleError(title, body){
  var sednData = {
    attachments : [
        {
          fields :[
            {
              title : title,
              value : body
            }
          ]
        }
      ]
  };
  return notifyToSlack(sednData);
}

/**
 * トリガーを自動生成する
 * 標準のトリガーを利用して隔日で実行すると、6-7時の様に1時間の間のどこかで実行すると実行時刻が安定しないので、手動で特定の時刻に実行するようなトリガーを生成する
 * 毎日 8:00, 12:00, 18:00 の3回分
 * @return void
 */
function resetTrigger(){
  // 登録済みトリガーのうち function main のみを削除する
  var triggers = ScriptApp.getProjectTriggers()
  if (Array.isArray(triggers)) {
    triggers.forEach(function(trigger) {
      if(trigger.getHandlerFunction() === 'main') {
        ScriptApp.deleteTrigger(trigger);
      }
    })
  }

  var date = new Date();
  var hours = [8, 12, 18];
  hours.forEach(function(hour) {
    date.setHours(hour);
    date.setMinutes(0);
    ScriptApp.newTrigger('main').timeBased().at(date).create();
  })
}

