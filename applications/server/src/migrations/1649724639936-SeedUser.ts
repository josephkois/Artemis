import {getRepository, MigrationInterface, QueryRunner} from "typeorm";
import { User } from "../models/User";
import { generateHashedPasswordAsync } from "../utils/passwordHash";

export class SeedUser1649724639936 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const user = new User();
        user.email = "test@test.com";
        user.password = await generateHashedPasswordAsync("test");
        user.username = "testuser";
        await user.save();
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const user = await getRepository(User).createQueryBuilder("user")
        .where("user.username = testuser")
        .getOne();
        await user?.remove();
    }

}
