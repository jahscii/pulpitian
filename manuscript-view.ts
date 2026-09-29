import { ItemView, MarkdownRenderer, Notice, TFile, WorkspaceLeaf } from "obsidian";
import type PulpitianPlugin from "./main";

export const PULPITIAN_VIEW_TYPE = "pulpitian-manuscript";

export class ManuscriptView extends ItemView {
  private activeFile: TFile | null = null;
  private scrollPosition = 0;
  private startedAt: number | null = null;
  private timerId: number | null = null;

  constructor(leaf: WorkspaceLeaf, private readonly plugin: PulpitianPlugin) {
    super(leaf);
  }

  getViewType(): string {
    return PULPITIAN_VIEW_TYPE;
  }

  getDisplayText(): string {
    return this.activeFile ? `Pulpitian: ${this.activeFile.basename}` : "Pulpitian";
  }

  async onOpen(): Promise<void> {
    this.containerEl.addClass("pulpitian-view");
    this.registerEvent(
      this.app.workspace.on("file-open", (file) => {
        if (file instanceof TFile && file.extension === "md") {
          void this.showManuscript(file);
        }
      })
    );
  }

  async onClose(): Promise<void> {
    this.stopTimer();
    this.containerEl.empty();
  }

  async showManuscript(file: TFile): Promise<void> {
    this.activeFile = file;
    this.scrollPosition = 0;
    await this.render();
  }

  private async render(): Promise<void> {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.removeClasses(["pulpitian-theme-black", "pulpitian-theme-sepia"]);
    containerEl.addClass(`pulpitian-theme-${this.plugin.settings.readingTheme}`);

    const toolbar = containerEl.createDiv({ cls: "pulpitian-toolbar" });
    toolbar.createEl("strong", { text: this.activeFile?.basename ?? "No manuscript selected" });
    const timer = toolbar.createSpan({ cls: "pulpitian-timer", text: "00:00" });
    toolbar.createEl("button", { text: "Start timer" }).addEventListener("click", () => {
      this.toggleTimer(timer);
    });

    const manuscriptEl = containerEl.createDiv({ cls: "pulpitian-manuscript" });
    manuscriptEl.style.fontSize = `${this.plugin.settings.fontSize}px`;
    manuscriptEl.style.lineHeight = String(this.plugin.settings.lineHeight);
    manuscriptEl.addEventListener("scroll", () => {
      this.scrollPosition = manuscriptEl.scrollTop;
    });

    if (!this.activeFile) {
      manuscriptEl.createEl("p", { text: "Open a Markdown note, then use ‘Open current note in Pulpitian’." });
      return;
    }

    const source = await this.app.vault.read(this.activeFile);
    await MarkdownRenderer.render(this.app, source, manuscriptEl, this.activeFile.path, this);
    manuscriptEl.scrollTop = this.scrollPosition;
  }

  private toggleTimer(timerEl: HTMLElement): void {
    if (this.startedAt !== null) {
      this.stopTimer();
      timerEl.textContent = "00:00";
      new Notice("Pulpitian timer reset.");
      return;
    }

    this.startedAt = Date.now();
    this.timerId = window.setInterval(() => {
      if (this.startedAt === null) return;
      const seconds = Math.floor((Date.now() - this.startedAt) / 1000);
      const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
      const remainder = (seconds % 60).toString().padStart(2, "0");
      timerEl.textContent = `${minutes}:${remainder}`;
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerId !== null) window.clearInterval(this.timerId);
    this.timerId = null;
    this.startedAt = null;
  }
}
