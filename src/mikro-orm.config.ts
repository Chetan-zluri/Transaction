import { MikroORM } from "@mikro-orm/core";
import { PostgreSqlDriver } from "@mikro-orm/postgresql";
import * as dotenv from "dotenv";
import { Transaction } from "./entities/Transaction";

dotenv.config();

const config: Parameters<typeof MikroORM.init>[0] = {
  driver: PostgreSqlDriver,
  entities: [Transaction],
  clientUrl:
    "postgresql://chetan_owner:6ZOe9MAVQsiY@ep-proud-surf-a5ctbqfo.us-east-2.aws.neon.tech/chetan?sslmode=require",
  //   dbName: process.env.DB_NAME,
  //   type: "postgresql",
  //   user: process.env.DB_USER,
  //   password: process.env.DB_PASSWORD,
  //   host: process.env.DB_HOST,
  //   port: parseInt(process.env.DB_PORT || "5432", 10),
  driverOptions: {
    connection: {
      ssl: true,
    },
  },
};
export default config;
