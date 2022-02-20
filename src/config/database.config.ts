import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';
import { config } from 'dotenv';

config();
function typeormModuleOptions(): TypeOrmModuleOptions {
    return {
        type: 'mysql',
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        entities: [join(__dirname, '../**/**/*entity{.ts,.js}')],
        autoLoadEntities: true,
        synchronize: true,
    }
}
export default registerAs('database', () => ({
    config: typeormModuleOptions()
}));

