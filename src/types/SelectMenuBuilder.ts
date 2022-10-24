import { SelectMenuComponentData } from "discord.js";
import { defaultify } from "stuffs";
import { NamespaceEnums } from "../../generated/namespaceData";
import { DBISelectMenu } from "./SelectMenu";

export type DBISelectMenuOverrides = Omit<SelectMenuComponentData, "customId" | "type">

export class DBISelectMenuBuilder<TNamespace extends NamespaceEnums> {
  component: DBISelectMenu<TNamespace>
  overrides: DBISelectMenuOverrides;
  reference: { data: (string | number | object)[], ttl?: number };
  constructor(arg: { component: DBISelectMenu<TNamespace>, overrides?: DBISelectMenuOverrides, reference?: { data: (string | number | object)[], ttl?: number } }) {
    this.component = arg.component;
    this.overrides = arg.overrides ?? {};
    this.reference = arg.reference ?? { data: [] };
  }

  setTTL(ttl: number) {
    this.reference.ttl = (this.reference.ttl ?? 0) + ttl;
    return this;
  }

  setData(...data: (string | number | object)[]) {
    this.reference.data = data;
    return this;
  }

  addData(...data: (string | number | object)[]) {
    this.reference.data = [...this.reference.data, ...data];
    return this;
  }

  setOverrides(overrides: DBISelectMenuOverrides) {
    this.overrides = overrides;
    return this;
  }

  addOverrides(overrides: DBISelectMenuOverrides) {
    this.overrides = defaultify(overrides, this.overrides, true);
    return this;
  }

  toJSON() {
    return this.component.toJSON({ overrides: this.overrides, reference: this.reference });
  }

}