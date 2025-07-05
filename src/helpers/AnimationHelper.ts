export class AnimationHelper {
  static runningAnimations:any[] = [];
  static observer:IntersectionObserver = null;

  static setupAnimations = () => {
    const elements = document.querySelectorAll('.animated');
    console.log("ANIMATED ELEMENTS", elements);
    elements.forEach((element) => this.observer.observe(element));
  }

  static init = () => {
    const observerOptions = { rootMargin: '0px 10000px' };
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (this.runningAnimations.includes(entry.target)) return;
        if (entry.isIntersecting) {
          entry.target.classList.add('animate');
          this.runningAnimations.push(entry.target);
          setTimeout(() => {
            this.runningAnimations.forEach((a,i) => {
              if (a===entry.target) this.runningAnimations.splice(i, 1);
            });
          }, 2000);
        }
        else entry.target.classList.remove('animate');
      });
    }, observerOptions);
    setTimeout(() => { this.setupAnimations(); }, 300);
  }
}
