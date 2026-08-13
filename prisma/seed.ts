import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/password";

const prisma = new PrismaClient();

type SeedDenomination = {
  name: string;
  price: number;
  note?: string;
  isPopular?: boolean;
};

type SeedGame = {
  name: string;
  slug: string;
  category: "Mobile Game" | "PC Game" | "Voucher";
  badgeLabel: string;
  badgeFrom: string;
  badgeTo: string;
  requiresZoneId?: boolean;
  playerIdLabel?: string;
  zoneIdLabel?: string;
  instructions?: string;
  isFeatured?: boolean;
  denominations: SeedDenomination[];
};

const GAMES: SeedGame[] = [
  {
    name: "Mobile Legends: Bang Bang",
    slug: "mobile-legends",
    category: "Mobile Game",
    badgeLabel: "ML",
    badgeFrom: "#8B5CF6",
    badgeTo: "#6366F1",
    requiresZoneId: true,
    instructions: "Buka profil di game, salin User ID dan Zone ID (contoh: 123456789 (1234)).",
    isFeatured: true,
    denominations: [
      { name: "86 Diamonds", price: 20000 },
      { name: "172 Diamonds", price: 40000 },
      { name: "257 Diamonds", price: 59000, isPopular: true },
      { name: "344 Diamonds", price: 79000 },
      { name: "429 Diamonds", price: 99000 },
      { name: "514 Diamonds", price: 119000 },
      { name: "Weekly Diamond Pass", price: 29000 },
      { name: "Twilight Pass", price: 149000 },
    ],
  },
  {
    name: "Free Fire",
    slug: "free-fire",
    category: "Mobile Game",
    badgeLabel: "FF",
    badgeFrom: "#F59E0B",
    badgeTo: "#EF4444",
    instructions: "Buka profil di game untuk melihat Player ID (angka di bawah nama).",
    isFeatured: true,
    denominations: [
      { name: "50 Diamonds", price: 7500 },
      { name: "70 Diamonds", price: 10000 },
      { name: "140 Diamonds", price: 20000, isPopular: true },
      { name: "355 Diamonds", price: 50000 },
      { name: "720 Diamonds", price: 100000 },
      { name: "Membership Mingguan", price: 27000 },
    ],
  },
  {
    name: "PUBG Mobile",
    slug: "pubg-mobile",
    category: "Mobile Game",
    badgeLabel: "PUBG",
    badgeFrom: "#F59E0B",
    badgeTo: "#F97316",
    instructions: "Buka Inventory > pojok kiri atas untuk melihat Character ID.",
    isFeatured: true,
    denominations: [
      { name: "60 UC", price: 15000 },
      { name: "325 UC", price: 75000, isPopular: true },
      { name: "660 UC", price: 150000 },
      { name: "1800 UC", price: 385000 },
      { name: "3850 UC", price: 770000 },
      { name: "Royale Pass", price: 155000 },
    ],
  },
  {
    name: "Genshin Impact",
    slug: "genshin-impact",
    category: "Mobile Game",
    badgeLabel: "GI",
    badgeFrom: "#6366F1",
    badgeTo: "#06B6D4",
    requiresZoneId: true,
    playerIdLabel: "UID",
    zoneIdLabel: "Server (Asia/America/Europe/TW,HK,MO)",
    instructions: "Buka menu Paimon Menu > Fitur Lainnya untuk melihat UID di kanan bawah.",
    isFeatured: true,
    denominations: [
      { name: "60 Genesis Crystal", price: 16000 },
      { name: "330 Genesis Crystal", price: 79000, isPopular: true },
      { name: "1090 Genesis Crystal", price: 249000 },
      { name: "2240 Genesis Crystal", price: 479000 },
      { name: "Blessing of the Welkin Moon", price: 29000 },
    ],
  },
  {
    name: "Valorant",
    slug: "valorant",
    category: "PC Game",
    badgeLabel: "VAL",
    badgeFrom: "#EF4444",
    badgeTo: "#EC4899",
    playerIdLabel: "Riot ID (Nama#Tag)",
    instructions: "Salin Riot ID lengkap dengan tag, contoh: Player#1234.",
    denominations: [
      { name: "425 VP", price: 60000 },
      { name: "700 VP", price: 95000, isPopular: true },
      { name: "1375 VP", price: 179000 },
      { name: "2400 VP", price: 299000 },
      { name: "4000 VP", price: 479000 },
    ],
  },
  {
    name: "Call of Duty: Mobile",
    slug: "codm",
    category: "Mobile Game",
    badgeLabel: "CODM",
    badgeFrom: "#22C55E",
    badgeTo: "#06B6D4",
    instructions: "Buka Profil di game untuk melihat Open ID / UID.",
    denominations: [
      { name: "80 CP", price: 15000 },
      { name: "400 CP", price: 75000, isPopular: true },
      { name: "800 CP", price: 149000 },
      { name: "2000 CP", price: 359000 },
      { name: "4000 CP", price: 699000 },
    ],
  },
  {
    name: "Honkai: Star Rail",
    slug: "honkai-star-rail",
    category: "Mobile Game",
    badgeLabel: "HSR",
    badgeFrom: "#8B5CF6",
    badgeTo: "#EC4899",
    requiresZoneId: true,
    playerIdLabel: "UID",
    zoneIdLabel: "Server (Asia/America/Europe/TW,HK,MO)",
    instructions: "Buka Menu > Data Pribadi untuk melihat UID.",
    denominations: [
      { name: "60 Oneiric Shard", price: 16000 },
      { name: "330 Oneiric Shard", price: 79000, isPopular: true },
      { name: "1090 Oneiric Shard", price: 249000 },
      { name: "2240 Oneiric Shard", price: 479000 },
      { name: "Express Supply Pass", price: 29000 },
    ],
  },
  {
    name: "EA Sports FC Mobile",
    slug: "ea-fc-mobile",
    category: "Mobile Game",
    badgeLabel: "FC",
    badgeFrom: "#06B6D4",
    badgeTo: "#22C55E",
    instructions: "Buka Profil di game untuk melihat Player ID.",
    denominations: [
      { name: "100 FC Points", price: 19000 },
      { name: "500 FC Points", price: 89000 },
      { name: "1050 FC Points", price: 179000, isPopular: true },
      { name: "2200 FC Points", price: 349000 },
    ],
  },
  {
    name: "Roblox",
    slug: "roblox",
    category: "Mobile Game",
    badgeLabel: "RBLX",
    badgeFrom: "#EF4444",
    badgeTo: "#8B5CF6",
    playerIdLabel: "Username Roblox",
    instructions: "Gunakan username Roblox kamu (bukan display name).",
    denominations: [
      { name: "400 Robux", price: 75000 },
      { name: "800 Robux", price: 145000, isPopular: true },
      { name: "1700 Robux", price: 289000 },
      { name: "4500 Robux", price: 725000 },
      { name: "10000 Robux", price: 1450000 },
    ],
  },
  {
    name: "Steam Wallet Code",
    slug: "steam-wallet",
    category: "Voucher",
    badgeLabel: "STEAM",
    badgeFrom: "#0EA5E9",
    badgeTo: "#6366F1",
    playerIdLabel: "Email Penerima Kode Voucher",
    instructions: "Kode voucher akan dikirim ke email/WhatsApp yang kamu daftarkan.",
    denominations: [
      { name: "Rp 12.000", price: 14000 },
      { name: "Rp 45.000", price: 49000 },
      { name: "Rp 60.000", price: 65000, isPopular: true },
      { name: "Rp 90.000", price: 96000 },
      { name: "Rp 120.000", price: 126000 },
      { name: "Rp 250.000", price: 259000 },
    ],
  },
  {
    name: "Google Play Gift Card",
    slug: "google-play",
    category: "Voucher",
    badgeLabel: "GPLAY",
    badgeFrom: "#22C55E",
    badgeTo: "#F59E0B",
    playerIdLabel: "Email Penerima Kode Voucher",
    instructions: "Kode voucher akan dikirim ke email/WhatsApp yang kamu daftarkan.",
    denominations: [
      { name: "Rp 10.000", price: 12000 },
      { name: "Rp 20.000", price: 23000 },
      { name: "Rp 50.000", price: 54000, isPopular: true },
      { name: "Rp 100.000", price: 105000 },
      { name: "Rp 150.000", price: 156000 },
      { name: "Rp 300.000", price: 309000 },
    ],
  },
];

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL ?? "admin@ngestore.id";
  const password = process.env.ADMIN_PASSWORD ?? "change-this-password";
  const passwordHash = await hashPassword(password);

  await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash, name: "Admin NgeStore", role: "admin" },
  });

  console.log(`Admin siap: ${email}`);
}

async function seedGames() {
  const existing = await prisma.game.count();
  if (existing > 0) {
    console.log(`Sudah ada ${existing} game, lewati seed katalog.`);
    return;
  }

  for (const [index, game] of GAMES.entries()) {
    await prisma.game.create({
      data: {
        name: game.name,
        slug: game.slug,
        category: game.category,
        badgeLabel: game.badgeLabel,
        badgeFrom: game.badgeFrom,
        badgeTo: game.badgeTo,
        requiresZoneId: game.requiresZoneId ?? false,
        playerIdLabel: game.playerIdLabel ?? "User ID",
        zoneIdLabel: game.zoneIdLabel ?? "Zone ID",
        instructions: game.instructions,
        isFeatured: game.isFeatured ?? false,
        sortOrder: index,
        denominations: {
          create: game.denominations.map((d, i) => ({
            name: d.name,
            price: d.price,
            note: d.note,
            isPopular: d.isPopular ?? false,
            sortOrder: i,
          })),
        },
      },
    });
  }

  console.log(`Seeded ${GAMES.length} game.`);
}

async function main() {
  await seedAdmin();
  await seedGames();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
