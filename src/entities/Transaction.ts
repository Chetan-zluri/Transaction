import { Entity, PrimaryKey, Property } from "@mikro-orm/core";

@Entity()
export class Transaction {
  @PrimaryKey()
  id!: number;

  @Property()
  date!: Date;

  @Property()
  description!: string;

  @Property()
  amount!: number;

  @Property()
  Currency!: string;

  @Property({ default: false })
  deleted: boolean = false;
}
