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
  driverOptions: {
    connection: {
      ssl: true,
    },
  },
};
export default config;
