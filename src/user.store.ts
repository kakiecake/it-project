type User = { id: number; email: string; password: string }

export class UserStore {
    private users: User[] = [{
        id: 1,
        email: 'oleg@gmail.com',
        password: '1234567'
    }]

    constructor() { }

    async getUserById(id: number): Promise<User | null> {
        return this.users.find(u => u.id === id) || null;
    }

    async getUserByLoginAndPassword(email: string, password: string): Promise<{ id: number; email: string; password: string } | null> {
        return this.users.find(u => u.email === email && u.password === password) || null
    }
}
