import "dotenv/config";
import db from "~db/models";
import Sentry from "~services/sentry";
import log from "~utils/logger";

const { sequelize, Application } = db;

const listApp = async () => {
  try {
    await sequelize.sync();
    const apps = await Application.findAll();

    apps.forEach((app) =>
      process.stdout.write(`${app.name}: ${app.clientID}\n`)
    );
  } catch (err) {
    Sentry.captureException(err);
    log.error({ err });
  }
  await sequelize.close();
};

listApp();
