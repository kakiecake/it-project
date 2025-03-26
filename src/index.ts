import express from "express"
import * as exphbs from "express-handlebars"
import path from "path"
import bodyParser from "body-parser"
import cookieParser from "cookie-parser"
import multer from "multer"
import fs from "fs"
import knex from "knex"
import { marked } from "marked"
import moment from "moment"

import { ArticleStore } from "./article.store"
import { ArticleService } from "./article.service"
import { User, UserStore } from "./user.store"
import { validateEmail } from "./utils"

const db = knex({
    client: "better-sqlite3",
    connection: {
        filename: "./db.sqlite",
    },
})

const articleStore = new ArticleStore(db)
const articleService = new ArticleService(articleStore, {
    basePhotoUrl: "/uploads",
})
const userStore = new UserStore(db)

const app = express()

app.engine(
    "hbs",
    exphbs.engine({
        extname: ".hbs", // Set the extension to .hbs instead of .handlebars
        defaultLayout: "main", // Set default layout (optional)
        helpers: {
            formatDate: (date: Date, format: string) =>
                moment(date).format(format),
            cutWords: (text: string, n: number) =>
                text.split("\n")[0].split(" ").slice(0, n).join(" "),
        },
    }),
)

app.use(bodyParser.json())
app.use(cookieParser())
app.use(express.static(path.resolve("public")))
app.use("/uploads", express.static(path.resolve("uploads")))

app.set("view engine", "hbs")

// Configure storage for uploaded files
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Create uploads directory if it doesn't exist
        const uploadDir = "uploads/"
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true })
        }
        cb(null, uploadDir)
    },
    filename: (req, file, cb) => {
        // Generate unique filename with original extension
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
        const ext = path.extname(file.originalname)
        cb(null, file.fieldname + "-" + uniqueSuffix + ext)
    },
})

app.use(async (req, _, next) => {
    if (!req.cookies["user"]) {
        next()
        return
    }
    const id = Number.parseInt(req.cookies["user"])
    if (!Number.isNaN(id)) {
        const user = await userStore.getUserById(id)
        if (user) (req as any).user = user
    }
    next()
})

const upload = multer({ storage: storage })

app.use(express.urlencoded())

app.get("/", async (req, res) => {
    const articles = await articleService.listArticles()
    res.render("list-page", {
        title: "Главная",
        articles,
        user: (req as any).user,
    })
})

app.get("/login", (req, res) => {
    res.render("auth", {
        title: "Авторизация",
        user: (req as any).user,
    })
})

app.get("/articles/new", (req, res) => {
    const user = (req as any).user
    if (!user) return res.redirect("/")
    res.render("new-article", {
        title: "Публикация новости",
        user,
    })
})

app.get("/articles/:id", async (req, res) => {
    const id = req.params.id
    const article = await articleService.getArticleById(Number(id))
    if (!article) {
        return res.render("404", { title: "Страница не найдена" })
    }
    article.content = await marked.parse(article.content, { breaks: true })
    return res.render("article", {
        title: article.title,
        article,
        user: (req as any).user,
    })
})

app.get("/contacts", (req, res) => {
    res.render("contacts", {
        title: "Связаться с нами",
        user: (req as any).user,
    })
})

app.post("/articles", upload.single("image"), async (req, res) => {
    const user = (req as any).user
    if (!user) res.status(403).end()
    const { title, content } = req.body
    if (!title || !content || !req.file) {
        res.status(422).end()
        return
    }
    const photoFilename = req.file.filename
    const article = await articleService.createArticle(
        title,
        content,
        photoFilename,
    )
    res.header("HX-Redirect", `/articles/${article.id}`).end()
})

app.post("/login", async (req, res) => {
    const { email, password } = req.body
    if (!email || !password || !validateEmail(email)) {
        res.render("partials/auth-form", {
            authError: "Введенные логин и пароль некорректны",
        })
        return
    }

    const user = await userStore.getUserByLoginAndPassword(email, password)
    if (!user) {
        res.render("partials/auth-form", {
            authError: "Пользователь с таким логином и паролем не найден",
        })
        return
    }

    res.cookie("user", user.id, {
        httpOnly: false,
        path: "/",
    })
        .status(200)
        .header("HX-Redirect", "/")
        .end()
})

app.post("/register", async (req, res) => {
    const existingUser = (req as any).user
    if (existingUser) {
        res.redirect("/")
        return
    }

    const { email, password } = req.body
    if (!email || !password) return res.redirect("/")

    const user = await userStore.addUser(email, password)
    if (!user) {
        res.render("partials/auth-form", {
            authError: "Пользователь с таким email уже зарегистрирован",
        })
        return
    }

    res.cookie("user", user.id, { httpOnly: true })
        .header("HX-Redirect", "/")
        .status(201)
        .end()
})

app.delete('/articles/:id', async (req, res) => {
    const user: User = (req as any).user
    if (!user.isAdmin) {
        res.status(403).end();
        return
    }

    const id = Number(req.params.id)
    if (Number.isNaN(id)) {
        res.status(422).end();
        return
    };
    await articleService.deleteArticleById(id)
    res.status(200).header('HX-Redirect', '/').end();
})

app.get("/logout", (req, res) => {
    return res.clearCookie("user").redirect("/login")
})

app.listen(3000, '0.0.0.0', () => {
    console.log("Server running on port 3000")
})
