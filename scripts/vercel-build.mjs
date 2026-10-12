// Vercel build entrypoint.
//
// Only the PRODUCTION build touches the database. Preview builds share the same
// database, so if they also ran migrate/seed, two builds triggered at once
// (a push to main plus a push to the working branch) would run
// `prisma migrate deploy` concurrently against one database and collide on
// Prisma's migration lock — which is what makes some production deploys error.
import { execSync } from "node:child_process";

function run(cmd) {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}

run("prisma generate");

if (process.env.VERCEL_ENV === "production") {
  run("prisma migrate deploy");
  run("tsx prisma/seed.ts");
} else {
  console.log(
    `Skipping migrate/seed (VERCEL_ENV=${process.env.VERCEL_ENV ?? "unset"}); ` +
      "the shared database is migrated by the production build.",
  );
}

run("next build");
