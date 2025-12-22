import { PrismaService } from './prisma/prisma.service'; // Ensure this exists or access prisma from AppModule
import { seedDatabase } from './utils/seeder';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security
  app.use(helmet());
  app.enableCors({
    origin: 'http://localhost:3000', // Web App
    credentials: true,
  });
  app.use(cookieParser());

  // Validation
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Black & White Intranet API')
    .setDescription('API documentation for B&W Academy Intranet')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Auto-Seed
  const prismaService = app.get(PrismaService);
  await seedDatabase(prismaService);

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`Server running on http://0.0.0.0:${port}`);
}
bootstrap().catch(err => {
    console.error('SERVER BOOTSTRAP ERROR:', err);
    process.exit(1);
});
