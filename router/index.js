const express = require('express')
const router = express.Router();
var request = require('request');
var cheerio = require('cheerio');
const schedule = require('node-schedule');
const fetch = require('node-fetch');

router.get('/', (req, res) => {
  /*let url = 'http://btc.pietian.com/goldsupervipmy.htm?7KJk6He8hhk6YDo3=0IPVQpLeavq0Sem8&tmoney=3000&f=jubi,btce&t=jubi,btce';
  var rule = new schedule.RecurrenceRule();
  var times = [];
  for(var i=1; i<60; i++){
    times.push(i);
  }
  rule.second = times;
  var c=0;
  var j = schedule.scheduleJob(rule, function(){
    request.get(url, function (error, response, body){
      if (!error && response.statusCode == 200) {
        //返回的body为抓到的网页的html内容
        var $ = cheerio.load(body); //当前的$符相当于拿到了所有的body里面的选择器
        console.log('任务执行完成' + (++c) + ',结果:' + $('tbody').html());
      }else{
        res.send('wrong');
      }
    });
  });*/

  let wxsid = '', wxuin = '', pass_ticket = '', skey = '';

  let timeStamp = new Date();
  let url = 'https://login.weixin.qq.com/jslogin?appid=wx782c26e4c19acffb&redirect_uri=https%3A%2F%2Fwx.qq.com%2Fcgi-bin%2Fmmwebwx-bin%2Fwebwxnewloginpage&fun=new&lang=zh_CN&_=' + timeStamp.getTime();
  
  //发起第一个请求，拿到微信网页版的 uuid
  request(url, (error, response, body) => {
    if (!error && response.statusCode == 200) {
      console.log(body);
      let uuid = body.substring(body.length - 14, body.length - 2);
      console.log(uuid);

      let qrUrl = 'https://login.weixin.qq.com/qrcode/' + uuid + '?t=webwx';  //得到登录二维码图片
      res.send('<img src="' + qrUrl + '">');

      //然后开始轮询，等待用户扫码登录确认
      var rule = new schedule.RecurrenceRule(); //这里用了 schedule 定时任务
      var times = [];
      for (var i = 1; i < 60; i++) { // 3秒1次
        if (i % 3 == 0) {
          times.push(i);
        }
      }
      rule.second = times;
      var j = schedule.scheduleJob(rule, function () {
        let timeStamp1 = new Date();
        if (wxsid) {  // 已存在，登录成功过，不然轮询
          return;
        }

        let urlLx = 'https://login.weixin.qq.com/cgi-bin/mmwebwx-bin/login?uuid=' + uuid + '&tip=1&_=' + timeStamp1.getTime();  // 开始轮询
        request.get(urlLx, (error1, response1, body1) => {
          if (!error1 && response1.statusCode == 200) {
            console.log('轮询结果：' + body1);
            if (body1.indexOf('window.code=200') != -1) { //有返回 200 说明登录成功
              let len = body1.indexOf('window.redirect_uri=');
              let loginUlr = body1.substring(len + 21, body1.length - 2); // 截取登录回调地址
              console.log('---------------------登录回调地址:' + loginUlr);
              //继续搞起
              request.get(loginUlr + "&fun=new", (error2, response2, body2) => {  //通过这个地址拿到 wxsid ..等必要数据
                if (!error2 && response2.statusCode == 200) {
                  console.log('获取参数成功: \n' + body2);
                  var parseString = require('xml2js').parseString;  // xml2js对返回结果进行解析
                  parseString(body2, { explicitArray: false }, function (err, result) {
                    console.dir(JSON.stringify(result));
                    wxsid = result.error.wxsid;  //赋值暂存
                    wxuin = result.error.wxuin;
                    pass_ticket = result.error.pass_ticket.replace(/\+/g, '%2B');
                    skey = result.error.skey;

                    console.log('最后的值：' + wxsid + ', pass_ticket: ' + pass_ticket);

                    //微信网页版初始化
                    let timeStamp2 = new Date();
                    let initUrl = 'https://wx2.qq.com/cgi-bin/mmwebwx-bin/webwxinit?r=' + timeStamp2.getTime() + '&lang=ch_ZN&pass_ticket=' + pass_ticket;
                    console.log('----------------------------- 初始化开始 --------------------------' +initUrl);
                    let deviceId = getDeviceID(); //得到一个随机设备ID
                    let paramsJosn = {
                      BaseRequest: {
                        Uin: wxuin,
                        Sid: wxsid,
                        Skey: skey,
                        DeviceID: deviceId
                      }
                    };

                    fetch(initUrl, {
                      credentials: 'include',
                      method: 'POST',
                      body: JSON.stringify(paramsJosn),
                      headers: { 'Content-Type': 'application/json' },
                    })
                      .then(res => res.json())
                      .then(json => {
                        console.log('-------------------------------------------初始化结果---------------------------------');
                        console.log(json);
                        //开启微信状态通知
                        let statusNotifyUrl = 'https://wx2.qq.com/cgi-bin/mmwebwx-bin/webwxstatusnotify?lang=zh_CN&pass_ticket=' + pass_ticket;
                        let statusTime = new Date();
                        let statusParams = {
                          BaseRequest: {
                            Uin: wxuin,
                            Sid: wxsid,
                            Skey: skey,
                            DeviceID: getDeviceID()
                          },
                          ClientMsgId: statusTime.getTime(),
                          Code: 3,
                          FromUserName: json.User.UserName,
                          ToUserName: json.User.UserName
                        };

                        fetch(statusNotifyUrl, {
                          credentials: 'include',
                          method: 'POST',
                          body: JSON.stringify(statusParams),
                          headers: { 'Content-Type': 'application/json' },
                        })
                          .then(res => res.json()).then(statusJosn => {
                            console.log('----------------------------- 准备拿出所有好友 ----------------------------');
                            //拿出所有好友
                            let timeStamp3 = new Date();
                            let contactUrl = 'https://wx2.qq.com/cgi-bin/mmwebwx-bin/webwxgetcontact?lang=zh_CN&pass_ticket=' + pass_ticket + '&r=' + timeStamp3.getTime() + '&seq=0&skey=' + skey;
                            console.log('请求联系人地址:' + contactUrl);
                            //contactUrl = 'https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxbatchgetcontact?type=ex&r=' + timeStamp3.getTime() +'&lang=zh_CN&pass_ticket=' + pass_ticket;
                            /* request.get(contactUrl, (error10, response10, body10)=>{
                              console.log('所有联系人内容： ' + body10);
                            }); */
                            
                            /*  fetch(contactUrl, {
                               credentials: 'include',
                             }).then(res => res.json())
                              .then(json => {
                                console.log('所有联系人内容----------------------------------------------------------------')
                                console.log(json);
                              }); */

                            // 先做一个同步消息的操作
                            let syncUrl = 'https://wx2.qq.com/cgi-bin/mmwebwx-bin/webwxsync?sid= ' + wxsid + '&skey=' + skey + '&lang=zh_CN&pass_ticket=' + pass_ticket;
                            let syncDateTime = ~new Date();
                            let syncParams = {
                              BaseRequest: {
                                DeviceID: getDeviceID(),
                                Sid: wxsid,
                                Skey: skey,
                                Uin: wxuin
                              },
                              SyncKey: json.SyncKey,
                              rr: syncDateTime
                            }

                            fetch(syncUrl, {
                              credentials: 'include',
                              method: 'POST',
                              body: JSON.stringify(syncParams),
                              headers: { 'Content-Type': 'application/json' },
                            }).then(res => res.json())
                              .then(syncJson => {

                                console.log('同步消息--------------------------------------------------------------------结果');
                                console.log(syncJson);

                                console.log('----------------------------- 准备发消息 ----------------------------');
                                let sendMsgUrl = 'https://wx2.qq.com/cgi-bin/mmwebwx-bin/webwxsendmsg?lang=zh_CN&pass_ticket=' + pass_ticket;
                                let timeStamp4 = new Date();
                                let msgParamJson = {
                                  BaseRequest: {
                                    DeviceID: getDeviceID(),
                                    Sid: wxsid,
                                    Skey: skey,
                                    Uin: wxuin
                                  },
                                  Msg: {
                                    ClientMsgId: timeStamp4.getTime(),
                                    Content: '我是一条测试消息哟',
                                    FromUserName: json.User.UserName,
                                    LocalID: timeStamp4.getTime(),
                                    ToUserName: 'filehelper',
                                    Type: 1
                                  },
                                  Scene: 0
                                }

                                console.log('消息内容' + JSON.stringify(msgParamJson));
                                fetch(sendMsgUrl, {
                                  credentials: 'include',
                                  method: 'POST',
                                  body: JSON.stringify(msgParamJson),
                                  headers: { 'Content-Type': 'application/json' },
                                }).then(res => res.json())
                                  .then(json => {
                                    console.log("消息发送结果：" + JSON.stringify(json));
                                  })

                              })
                          });
                      });
                  });
                }
              })

            }
          }
        });
      });



    }
  });

})

function pachong(res, url, c) {
  console.log('任务开始执行');
  request.get(url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      //返回的body为抓到的网页的html内容
      var $ = cheerio.load(body); //当前的$符相当于拿到了所有的body里面的选择器
      console.log('任务执行完成' + (++c));
      //res.send($('table').html());
    }
  });
  //console.log('xxxxxxxxx');
}

function sendWxMsg() {
  let url = '';
}

function getDeviceID() {
  return "e" + ("" + Math.random().toFixed(15)).substring(2, 17)
}

module.exports = router
