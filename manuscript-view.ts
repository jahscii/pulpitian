import { ItemView, MarkdownRenderer, TFile, WorkspaceLeaf } from "obsidian";
import type PulpitianPlugin from "./main";

export const PULPITIAN_VIEW_TYPE = "pulpitian-manuscript";

type TimerState = "idle" | "running" | "paused";

export class ManuscriptView extends ItemView {
  private activeFile: TFile | null = null;
  private scrollPosition = 0;

  private timerState: TimerState = "idle";
  private timerStartedAt: number | null = null;
  private elapsedBeforeStart = 0;
  private timerId: number | null = null;

  private timerEl: HTMLElement | null = null;
  private timerButton: HTMLButtonElement | null = null;

  constructor(
    leaf: WorkspaceLeaf,
    private readonly plugin: PulpitianPlugin
  ) {
    super(leaf);
  }

  getViewType(): string {
    return PULPITIAN_VIEW_TYPE;
  }

  getDisplayText(): string {
    return this.activeFile
      ? `Pulpitian: ${this.activeFile.basename}`
      : "Pulpitian";
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
    this.clearTimer();
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
    containerEl.removeClasses([
      "pulpitian-theme-black",
      "pulpitian-theme-sepia"
    ]);

    containerEl.addClass(
      `pulpitian-theme-${this.plugin.settings.readingTheme}`
    );

    const toolbar = containerEl.createDiv({
      cls: "pulpitian-toolbar"
    });

    toolbar.createDiv({
      cls: "pulpitian-title",
      text: this.activeFile?.basename ?? "No manuscript selected"
    });

    const timerPanel = toolbar.createDiv({
      cls: "pulpitian-timer-panel"
    });

    this.timerEl = timerPanel.createDiv({
      cls: "pulpitian-timer",
      text: "00:00"
    });

    const controls = timerPanel.createDiv({
      cls: "pulpitian-timer-controls"
    });

    this.timerButton = controls.createEl("button", {
      text: "Start"
    });

    this.timerButton.addEventListener("click", () => {
      this.handleTimerButton();
    });

    const resetButton = controls.createEl("button", {
      text: "Reset"
    });

    resetButton.addEventListener("click", () => {
      this.resetTimer();
    });

    const manuscriptEl = containerEl.createDiv({
      cls: "pulpitian-manuscript"
    });

    manuscriptEl.style.fontSize =
      `${this.plugin.settings.fontSize}px`;

    manuscriptEl.style.lineHeight =
      String(this.plugin.settings.lineHeight);

    manuscriptEl.addEventListener("scroll", () => {
      this.scrollPosition = manuscriptEl.scrollTop;
    });

    if (!this.activeFile) {
      manuscriptEl.createEl("p", {
        text:
          "Open a Markdown note, then use " +
          "‘Open current note in Pulpitian’."
      });

      return;
    }

    const source = await this.app.vault.read(this.activeFile);

    await MarkdownRenderer.render(
      this.app,
      source,
      manuscriptEl,
      this.activeFile.path,
      this
    );

    manuscriptEl.scrollTop = this.scrollPosition;

    this.updateTimer();
  }

  private handleTimerButton(): void {
    if (this.timerState === "idle") {
      this.startTimer();
      return;
    }

    if (this.timerState === "running") {
      this.pauseTimer();
      return;
    }

    this.resumeTimer();
  }

  private startTimer(): void {
    this.elapsedBeforeStart = 0;
    this.timerStartedAt = Date.now();
    this.timerState = "running";

    this.startTimerInterval();
    this.updateTimer();
  }

  private pauseTimer(): void {
    if (this.timerStartedAt !== null) {
      this.elapsedBeforeStart +=
        Date.now() - this.timerStartedAt;
    }

    this.timerStartedAt = null;
    this.timerState = "paused";

    this.clearTimerInterval();
    this.updateTimer();
  }

  private resumeTimer(): void {
    this.timerStartedAt = Date.now();
    this.timerState = "running";

    this.startTimerInterval();
    this.updateTimer();
  }

  private resetTimer(): void {
    this.clearTimerInterval();

    this.timerState = "idle";
    this.timerStartedAt = null;
    this.elapsedBeforeStart = 0;

    this.updateTimer();
  }

  private startTimerInterval(): void {
    this.clearTimerInterval();

    this.timerId = window.setInterval(() => {
      this.updateTimer();
    }, 250);
  }

  private clearTimerInterval(): void {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
    }

    this.timerId = null;
  }

  private clearTimer(): void {
    this.clearTimerInterval();

    this.timerStartedAt = null;
    this.elapsedBeforeStart = 0;
    this.timerState = "idle";
  }

  private getElapsedSeconds(): number {
    let milliseconds = this.elapsedBeforeStart;

    if (
      this.timerState === "running" &&
      this.timerStartedAt !== null
    ) {
      milliseconds +=
        Date.now() - this.timerStartedAt;
    }

    return Math.floor(milliseconds / 1000);
  }

  private updateTimer(): void {
    if (!this.timerEl || !this.timerButton) {
      return;
    }

    const elapsedSeconds = this.getElapsedSeconds();

    /*
     * TEMPORARY TARGET:
     * 30 minutes.
     *
     * We will replace this with the user-selectable
     * sermon length control next.
     */
    const targetSeconds = 30 * 60;

    const remainingSeconds = Math.max(
      0,
      targetSeconds - elapsedSeconds
    );

    /*
     * Right now we're displaying elapsed time.
     * The threshold colors are based on TIME REMAINING.
     */
    const displaySeconds = elapsedSeconds;

    const minutes = Math.floor(displaySeconds / 60)
      .toString()
      .padStart(2, "0");

    const seconds = (displaySeconds % 60)
      .toString()
      .padStart(2, "0");

    this.timerEl.textContent = `${minutes}:${seconds}`;

    this.timerEl.removeClasses([
      "pulpitian-timer-normal",
      "pulpitian-timer-warning",
      "pulpitian-timer-danger"
    ]);

    /*
     * LESS THAN 1 MINUTE = RED
     */
    if (remainingSeconds < 60) {
      this.timerEl.addClass("pulpitian-timer-danger");
    }

    /*
     * LESS THAN 5 MINUTES = ORANGE
     */
    else if (remainingSeconds < 5 * 60) {
      this.timerEl.addClass("pulpitian-timer-warning");
    }

    /*
     * EVERYTHING ELSE = NORMAL
     */
    else {
      this.timerEl.addClass("pulpitian-timer-normal");
    }

    if (this.timerState === "running") {
      this.timerButton.textContent = "Pause";
    } else if (this.timerState === "paused") {
      this.timerButton.textContent = "Resume";
    } else {
      this.timerButton.textContent = "Start";
    }
  }
}
