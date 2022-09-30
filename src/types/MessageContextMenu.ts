import { DBI } from "../DBI";
import { DBIBaseInteraction, IDBIBaseExecuteCtx } from "./Interaction";
import Discord from "discord.js";
import { NamespaceEnums } from "../../generated/namespaceData";

export type TDBIMessageContextMenuOmitted<TNamespace extends NamespaceEnums = NamespaceEnums> = Omit<DBIMessageContextMenu<TNamespace>, "type" | "description" | "dbi" | "options">;

export interface IDBIMessageContextMenuExecuteCtx<TNamespace extends NamespaceEnums = NamespaceEnums> extends IDBIBaseExecuteCtx<TNamespace> {
  interaction: Discord.MessageContextMenuCommandInteraction<"cached">;
}


export class DBIMessageContextMenu<TNamespace extends NamespaceEnums = NamespaceEnums> extends DBIBaseInteraction<TNamespace> {
  constructor(dbi: DBI, cfg: TDBIMessageContextMenuOmitted) {
    super(dbi, {
      ...(cfg as any),
      type: "MessageContextMenu"
    });

    this.directMessages = cfg.directMessages ?? dbi.config.defaults.directMessages;
    this.defaultMemberPermissions = cfg.defaultMemberPermissions ?? dbi.config.defaults.defaultMemberPermissions;
  }

  directMessages?: boolean;
  defaultMemberPermissions?: Discord.PermissionsString[];
  override onExecute(ctx: IDBIMessageContextMenuExecuteCtx<TNamespace>): Promise<any> | any {}
}