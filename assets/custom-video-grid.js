class CustomVideoGrid extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {

    const videoItems = this.querySelectorAll(".video-item");
    videoItems.forEach((item) => {
      const video = item.querySelector("video");
      if (!video) return;

      video.playbackRate = parseFloat(item.dataset.speed) || 1;

      if (item.dataset.type === "default") {
        if (item.dataset.action === "play") {
          video.play();
          item.classList.add("is-playing");
        } else if (item.dataset.action === "pause") {
          video.pause();
          item.classList.remove("is-playing");
        }
      }
      item.addEventListener("click", (e) => {
        e.stopPropagation();
        console.log("CLICK", video);
        if (video.paused) {
          video.play();
          item.classList.add("is-playing");
        } else {
          video.pause();
          item.classList.remove("is-playing");
        }
      });
      video.addEventListener("ended", () => {
        item.classList.remove("is-playing");
      });
    });
  }
}

customElements.define("custom-video-grid", CustomVideoGrid);
