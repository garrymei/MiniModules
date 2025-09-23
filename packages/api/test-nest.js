const { NestFactory } = require('@nestjs/core');

class HealthController {
  health() {
    return { ok: true, ts: Date.now() };
  }
}

const { Controller, Get, Module } = require('@nestjs/common');

const ControllerDecorator = Controller();
const GetDecorator = Get('/healthz');

ControllerDecorator(HealthController);
GetDecorator(HealthController.prototype, 'health', Object.getOwnPropertyDescriptor(HealthController.prototype, 'health'));

const AppModule = class AppModule {};
const ModuleDecorator = Module({
  controllers: [HealthController],
});

ModuleDecorator(AppModule);

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3002);
  console.log('NestJS test server running on port 3002');
}

bootstrap().catch(console.error);
