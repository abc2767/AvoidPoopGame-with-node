const express = require("express");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const path = require("path");
const session = require("express-session");
const nunjucks = require("nunjucks");
const dotenv = require("dotenv");
const passport = require("passport");
const { sequelize } = require("./models");
const helmet = require("helmet");
const hpp = require("hpp");
const redis = require("redis");
const RedisStore = require("connect-redis")(session);
//process.env.COOKIE_SECRET 없음
dotenv.config(); // process.env
const rediesClinet = redis.createClient({
    url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
    password: process.env.REDIS_PASSWORD,
    legacyMode: true,
});
redisClient.connect().catch(console.error);
//process.env.COOKIE_SECRET 있음
const pageRouter = require("./routes/page");
const authRouter = require("./routes/auth");
const postRouter = require("./routes/post");
const passportConfig = require("./passport");
const { connected } = require("process");
const fs = require("fs");
const app = express();
passportConfig();
app.set("port", process.env.PORT || 8001); //localhost 8001 port
app.set("view engine", "html");
app.enable("trust proxy");
nunjucks.configure("views", {
    //nunjucks로 화면 보여줌
    express: app,
    watch: true,
});

sequelize
    .sync() //테이블 잘못 만들었을 때 .sync({force : false})하면 날라감
    .then(() => {
        console.log("데이터베이스 연결 성공");
    })
    .catch((err) => {
        console.error(err);
    });

if (process.env.NODE_ENV === "production") {
    app.enable("trust proxy");
    app.use(morgan("combined"));
    app.use(
        helmet({
            contentSecurityPolicy: false,
            crossOriginEmbedderPolicy: false,
            crossOriginResourcePolicy: false,
        })
    );
    app.use(hpp());
} else {
    app.use(morgan("dev"));
} // loging하는 거 개발모드에서

app.use(express.static(path.join(__dirname, "public"))); //public 폴더를 static으로 만들어서 자유롭게 접근할 수 있도록, __dirname은 현재 디렉토리
app.use("/img", express.static(path.join(__dirname, "uploads")));
app.use(express.static("views"));
app.use(express.json()); //body parser json 형식 받을 수 있도록 req.body를 ajax json 요청으로부터
app.use(express.urlencoded({ extended: false })); //body parser form 형식  받을 수 있도록, req.body 폼으로부터
app.use(cookieParser(process.env.COOKIE_SECRET)); //{connected.sid : 123524141...   }
const sessionOption = {
    resave: false,
    saveUninitialized: false,
    secret: process.env.COOKIE_SECRET,
    cookie: {
        httpOnly: true,
        secure: false,
    },
    store: new RedisStore({ client: redisClient }),
};
if (process.env.NODE_ENV === "production") {
    sessionOption.proxy = true;
    // sessionOption.cookie.secure = true;
}
app.use(session(sessionOption));
app.use(passport.initialize()); //req.user, req.login, req.isAuthenticate, req.logout
app.use(passport.session()); //connect.sid 라는 이름으로 세션 쿠키가 브라우저로 전송

app.use("/", pageRouter);
app.use("/auth", authRouter);
app.use("/post", postRouter);
app.use((req, res, next) => {
    //없는 페이지 요청 될 때 404 not found
    const error = new Error(`${req.mehtod}, ${req.url} 라우터가 없습니다.`);
    error.status = 404;
    next(error);
});

app.use((err, req, res, next) => {
    //error 처리
    res.locals.message = err.message;
    res.locals.error = process.env.NODE_ENV !== "production" ? err : {}; //배포모드일 땐 에러 숨기고 개발 모드일 때만 에러
    res.status(err.status || 500);
    res.render("error");
});

module.exports = app;
