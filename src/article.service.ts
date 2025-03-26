import { Article } from "./article"
import { ArticleStore, RawArticle } from "./article.store"

export class ArticleService {
    constructor(
        private readonly articleStore: ArticleStore,
        private readonly options: { basePhotoUrl: string },
    ) { }

    private transformRawArticle(rawArticle: RawArticle): Article {
        return {
            id: rawArticle.id,
            content: rawArticle.content,
            title: rawArticle.title,
            photoUrl: `${this.options.basePhotoUrl}/${rawArticle.photoFilename}`,
            createdAt: rawArticle.createdAt,
        }
    }

    async listArticles(): Promise<Article[]> {
        const rawArticles = await this.articleStore.getArticles()
        return rawArticles.map((a) => this.transformRawArticle(a))
    }

    async createArticle(
        title: string,
        content: string,
        photoFilename: string,
    ): Promise<Article> {
        const rawArticle = await this.articleStore.saveArticle(title, content, photoFilename)
        return this.transformRawArticle(rawArticle)
    }

    async getArticleById(id: number): Promise<Article | null> {
        const rawArticle = await this.articleStore.getArticleById(id)
        return rawArticle ? this.transformRawArticle(rawArticle) : null;
    }
}
