import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const apiPrefix = config.get<string>('app.apiPrefix', 'api');
  app.setGlobalPrefix(apiPrefix);
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  const corsOrigin = config.get<string[]>('app.corsOrigin', ['http://localhost:3000']);
  const port = config.get<number>('app.port', 4000);
  const appName = config.get<string>('app.name', 'Corekit API');

  app.use(helmet());
  app.use(compression());

  app.enableCors({
    origin: corsOrigin.includes('*') ? true : corsOrigin,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle(appName)
    .setDescription('Corekit backend API')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document);

  await app.listen(port);
  console.log(`${appName} running on http://localhost:${port}/${apiPrefix}`);
}

bootstrap();
