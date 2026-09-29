import { App, PluginSettingTab, Setting } from "obsidian";
import type PulpitianPlugin from "./main";

export interface PulpitianSettings {
  readingTheme: "black" | "sepia";
  fontSize: number;
  lineHeight: number;
}

export const DEFAULT_SETTINGS: PulpitianSettings = {
  readingTheme: "black",
  fontSize: 24,
  lineHeight: 1.65
};

export class PulpitianSettingTab extends PluginSettingTab {
  constructor(app: App, private readonly plugin: PulpitianPlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Pulpitian" });
    containerEl.createEl("p", {
      text: "Reading settings apply to the Pulpitian manuscript view."
    });

    new Setting(containerEl)
      .setName("Reading theme")
      .setDesc("Choose the low-distraction appearance for the manuscript view.")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("black", "Black")
          .addOption("sepia", "Sepia")
          .setValue(this.plugin.settings.readingTheme)
          .onChange(async (value) => {
            this.plugin.settings.readingTheme = value === "sepia" ? "sepia" : "black";
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Font size")
      .setDesc("Size in pixels.")
      .addSlider((slider) =>
        slider
          .setLimits(16, 42, 1)
          .setValue(this.plugin.settings.fontSize)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.fontSize = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Line height")
      .addSlider((slider) =>
        slider
          .setLimits(1.2, 2.2, 0.05)
          .setValue(this.plugin.settings.lineHeight)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.lineHeight = value;
            await this.plugin.saveSettings();
          })
      );
  }
}
