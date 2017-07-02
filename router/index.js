const express = require('express')
const router = express.Router();
const request = require('request');
var cheerio = require('cheerio');
const schedule  = require('node-schedule');

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
          let urlLx = 'https://login.weixin.qq.com/cgi-bin/mmwebwx-bin/login?uuid='+ uuid + '&tip=1&_=' + timeStamp1.getTime();
          request.get(urlLx, (error1, response1, body1)=>{
            if (!error1 && response1.statusCode == 200){
              console.log('轮询结果：' + body1);
              if(body1.indexOf('window.code=200') != -1){ //登录成功
                  let len = body1.indexOf('window.redirect_uri=');
                  let loginUlr = body1.substring(len +21 , body1.length -2);
                  console.log('---------------------登录地址:' + loginUlr);
                  //继续搞起
                  request.get(loginUlr, (error2, response2, body2)=>{
                    if(!error2 && response2.statusCode == 200){
                        //查询联系人
                       console.log('登录成功！！！' + body2);
                       request.get('https://wx.qq.com/cgi-bin/mmwebwx-bin/webwxgetcontact?r=1377482079876', (error3, response3, body3)=>{
                         if(response3.statusCode == 200){
                           console.log('所有联系人信息：' + body3);
                         }

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


module.exports = router
