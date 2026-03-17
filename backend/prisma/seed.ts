import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // ── Bundle Map: 3 bundles ──────────────────────────────────
    const bundles = [
        {
            slug: 'basic',
            name: 'Мінімальний',
            baseOfferId: 'peroxide-5l',
            addonOfferIds: ['test-strips'],
            rules: {
                description: 'Базовий набір для невеликого басейну до 15 м³',
            },
            isActive: true,
        },
        {
            slug: 'optimal',
            name: 'Оптимальний',
            baseOfferId: 'peroxide-20l',
            addonOfferIds: ['test-strips', 'algicide-1l'],
            rules: {
                description: 'Повний комплект для басейну 15–40 м³ на весь сезон',
                testStripsQty: 2,
            },
            isActive: true,
        },
        {
            slug: 'maximum',
            name: 'Максимальний',
            baseOfferId: 'peroxide-20l',
            addonOfferIds: ['test-strips', 'algicide-1l', 'ph-regulator-1kg'],
            rules: {
                description: 'Професійний набір для великих басейнів від 40 м³',
                baseQtyMultiplier: 2,
                testStripsQty: 3,
                algicideQty: 2,
            },
            isActive: true,
        },
    ];

    for (const bundle of bundles) {
        await prisma.bundleMap.upsert({
            where: { slug: bundle.slug },
            update: bundle,
            create: bundle,
        });
        console.log(`  ✅ Bundle "${bundle.name}" (${bundle.slug})`);
    }

    console.log('✅ Seed completed!');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
