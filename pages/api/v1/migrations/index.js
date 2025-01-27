import migrationRunner from "node-pg-migrate";
import database from "infra/database";
import { join } from "node:path";

export default async function status(req, res) {
  const allowedMethods = ["GET", "POST"];
  if (!allowedMethods.includes(req.method)) {
    return res.status(405).json({
      error: `Method ${req.method} not allowed`,
    });
  }

  let dbClient;

  try {
    dbClient = await database.getNewClient();

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
      return res.status(200).json(pendingMigrations);
    }

    if (req.method === "POST") {
      const migretedMigrations = await migrationRunner({
        ...defaultMigrationOptions,
        dryRun: false,
      });

      if (migretedMigrations.length > 0)
        return res.status(201).json(migretedMigrations);

      return res.status(200).json(migretedMigrations);
    }
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    await dbClient.end();
  }
}
