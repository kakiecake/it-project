import { Article } from "./article"
import { ArticleStore } from "./article.store"

export class ArticleService {
    private articles: Article[] = [
        {
            id: 1,
            photoUrl: 'https://news.northwestern.edu/assets/Stories/2023/03/get-out970__FitMaxWzk3MCw2NTBd.jpg',
            title: 'Putin wants sex!',
            content: 'Vladimir Putin announced cum season',
        },
        {
            id: 2,
            title: 'Joe Biden died from ligma',
            content: 'Unfortunate',
        },
        {
            id: 3,
            title: 'New cock type discovered',
            content: 'Among us',
        },
    ]

    constructor(private readonly articleStore: ArticleStore) { }

    async listArticles(): Promise<Article[]> {
        return this.articles
    }

    async createArticle(title: string, content: string, photoUrl?: string): Promise<Article> {
        const article = {
            id: this.articles[this.articles.length - 1].id + 1,
            title,
            content,
            photoUrl
        }
        this.articles.push(article)
        return article
    }

    async getArticleById(id: number): Promise<Article | null> {
        return this.articles.find(a => a.id === id) || null
    }
}
