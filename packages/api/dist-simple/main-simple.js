"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_simple_module_1 = require("./app-simple.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_simple_module_1.AppSimpleModule);
    await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000);
}
bootstrap();
