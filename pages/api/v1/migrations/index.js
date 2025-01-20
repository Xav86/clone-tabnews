import migrationRunner from "node-pg-migrate";
import database from "infra/database";
import { join } from "node:path";

export default async function status(req, res) {
  const dbClient = await database.getNewClient();
  const defaultMigrationOptions = {
    dbClient: dbClient,
    dryRun: true,
    dir: join("infra", "migrations"),
    direction: "up",
    verbose: true,
    migrationsTable: "pgmigrations",
  };

  if (req.method === "GET") {
    const pendingMigrations = await migrationRunner(defaultMigrationOptions);
    await dbClient.end();
    return res.status(200).json(pendingMigrations);
  }

  if (req.method === "POST") {
    const migretedMigrations = await migrationRunner({
      ...defaultMigrationOptions,
      dryRun: false,
    });

    await dbClient.end();

    if (migretedMigrations.length > 0)
      return res.status(201).json(migretedMigrations);

    return res.status(200).json(migretedMigrations);
  }

  return res.status(405).end();
}
