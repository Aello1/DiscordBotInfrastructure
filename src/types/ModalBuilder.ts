import { ActionRowData, APIActionRowComponent, APITextInputComponent, JSONEncodable, ModalActionRowComponentData, ModalComponentData } from "discord.js";
import { defaultify } from "stuffs";
import { NamespaceEnums } from "../../generated/namespaceData";
import { DBIModal } from "./Modal";

export type DBIModalOverrides = { components?: (JSONEncodable<APIActionRowComponent<APITextInputComponent>> | ActionRowData<ModalActionRowComponentData>)[], title?: string } & Omit<ModalComponentData, "customId" | "type" | "title" | "components">

export class DBIModalBuilder<TNamespace extends NamespaceEnums> {
  component: DBIModal<TNamespace>
  overrides: DBIModalOverrides;
  reference: { data: (string | number | object)[], ttl?: number };
  constructor(arg: { component: DBIModal<TNamespace>, overrides?: DBIModalOverrides, reference?: { data: (string | number | object)[], ttl?: number } }) {
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

  setOverrides(overrides: DBIModalOverrides) {
    this.overrides = overrides;
    return this;
  }

  addOverrides(overrides: DBIModalOverrides) {
    this.overrides = defaultify(overrides, this.overrides, true);
    return this;
  }

  toJSON() {
    return this.component.toJSON({ overrides: this.overrides, reference: this.reference });
  }

}