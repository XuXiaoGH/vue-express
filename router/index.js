const express = require('express')
const router = express.Router();
var request = require('request');
var cheerio = require('cheerio');
const schedule  = require('node-schedule');
const fetch = require('node-fetch');

router.get('/', (req,res) => {
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

  let wxsid = '',wxuin = '', pass_ticket = '', skey = '';

  let timeStamp = new Date();
  let url = 'https://login.weixin.qq.com/jslogin?appid=wx782c26e4c19acffb&redirect_uri=https%3A%2F%2Fwx.qq.com%2Fcgi-bin%2Fmmwebwx-bin%2Fwebwxnewloginpage&fun=new&lang=zh_CN&_=' + timeStamp.getTime();
  request(url, (error, response, body)=>{
    if (!error && response.statusCode == 200) {
        console.log(body);
        let uuid = body.substring(body.length-14, body.length-2);
        console.log(uuid);

        let qrUrl = 'https://login.weixin.qq.com/qrcode/' + uuid + '?t=webwx';
        res.send('<img src="' + qrUrl + '">');

        //然后开始轮询
        var rule = new schedule.RecurrenceRule();
        var times = [];
        for(var i=1; i<60; i++){
          if(i %3 == 0){
            times.push(i);
          }
        }
        rule.second = times;
        var j = schedule.scheduleJob(rule, function(){
          let timeStamp1 = new Date();
          if(wxsid){
            return;
          }
          let urlLx = 'https://login.weixin.qq.com/cgi-bin/mmwebwx-bin/login?uuid='+ uuid + '&tip=1&_=' + timeStamp1.getTime();
          request.get(urlLx, (error1, response1, body1)=>{
            if (!error1 && response1.statusCode == 200){
              console.log('轮询结果：' + body1);
              if(body1.indexOf('window.code=200') != -1){ //登录成功
                  let len = body1.indexOf('window.redirect_uri=');
                  let loginUlr = body1.substring(len +21 , body1.length -2);
                  console.log('---------------------登录地址:' + loginUlr);
                  //继续搞起
                  request.get(loginUlr + "&fun=new", (error2, response2, body2)=>{
                    if(!error2 && response2.statusCode == 200){
                        //查询联系人
                      console.log('获取参数成功: \n' + body2);
                      var parseString = require('xml2js').parseString;
                      parseString(body2, {explicitArray : false}, function (err, result) {
                        console.dir(JSON.stringify(result));
                        wxsid = result.error.wxsid;
                        wxuin = result.error.wxuin;
                        pass_ticket = result.error.pass_ticket;
                        skey = result.error.skey;

                        console.log('最后的值：' + wxsid);

                        //微信初始化
                        let timeStamp2 = new Date();
                        let chushihuaUrl = 'https://wx2.qq.com/cgi-bin/mmwebwx-bin/webwxinit?r=' + timeStamp2.getTime() + '&lang=ch_ZN&pass_ticket=' + pass_ticket;
                        console.log('初始化地址:' + chushihuaUrl);
                        let deviceId = getDeviceID();
                        let paramsJosn = {
                          BaseRequest:{
                            Uin:wxuin,
                            Sid:wxsid,
                            Skey:skey,
                            DeviceID:deviceId
                          }
                        };
                        console.log("参数："+ JSON.stringify(paramsJosn));

                        fetch(chushihuaUrl, {
                          credentials: 'include',
                          method: 'POST',
                          body:    JSON.stringify(paramsJosn),
                          headers: { 'Content-Type': 'application/json' },
                        })
                          .then(res => res.json())
                          .then(json => {
                            console.log('----------------------------- 初始化开始 --------------------------')
                            console.log(json);




                            /*fetch(chushihuaUrl, {
                              credentials: 'include',
                              method: 'POST',
                              body:    JSON.stringify(paramsJosn),
                              headers: { 'Content-Type': 'application/json' },
                            })
                              .then(res => res.json())
                              .then(json=>{
                                console.log('----- 1111111111111----')
                                console.log(json);
                                console.log('----- 2222222222222----')
                              })*/






                            //console.log('----------------------------- 准备拿出所有好友 ----------------------------');
                            //拿出所有好友
                            /*let timeStamp3 = new Date();
                            let contactUrl = 'https://wx2.qq.com/cgi-bin/mmwebwx-bin/webwxgetcontact?lang=zh_CN&pass_ticket=' + pass_ticket + '&r=' + timeStamp3.getTime() +'&seq=0&skey=' + skey;
                            console.log('请求联系人地址:' + contactUrl);
                            return;
                            //contactUrl = 'https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxbatchgetcontact?type=ex&r=' + timeStamp3.getTime() +'&lang=zh_CN&pass_ticket=' + pass_ticket;
                            fetch(contactUrl,{
                              credentials: 'include',
                              method: 'GET',
                            }).then(res => res.json())
                              .then(json =>{
                                console.log(json);
                            });*/

                            console.log('----------------------------- 准备发消息 ----------------------------');
                            let sendMsgUrl = 'https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxsendmsg';
                            let timeStamp4 = new Date();
                            let msgParamJson = {
                              BaseRequest: {
                                DeviceID: deviceId,
                                Sid: wxsid,
                                Skey: skey,
                                Uin:wxuin
                              },
                              Msg: {
                                ClientMsgId: timeStamp4.getTime(),
                                Content:'test',
                                FromUserName: '@23ea07ad609dbafc0b447269060312f7beab6435b7e395ebbe93b04f68dd8e70',
                                LocalID: timeStamp4.getTime(),
                                ToUserName: 'filehelper',
                                Type: 1
                              },
                              Scene: 0
                            }

                            //发消息
                           /* fetch(sendMsgUrl,  {
                              credentials: 'include',
                              method: 'POST',
                              body: JSON.stringify(msgParamJson),
                              headers: { 'Content-Type': 'application/json' },
                            }).then(res => res.json()).then(json=>{
                                console.log(json);
                            });*/

                           console.log('消息内容' + JSON.stringify(msgParamJson));
                            fetch(sendMsgUrl, {
                              credentials: 'include',
                              method: 'POST',
                              body:    JSON.stringify(msgParamJson),
                              headers: { 'Content-Type': 'application/json' },
                            }).then(res => res.json())
                              .then(json=>{
                                console.log('----- 1111111111111----')
                                console.log(json);
                                console.log('----- 2222222222222----')
                              })


                          });
                        /*const request1 = require('request').defaults({jar: true});
                        request1.post({
                          url: chushihuaUrl,
                          method: "POST",
                          json: true,
                          headers: {
                            "content-type": "application/json",
                          },
                          body: JSON.stringify(paramsJosn)
                        },function (error3, response3, body3) {
                            console.log('初始化结果：' + JSON.stringify(body3));
                            if(!error3 && response3.status == 200){
                              console.log('初始化结果：' + body3);
                            }
                        })*/

                        /*if(wxsid){
                          console.log('取消定时器');
                          j.cancel();
                        }*/
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
  request.get(url, function (error, response, body){
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
