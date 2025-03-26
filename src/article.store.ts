import { Knex } from "knex"
import { Article } from "./article"

export type RawArticle = Omit<Article, "photoUrl"> & { photoFilename: string }

export class ArticleStore {
    constructor(private readonly db: Knex) {}

    async getArticleById(id: number): Promise<RawArticle | null> {
        return (
            (await this.db("articles")
                .select(
                    "id",
                    "title",
                    "content",
                    "photo_filename AS photoFilename",
                    "created_at",
                )
                .where({ id })
                .first()) || null
        )
    }

    async getArticles(): Promise<RawArticle[]> {
        return await this.db("articles")
            .select(
                "id",
                "title",
                "content",
                "photo_filename AS photoFilename",
                "created_at",
            )
            .orderBy("created_at", "desc")
    }

    async saveArticle(
        title: string,
        content: string,
        photoFilename: string,
    ): Promise<RawArticle> {
        const createdAt = new Date()
        const [{ id }] = await this.db("articles").insert(
            {
                title,
                content,
                photo_filename: photoFilename,
                created_at: createdAt,
            },
            "id",
        )
        return { id, title, content, photoFilename, createdAt }
    }

    async deleteArticle(id: number): Promise<void> {
        await this.db("articles").delete().where({ id })
    }
}
