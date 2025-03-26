import { Knex } from 'knex';

type RawUser = { id: number; email: string; password: string }
type User = Omit<RawUser, 'password'>

export class UserStore {
    constructor(private readonly db: Knex) { }

    async getUserById(id: number): Promise<User | null> {
        const user = await this.db('users').select<User>('id', 'email').where({ id }).first()
        return user || null;
    }

    async getUserByLoginAndPassword(email: string, password: string): Promise<User | null> {
        const user = await this.db('users').select<User>('id', 'email').where({ email, password }).first()
        return user || null;
    }
}
