class CustomVideoGrid extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallBack() {
    let videoFrame = document.getElementById("videoFrameEditor");
    videoFrame.controls = false;
  }
}
customElements.define("custom-video-grid", CustomVideoGrid);
