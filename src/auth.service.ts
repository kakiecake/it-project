import { UserStore } from "./user.store";

export class AuthService {
    constructor(private readonly userStore: UserStore) { }

    async loginUser(email: string, password: string) {
        const user = await this.userStore.getUserByLoginAndPassword(email, password);
        if (!user) return false;
    }
}
