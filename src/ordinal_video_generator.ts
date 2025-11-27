import { renderOrdinalSimple } from "./SimpleRenderer.js";
import {
    DEFAULT_F_PARAMS,
    fInverse,
    convertFFormatToOrdinalInstance,
} from "./ordinal_mapping/OrdinalMappingCompat.js";

type Html2Canvas = (element: HTMLElement) => Promise<HTMLCanvasElement>;

declare global {
    interface Window {
        html2canvas?: Html2Canvas;
    }
}

type FrameInfo = {
    frameNumber: number;
    xValue: number;
    ordinalString: string;
    dataUrl: string;
};

type RenderResult = {
    ordinalInstance: any;
    graphicalHTML: string;
    linearString: string;
} | null;

function ensureHtml2Canvas(): Html2Canvas {
    const html2canvas = window.html2canvas;
    if (!html2canvas) {
        throw new Error("html2canvas library not loaded");
    }
    return html2canvas;
}

class OrdinalVideoGenerator {
    private isGenerating = false;
    private mediaRecorder: MediaRecorder | null = null;
    private recordedChunks: BlobPart[] = [];
    private animationFrameId: number | null = null;
    private generatedFrames: FrameInfo[] = [];
    private currentFrame = 0;
    private totalFrames = 0;
    private recordedVideoBlob: Blob | null = null;

    private elements = {
        // Settings
        duration: document.getElementById("videoDuration") as HTMLInputElement,
        frameRate: document.getElementById("videoFrameRate") as HTMLSelectElement,
        startX: document.getElementById("videoStartX") as HTMLInputElement,
        endX: document.getElementById("videoEndX") as HTMLInputElement,
        progressionType: document.getElementById("videoProgressionType") as HTMLSelectElement,
        resolution: document.getElementById("videoResolution") as HTMLSelectElement,

        // Buttons
        previewBtn: document.getElementById("previewVideoBtn") as HTMLButtonElement,
        recordBtn: document.getElementById("recordVideoBtn") as HTMLButtonElement,
        generateFramesBtn: document.getElementById("generateFramesBtn") as HTMLButtonElement,
        stopBtn: document.getElementById("stopVideoBtn") as HTMLButtonElement,
        downloadVideoBtn: document.getElementById("downloadVideoBtn") as HTMLButtonElement,
        downloadFramesBtn: document.getElementById("downloadFramesBtn") as HTMLButtonElement,

        // Progress
        progressText: document.getElementById("videoProgressText") as HTMLElement,
        progressBar: document.getElementById("videoProgressBar") as HTMLElement,
        currentOrdinal: document.getElementById("videoCurrentOrdinal") as HTMLElement,

        // Display
        displayArea: document.getElementById("videoDisplayArea") as HTMLElement,
        outputArea: document.getElementById("videoOutputArea") as HTMLElement,
        outputContent: document.getElementById("videoOutputContent") as HTMLElement,
    };

    constructor() {
        this.initializeDefaults();
        this.setupEventListeners();
    }

    private initializeDefaults() {
        if (
            DEFAULT_F_PARAMS?.precomputed &&
            typeof DEFAULT_F_PARAMS.precomputed[5] === "number"
        ) {
            const maxValue = DEFAULT_F_PARAMS.precomputed[5];
            this.elements.startX.max = String(maxValue);
            this.elements.endX.max = String(maxValue);
            this.elements.endX.value = String(Math.min(5, maxValue));
        }
    }

    private setupEventListeners() {
        this.elements.previewBtn.addEventListener("click", () => this.startPreview());
        this.elements.recordBtn.addEventListener("click", () => this.startRecording());
        this.elements.generateFramesBtn.addEventListener("click", () => this.generateFrames());
        this.elements.stopBtn.addEventListener("click", () => this.stopGeneration());
        this.elements.downloadVideoBtn.addEventListener("click", () => this.downloadVideo());
        this.elements.downloadFramesBtn.addEventListener("click", () => this.downloadFrames());
    }

    private getTimeProgressionValue(normalizedTime: number, type: string): number {
        switch (type) {
            case "linear":
                return normalizedTime;
            case "exponential":
                return (Math.exp(normalizedTime) - 1) / (Math.E - 1);
            case "logarithmic":
                return (
                    Math.log(1 + normalizedTime * (Math.E - 1)) / Math.log(Math.E)
                );
            case "sine":
                return (Math.sin((normalizedTime - 0.5) * Math.PI) + 1) / 2;
            default:
                return normalizedTime;
        }
    }

    private calculateXForFrame(frameIndex: number, totalFrames: number): number {
        if (totalFrames <= 1) return parseFloat(this.elements.startX.value);
        const normalizedTime = frameIndex / (totalFrames - 1);
        const progressionValue = this.getTimeProgressionValue(
            normalizedTime,
            this.elements.progressionType.value
        );

        const startX = parseFloat(this.elements.startX.value);
        const endX = parseFloat(this.elements.endX.value);

        return startX + (endX - startX) * progressionValue;
    }

    private async renderOrdinalForX(x: number): Promise<RenderResult> {
        try {
            const ordinalRep = fInverse(x, DEFAULT_F_PARAMS);
            const ordinalInstance = convertFFormatToOrdinalInstance(ordinalRep);
            const graphicalHTML = renderOrdinalSimple(ordinalInstance);

            this.elements.displayArea.innerHTML = graphicalHTML;
            this.elements.currentOrdinal.textContent =
                typeof ordinalInstance.toStringCNF === "function"
                    ? ordinalInstance.toStringCNF()
                    : ordinalInstance.toString();

            return {
                ordinalInstance,
                graphicalHTML,
                linearString:
                    typeof ordinalInstance.toStringCNF === "function"
                        ? ordinalInstance.toStringCNF()
                        : ordinalInstance.toString(),
            };
        } catch (error: any) {
            console.error("[VideoGen] Error rendering ordinal:", error);
            this.elements.displayArea.innerHTML = `<span style="color: #dc3545;">Error: ${error.message}</span>`;
            this.elements.currentOrdinal.textContent = "Error";
            return null;
        }
    }

    private updateProgress(current: number, total: number, status = "") {
        const percentage = total > 0 ? (current / total) * 100 : 0;
        this.elements.progressBar.style.width = `${percentage}%`;

        if (status) {
            this.elements.progressText.textContent = status;
        } else {
            this.elements.progressText.textContent = `Frame ${current} of ${total} (${percentage.toFixed(
                1
            )}%)`;
        }
    }

    private async startPreview() {
        if (this.isGenerating) return;

        this.isGenerating = true;
        this.updateButtonStates();

        const duration = parseFloat(this.elements.duration.value);
        const frameRate = parseInt(this.elements.frameRate.value, 10);
        this.totalFrames = Math.max(1, Math.floor(duration * frameRate));
        this.currentFrame = 0;

        const frameInterval = 1000 / frameRate;
        let lastFrameTime = 0;

        const animateFrame = async (currentTime: number) => {
            if (!this.isGenerating) return;

            if (currentTime - lastFrameTime >= frameInterval) {
                const x = this.calculateXForFrame(this.currentFrame, this.totalFrames);
                await this.renderOrdinalForX(x);
                this.updateProgress(
                    this.currentFrame + 1,
                    this.totalFrames,
                    "Previewing animation..."
                );

                this.currentFrame++;
                lastFrameTime = currentTime;

                if (this.currentFrame >= this.totalFrames) {
                    this.stopGeneration();
                    return;
                }
            }

            this.animationFrameId = requestAnimationFrame(animateFrame);
        };

        this.animationFrameId = requestAnimationFrame(animateFrame);
    }

    private async startRecording() {
        if (this.isGenerating) return;

        try {
            this.elements.displayArea.classList.add("recording");

            const canvas = await this.createCanvasFromElement(this.elements.displayArea);
            const stream = canvas.captureStream(parseInt(this.elements.frameRate.value, 10));

            this.recordedChunks = [];
            this.mediaRecorder = new MediaRecorder(stream, {
                mimeType: "video/webm; codecs=vp9",
            });

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = () => {
                this.processRecordedVideo();
            };

            this.mediaRecorder.start();
            this.isGenerating = true;
            this.updateButtonStates();

            await this.startPreview();
        } catch (error: any) {
            console.error("[VideoGen] Recording error:", error);
            alert(`Recording failed: ${error.message}`);
            this.stopGeneration();
        }
    }

    private async createCanvasFromElement(element: HTMLElement): Promise<HTMLCanvasElement> {
        const html2canvas = ensureHtml2Canvas();
        return html2canvas(element);
    }

    private async generateFrames() {
        if (this.isGenerating) return;

        this.isGenerating = true;
        this.updateButtonStates();
        this.generatedFrames = [];

        const frameRate = parseInt(this.elements.frameRate.value, 10);
        const duration = parseFloat(this.elements.duration.value);
        this.totalFrames = Math.max(1, Math.floor(duration * frameRate));

        for (let i = 0; i < this.totalFrames; i++) {
            if (!this.isGenerating) break;
            const x = this.calculateXForFrame(i, this.totalFrames);
            const ordinalData = await this.renderOrdinalForX(x);

            if (!ordinalData) continue;

            const canvas = await this.createCanvasFromElement(this.elements.displayArea);
            const dataUrl = canvas.toDataURL("image/png");

            this.generatedFrames.push({
                frameNumber: i + 1,
                xValue: x,
                ordinalString: ordinalData.linearString,
                dataUrl,
            });

            this.updateProgress(
                i + 1,
                this.totalFrames,
                `Generating frame ${i + 1} of ${this.totalFrames}`
            );
        }

        this.isGenerating = false;
        this.updateButtonStates();
        this.displayGeneratedFrames();
    }

    private displayGeneratedFrames() {
        if (this.generatedFrames.length === 0) {
            this.elements.outputArea.style.display = "none";
            return;
        }

        let html = "<h3>Generated Frames</h3>";
        html += `<p>Total Frames: ${this.generatedFrames.length}</p>`;
        html += '<div class="frames-grid">';

        this.generatedFrames.slice(0, 12).forEach((frame) => {
            html += `
                <div class="frame-thumbnail">
                    <img src="${frame.dataUrl}" alt="Frame ${frame.frameNumber}">
                    <div class="frame-number">${frame.frameNumber}</div>
                </div>
            `;
        });

        if (this.generatedFrames.length > 12) {
            html += `<p>... and ${this.generatedFrames.length - 12} more frames</p>`;
        }

        html += "</div>";
        this.elements.outputContent.innerHTML = html;
        this.elements.outputArea.style.display = "block";
        this.elements.downloadFramesBtn.style.display = "inline-block";
    }

    private processRecordedVideo() {
        const blob = new Blob(this.recordedChunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);

        this.elements.outputContent.innerHTML = `
            <div class="video-preview">
                <video controls width="400" height="300">
                    <source src="${url}" type="video/webm">
                    Your browser does not support the video tag.
                </video>
                <p>Video duration: ${this.elements.duration.value}s at ${this.elements.frameRate.value}fps</p>
            </div>
        `;

        this.elements.outputArea.style.display = "block";
        this.elements.downloadVideoBtn.style.display = "inline-block";
        this.recordedVideoBlob = blob;
    }

    private downloadVideo() {
        if (!this.recordedVideoBlob) return;

        const url = URL.createObjectURL(this.recordedVideoBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ordinal-video-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    private downloadFrames() {
        if (this.generatedFrames.length === 0) return;

        this.generatedFrames.forEach((frame, index) => {
            const a = document.createElement("a");
            a.href = frame.dataUrl;
            a.download = `ordinal-frame-${String(frame.frameNumber).padStart(4, "0")}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            if (index < this.generatedFrames.length - 1) {
                setTimeout(() => {}, 100);
            }
        });
    }

    private stopGeneration() {
        this.isGenerating = false;

        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
            this.mediaRecorder.stop();
        }

        this.elements.displayArea.classList.remove("recording");
        this.updateButtonStates();

        if (this.currentFrame > 0) {
            this.elements.progressText.textContent = `Completed ${this.currentFrame} frames`;
        } else {
            this.elements.progressText.textContent = "Ready to generate";
        }
    }

    private updateButtonStates() {
        const isGenerating = this.isGenerating;

        this.elements.previewBtn.disabled = isGenerating;
        this.elements.recordBtn.disabled = isGenerating;
        this.elements.generateFramesBtn.disabled = isGenerating;
        this.elements.stopBtn.disabled = !isGenerating;
    }
}

function initVideoGenerator() {
    const container = document.querySelector(".video-generation-container");
    if (!container) return;
    new OrdinalVideoGenerator();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initVideoGenerator, { once: true });
} else {
    initVideoGenerator();
}

