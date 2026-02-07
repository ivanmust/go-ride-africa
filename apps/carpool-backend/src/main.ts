import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: true,
    }),
  );

  app.enableCors({
    origin: '*',
    credentials: false,
  });

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`Carpool backend listening on http://localhost:${port}`);
}

bootstrap();
