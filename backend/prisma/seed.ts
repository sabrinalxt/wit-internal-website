// Dev-only seed data. Idempotent: safe to run repeatedly (everything is upserted).
//
// Run with: npm run db:seed
//
// WARNING: every seeded account shares one well-known DEV-ONLY password
// (default below, or override with SEED_DEV_PASSWORD). Never run this against
// a shared, staging or production database.
//
// TODO(db-migrations-seed): extend with sample proposals/events once those flows exist.
import { PrismaClient, RoleName } from "@prisma/client";
import bcrypt from "bcrypt";

if (process.env.NODE_ENV === "production") {
  console.error("Refusing to seed: NODE_ENV=production.");
  process.exit(1);
}

const prisma = new PrismaClient();

const DEV_PASSWORD = process.env.SEED_DEV_PASSWORD ?? "DevOnly-ChangeMe-123";

const ROLES: RoleName[] = [
  RoleName.Requestor,
  RoleName.PillarLead,
  RoleName.Approver,
  RoleName.Admin,
  RoleName.Viewer,
];

const USERS: {
  email: string;
  first_name: string;
  last_name: string;
  roles: RoleName[];
}[] = [
  { email: "admin@wit.local", first_name: "Alex", last_name: "Admin", roles: [RoleName.Admin] },
  {
    email: "requestor@wit.local",
    first_name: "Riley",
    last_name: "Requestor",
    roles: [RoleName.Requestor],
  },
  {
    email: "pillarlead@wit.local",
    first_name: "Parker",
    last_name: "PillarLead",
    roles: [RoleName.PillarLead],
  },
  {
    email: "approver@wit.local",
    first_name: "Avery",
    last_name: "Approver",
    roles: [RoleName.Approver],
  },
  { email: "viewer@wit.local", first_name: "Val", last_name: "Viewer", roles: [RoleName.Viewer] },
  // One user holding several roles
  {
    email: "multi@wit.local",
    first_name: "Morgan",
    last_name: "Multi",
    roles: [RoleName.Requestor, RoleName.PillarLead, RoleName.Approver],
  },
];

async function main() {
  const password_hash = await bcrypt.hash(DEV_PASSWORD, 10);

  const roleIds = new Map<RoleName, number>();
  for (const role_name of ROLES) {
    const role = await prisma.role.upsert({
      where: { role_name },
      update: {},
      create: { role_name },
    });
    roleIds.set(role_name, role.role_id);
  }

  for (const u of USERS) {
    // update is empty so re-running never overwrites a changed password
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        first_name: u.first_name,
        last_name: u.last_name,
        password_hash,
      },
    });

    for (const role_name of u.roles) {
      const role_id = roleIds.get(role_name)!;
      await prisma.userRole.upsert({
        where: { user_id_role_id: { user_id: user.user_id, role_id } },
        update: {},
        create: { user_id: user.user_id, role_id },
      });
    }
  }

  console.log(`Seeded ${ROLES.length} roles and ${USERS.length} users.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
