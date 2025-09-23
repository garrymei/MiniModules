"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_minimal_module_1 = require("./app-minimal.module");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_minimal_module_1.AppMinimalModule);
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    const config = new swagger_1.DocumentBuilder()
        .setTitle('MiniModules API')
        .setVersion('0.1.0')
        .addBearerAuth()
        .build();
    const doc = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('/docs', app, doc);
    await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000);
    console.log(`🚀 Server running on port ${process.env.PORT || 3000}`);
}
bootstrap();
