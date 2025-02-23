export class LoadingSpinner {
  private frames: string[];
  private interval: NodeJS.Timeout | null;
  private currentFrame: number;
  private message: string;

  constructor(message: string = 'Loading') {
    this.frames = ['', '.', '..', '...'];
    this.currentFrame = 0;
    this.interval = null;
    this.message = message;
  }

  start() {
    if (this.interval) return;
    
    process.stdout.write('\x1B[?25l'); // Hide cursor
    
    this.interval = setInterval(() => {
      const frame = this.frames[this.currentFrame];
      process.stdout.write(`\r${this.message}${frame}`);
      this.currentFrame = (this.currentFrame + 1) % this.frames.length;
    }, 300);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      process.stdout.write('\r\x1B[K'); // Clear line
      process.stdout.write('\x1B[?25h'); // Show cursor
    }
  }

  setMessage(message: string) {
    this.message = message;
  }
} 