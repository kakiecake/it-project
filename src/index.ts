import express from "express"
import * as exphbs from "express-handlebars"
import path from "path"
import bodyParser from "body-parser"
import cookieParser from "cookie-parser"
import multer from 'multer';
import fs from 'fs'

import { ArticleStore } from "./article.store"
import { ArticleService } from "./article.service"
import { AuthService } from "./auth.service"
import { UserStore } from "./user.store"

const articleStore = new ArticleStore()
const articleService = new ArticleService(articleStore)
const userStore = new UserStore()
const authService = new AuthService(userStore)

const app = express()

app.engine(
    "hbs",
    exphbs.engine({
        extname: ".hbs", // Set the extension to .hbs instead of .handlebars
        defaultLayout: "main", // Set default layout (optional)
    }),
)

app.use(bodyParser.json())
app.use(cookieParser())
app.use(express.static(path.resolve("public")))
app.use('/uploads', express.static(path.resolve("uploads")))

app.set("view engine", "hbs")


// Configure storage for uploaded files
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Create uploads directory if it doesn't exist
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename with original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
})

app.use(async (req, _, next) => {
    console.log(req.cookies)
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

const upload = multer({ storage: storage });

app.use(express.urlencoded())

app.get("/", async (req, res) => {
    const articles = await articleService.listArticles()
    res.render("list-page", {
        title: "Home Page",
        articles,
        user: (req as any).user
    })
})

app.get("/login", (req, res) => {
    res.render("auth", {
        title: "Auth",
        user: (req as any).user
    })
})

app.get("/articles/:id", async (req, res) => {
    const id = req.params.id
    const article = await articleService.getArticleById(Number(id))
    if (!article) {
        return res.render("404", { title: "Not found!" })
    }
    return res.render("article", {
        title: article.title,
        article,
        user: (req as any).user,
    })
})

app.get("/new-article", (req, res) => {
    const user = (req as any).user;
    if (!user) return res.redirect('/')
    res.render("new-article", {
        title: "Edit article",
        user,
    })
})

app.post('/articles', upload.single('image'), async (req, res) => {
    const user = (req as any).user;
    if (!user) res.status(403).end();
    const { title, content } = req.body;
    if (!title || !content || !req.file) {
        res.status(422).end();
        return;
    };
    const photoUrl = `/uploads/${req.file?.filename}`
    const article = await articleService.createArticle(title, content, photoUrl)
    res.header('HX-Redirect', `/articles/${article.id}`).end();
})

app.post("/login", async (req, res) => {
    const { email, password } = req.body
    if (!email || !password) return res.redirect("/")

    const user = await userStore.getUserByLoginAndPassword(email, password)
    if (!user) {
        res.status(201).end;
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

app.listen(3000, () => {
    console.log("Server running on port 3000")
})
