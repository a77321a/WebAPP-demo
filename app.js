

var express = require('express');

//导入DAO层
var path = require('path');
var db = require("./model/db.js");
//
var formidable = require('formidable');
//session处理，post请求的body数据处理
var session = require("express-session");
var bodyParser = require('body-parser');
// var multer = require('multer');

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(multer());
//设置模板引擎
app.set('views', __dirname); //设置模板的目录
app.set('view engine', 'html'); // 设置解析模板文件类型：这里为html文件
app.engine('html', require('ejs').__express); // 使用ejs引擎解析html文件中ejs语法
//设置中间件,静态存储文件，便于路由渲染处理
app.use(express.static("./public"));
app.use(express.static("./student"));

//
app.use(session({
    secret: 'chyingp', // 用来对session id相关的cookie进行签名
    saveUninitialized: false, // 是否自动保存未初始化的会话，建议false
    resave: false, // 是否每次都重新保存会话，建议false
    cookie: {
    maxAge: 10 * 1000 // 有效期，单位是毫秒
    }
}));


//首页
app.get('/',function(req,res){
  if(req.session.login == "1"){
    res.sendFile(__dirname+'/public/Tindex.html');
  }else{
    res.redirect('login');
  }

});
//成绩页面路由
app.get('/score',function(req,res){
  res.sendFile(__dirname+'/student/score.html');
});

//个人信息页面
app.get('/info',function(req,res){
  res.sendFile(__dirname+'/student/user-info.html');
});
//学生登录
app.get('/login', function(req, res) {
    res.sendFile(__dirname+'/public/login.html');
});
app.get('/reg', function(req, res) {
  res.sendFile(__dirname+'/public/register.html');
});


//登录检查
app.post('/checklogin',function(req,res){
  //post请求中的帐号密码
  var username = req.body.username;
  var password = req.body.password;
  //根据用户填写的用户名，去数据库集合users里面找这个文档，读取密码。
  //如果读取的密码，和填写的密码一样，登陆成功了；
  //如果读取的密码，和填写的密码不一样，登陆失败
  //如果根本没有找到这个记录，那么就说明用户名填写错了
  db.find("users",{"username":username},function(err,result){
        if(result.length == 0){
          return  res.json({'state':0});
        }
        var dbPwd = result[0].password;
        if(dbPwd == password){
            req.session.login = "1";
            req.session.username = result[0].username;
          return  res.redirect('/');
        }else{
          return  res.redirect('/login');
        }
      res.redirect('/login');
    });
});
//注册时检查用户名是否重复
app.post('/checkusername',function(req,res){
  var username = req.body.username;
  var password = req.body.password;
  db.find("users",{"username":username},function(err,result){
        if(result.length == 0){
           res.json({'state':1});
        }
        else{
          res.json({'state':0});
        }
      });
  });
// 退出登录
app.get('/logout', function(req, res, next){
  // 备注：这里用的 session-file-store 在destroy 方法里，并没有销毁cookie
  // 所以客户端的 cookie 还是存在，导致的问题 --> 退出登陆后，服务端检测到cookie
  // 然后去查找对应的 session 文件，报错
  // session-file-store 本身的bug
  req.session.destroy(function(err) {
    if(err){
      return;
    }
    res.clearCookie();
    res.redirect('/');
  });
});

//查询成绩
app.get('/score/du',function(req,res){
  var name=req.query.name;
  db.find("student",{},function(err,result){
        if(err){
            console.log(err);
        }
        res.json(result);
    });
});



//注册
app.post("/checkreg", function (req, res, next) {
    var form = new formidable.IncomingForm();
    var username = req.body.username;
    var password = req.body.password;
    console.log(req.body.username);
    form.parse(req, function (err, fields) {
        //写入数据库
        db.insertOne("users", {
            "username":username,
            "password":password
        }, function (err, result) {
            if(err){
                res.send({"result":-1}); //-1是给Ajax看的
                return;
            }
            res.json({"result":1});
        });
    });
});

app.listen(3000);
