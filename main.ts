import { MarkdownView, Plugin, WorkspaceLeaf } from "obsidian";
import { ManuscriptView, PULPITIAN_VIEW_TYPE } from "./manuscript-view";
import { DEFAULT_SETTINGS, PulpitianSettings, PulpitianSettingTab } from "./settings";

export default class PulpitianPlugin extends Plugin {
  settings: PulpitianSettings = DEFAULT_SETTINGS;

  async onload(): Promise<void> {
    await this.loadSettings();
    this.registerView(PULPITIAN_VIEW_TYPE, (leaf) => new ManuscriptView(leaf, this));
    this.addSettingTab(new PulpitianSettingTab(this.app, this));

    this.addCommand({
      id: "open-current-manuscript",
      name: "Open current note in Pulpitian",
      checkCallback: (checking) => {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!view?.file) return false;
        if (!checking) void this.openManuscript(view.file);
        return true;
      }
    });
  }

  onunload(): void {
    void this.app.workspace.detachLeavesOfType(PULPITIAN_VIEW_TYPE);
  }

  async loadSettings(): Promise<void> {
    this.settings = { ...DEFAULT_SETTINGS, ...(await this.loadData()) };
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  private async openManuscript(file: MarkdownView["file"]): Promise<void> {
    if (!file) return;
    const leaf: WorkspaceLeaf = this.app.workspace.getLeaf("tab");
    await leaf.setViewState({ type: PULPITIAN_VIEW_TYPE, active: true });
    const view = leaf.view;
    if (view instanceof ManuscriptView) await view.showManuscript(file);
  }
}
