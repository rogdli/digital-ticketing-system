import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data (optional - solo para desarrollo)
  await prisma.ticket.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Cleared existing data');

  // Create demo users
  const password = await bcrypt.hash('password123', 10);

  const demoUser = await prisma.user.create({
    data: {
      email: 'demo@ticketing.com',
      password,
      firstName: 'Demo',
      lastName: 'User',
      phone: '+5492664123456',
      role: 'USER',
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@ticketing.com',
      password,
      firstName: 'Admin',
      lastName: 'User',
      phone: '+5492664789012',
      role: 'ADMIN',
    },
  });

  console.log('✅ Created demo users');

  // Create events
const events = [
    {
      title: 'Quilmes Rock 2026',
      description: 'El regreso del festival más grande de Argentina. Los Piojos, Divididos y bandas internacionales sorpresa. Patios de comida y activaciones de marca.',
      imageUrl: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800',
      venue: 'Tecnópolis',
      address: 'Av. Gral. Paz y Av. San Martín, Villa Martelli',
      date: new Date('2026-06-15T16:00:00Z'),
      totalTickets: 15000,
      availableTickets: 1200,
      price: 45000,
      status: 'PUBLISHED' as const,
    },
    {
      title: 'JSConf Argentina 2026',
      description: 'La conferencia de tecnología más importante de la región. Speakers de Vercel, Google y Meta. Networking y workshops avanzados.',
      imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
      venue: 'Ciudad Cultural Konex',
      address: 'Sarmiento 3131, CABA',
      date: new Date('2026-07-20T09:00:00Z'),
      totalTickets: 500,
      availableTickets: 145,
      price: 35000,
      status: 'PUBLISHED' as const,
    },
    {
      title: 'Noche de Stand Up: Laila Roth',
      description: 'Un show íntimo con una de las mejores comediantes del país. Material nuevo y clásicos de siempre. Consumición mínima requerida.',
      imageUrl: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800',
      venue: 'Paseo La Plaza',
      address: 'Av. Corrientes 1660, CABA',
      date: new Date('2026-05-10T21:00:00Z'),
      totalTickets: 200,
      availableTickets: 45,
      price: 12000,
      status: 'PUBLISHED' as const,
    },
    {
      title: 'Afterlife Buenos Aires',
      description: 'La experiencia audiovisual electrónica más inmersiva del mundo llega a Mandarine Park. Tale Of Us y artistas invitados.',
      imageUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
      venue: 'Mandarine Park',
      address: 'Av. Costanera Norte y Sarmiento, CABA',
      date: new Date('2026-08-05T23:00:00Z'),
      totalTickets: 5000,
      availableTickets: 150,
      price: 65000,
      status: 'PUBLISHED' as const,
    },
    {
      title: 'Feria Vinos y Bodegas',
      description: 'Degustación exclusiva de las mejores bodegas de Mendoza y Salta. Incluye copa de cristal de regalo y catering gourmet.',
      imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800',
      venue: 'La Rural - Predio Ferial',
      address: 'Av. Sarmiento 2704, Palermo, CABA',
      date: new Date('2026-05-25T18:00:00Z'),
      totalTickets: 300,
      availableTickets: 12,
      price: 25000,
      status: 'PUBLISHED' as const,
    },
    {
      title: 'Disney on Ice: Magia Eterna',
      description: 'El espectáculo familiar número uno. Mickey, Minnie y los personajes de Frozen patinando sobre hielo en una aventura inolvidable.',
      imageUrl: 'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800',
      venue: 'Movistar Arena',
      address: 'Humboldt 450, Villa Crespo, CABA',
      date: new Date('2026-06-01T16:00:00Z'),
      totalTickets: 2000,
      availableTickets: 800,
      price: 18000,
      status: 'PUBLISHED' as const,
    },
    {
      title: 'Superclásico: Boca vs. River',
      description: 'El partido más apasionante del mundo. Torneo de la Liga Profesional. Solo socios y abonados (remanente para no socios).',
      imageUrl: 'https://derechadiario.com.ar/filesedc/uploads/image/post/screenshot-2024-11-09-140903_1600_1067.webp',
      venue: 'La Bombonera',
      address: 'Av. Figueroa Alcorta 7597, Nuñez, CABA',
      date: new Date('2026-07-12T17:00:00Z'),
      totalTickets: 80000,
      availableTickets: 0,
      price: 55000,
      status: 'PUBLISHED' as const,
    },
    {
      title: 'Jazz & Dinner: Bebop Club',
      description: 'Cena show con la mejor banda de Jazz de la ciudad. Ambiente íntimo estilo Nueva York en pleno Palermo.',
      imageUrl: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800',
      venue: 'Bebop Club',
      address: 'Uriarte 1658, Palermo, CABA',
      date: new Date('2026-09-18T21:00:00Z'),
      totalTickets: 80,
      availableTickets: 15,
      price: 22000,
      status: 'PUBLISHED' as const,
    },
    {
      title: 'Yoga en el Rosedal',
      description: 'Clase abierta masiva de Yoga y Meditación al aire libre. Traer mat y botella de agua. Se suspende por lluvia.',
      imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800',
      venue: 'Rosedal de Palermo',
      address: 'Av. Infanta Isabel, Parque 3 de Febrero',
      date: new Date('2026-06-28T10:00:00Z'),
      totalTickets: 500,
      availableTickets: 450,
      price: 2000,
      status: 'PUBLISHED' as const,
    },
  ];

  for (const eventData of events) {
    await prisma.event.create({
      data: eventData,
    });
  }

  console.log(`✅ Created ${events.length} events`);

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📧 Demo credentials:');
  console.log('   Email: demo@ticketing.com');
  console.log('   Password: password123');
  console.log('\n👤 Admin credentials:');
  console.log('   Email: admin@ticketing.com');
  console.log('   Password: password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });