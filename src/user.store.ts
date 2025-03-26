import { Knex } from 'knex';

type RawUser = { id: number; email: string; password: string; isAdmin: boolean; }
export type User = Omit<RawUser, 'password'>

export class UserStore {
    constructor(private readonly db: Knex) { }

    async getUserById(id: number): Promise<User | null> {
        const user = await this.db('users').select<User>('id', 'email', 'is_admin AS isAdmin').where({ id }).first()
        return user || null;
    }

    async getUserByLoginAndPassword(email: string, password: string): Promise<User | null> {
        const user = await this.db('users').select<User>('id', 'email', 'is_admin AS isAdmin').where({ email, password }).first()
        return user || null;
    }

    async addUser(email: string, password: string): Promise<User | null> {
        try {
            const [{ id }] = await this.db('users').insert({ email, password, is_admin: false }, 'id');
            return { id, email, isAdmin: false }
        } catch (_) {
            return null
        }
    }
}
