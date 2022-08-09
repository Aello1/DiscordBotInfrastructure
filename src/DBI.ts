import Discord from "discord.js";
import { DBIChatInput, TDBIChatInputOmitted } from "./types/ChatInput/ChatInput";
import { DBIChatInputOptions } from "./types/ChatInput/ChatInputOptions";
import { publishInteractions } from "./methods/publishInteractions";
import { DBIEvent, TDBIEventOmitted } from "./types/Event";
import * as stuffs from "stuffs";
import { MemoryStore } from "./utils/MemoryStore";
import { hookInteractionListeners } from "./methods/hookInteractionListeners";
import { Events } from "./Events";

export interface DBIConfig {
  discord: {
    token: string;
    options?: Discord.ClientOptions
  }
  sharding?: {
    clusterCount: "auto" | number,
    shardCountPerCluster: number
  }

  store?: {
    get(key: string, defaultValue: any): Promise<any>;
    set(key: string): Promise<void>;
    del(key: string): Promise<void>;
    has(key: string): Promise<boolean>;
  }
}

export interface DBIRegisterAPI {
  ChatInput(cfg: TDBIChatInputOmitted): DBIChatInput;
  ChatInputOptions: typeof DBIChatInputOptions;
  Event(cfg: TDBIEventOmitted): DBIEvent;
}

export class DBI {
  namespace: string;
  config: DBIConfig;
  client: Discord.Client<true>;
  data: {
    interactions: Discord.Collection<string, DBIChatInput>;
    events: Discord.Collection<string, DBIEvent>;
    plugins: Discord.Collection<string, any>;
    other: Record<string, any>;
    unloaders: Set<() => void>;
    registers: Set<(...args: any[]) => any>;
  };
  events: Events;
  constructor(namespace: string, config: DBIConfig) {
    this.namespace = namespace;
    this.config = stuffs.defaultify(config, {
      store: new MemoryStore()
    }, true);

    this.data = {
      interactions: new Discord.Collection(),
      events: new Discord.Collection(),
      plugins: new Discord.Collection(),
      other: {},
      unloaders: new Set(),
      registers: new Set(),
    }

    this.events = new Events(this);
    this.client = new Discord.Client(config.discord?.options);
    this._hookListeners();
  }

  private async _hookListeners() {
    let unload = hookInteractionListeners(this);
    this.data.unloaders.add(unload);
  }

  private _unregisterAll() {
    this.data.events.clear();
    this.data.interactions.clear();
    this.data.plugins.clear();
  }

  private async _registerAll() {
    const self = this;

    for await (const cb of this.data.registers) {
      let ChatInput = function(cfg: DBIChatInput) {
        let dbiInteraction = new DBIChatInput(cfg);
        if (self.data.interactions.has(dbiInteraction.name)) throw new Error(`DBIInteraction "${dbiInteraction.name}" already loaded!`);
        self.data.interactions.set(dbiInteraction.name, dbiInteraction);
        return dbiInteraction;
      };
      ChatInput = Object.assign(ChatInput, class { constructor(...args) { return ChatInput.call(this, ...args); } });

      let Event = function(cfg: TDBIEventOmitted) {
        let dbiEvent = new DBIEvent(cfg);
        if (self.data.events.has(dbiEvent.name)) throw new Error(`DBIEvent "${dbiEvent.name}" already loaded!`);
        self.data.events.set(dbiEvent.name, dbiEvent);
        return dbiEvent;
      };
      Event = Object.assign(Event, class { constructor(...args) { return Event.call(this, ...args); } });

      return await cb({
        ChatInput,
        Event,
        ChatInputOptions: DBIChatInputOptions
      });
    }
  }

  async login(): Promise<any> {
    await this.client.login(this.config.discord.token);
  }

  async register(cb: (api: DBIRegisterAPI) => void): Promise<any> {
    this.data.registers.add(cb);
  }

  async publish(type: "Global", clear?: boolean): Promise<any>;
  async publish(type: "Guild", guildId: string, clear?: boolean): Promise<any>;

  async publish(...args) {
    switch (args[0]) {
      case "Global": {
        return await publishInteractions(
          this.config.discord.token,
          args[1] ? new Discord.Collection() : this.data.interactions,
          args[0]
        );
      }
      case "Guild": {
        return await publishInteractions(
          this.config.discord.token,
          args[2] ? new Discord.Collection() : this.data.interactions,
          args[0],
          args[1]
        );
      }
    }
  }

  
}