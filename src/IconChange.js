// boxCarousel.js
export function initBoxCarousel(selector, cardData, titleElSelector = null) {
  const box = document.querySelector(selector);
  if (!box) {
    console.warn("No element found for selector:", selector);
    return;
  }

  let titleEl = null;
  if (titleElSelector) {
    titleEl = document.querySelector(titleElSelector);
  }

  let currentIndex = 0;
  const total = cardData.length;

  cardData.forEach((data) => {
    const itemDiv = document.createElement("div");
    itemDiv.className = "item";

    if (data.type === "video") {
      // ====== 視頻 + 播放圖示 + 全屏提示 ======
      const videoContainer = document.createElement("div");
      videoContainer.className = "video-container";

      const videoEl = document.createElement("video");
      videoEl.src = data.src;
      videoEl.width = data.width || 320;
      videoEl.height = data.height || 240;
      videoEl.controls = false;   // 用我們自己的播放圖標
      videoEl.preload = "auto";

      const playIcon = document.createElement("i");
      playIcon.className = "las la-play-circle play-icon";

      const hintEl = document.createElement("div");
      hintEl.className = "fullscreen-hint";
      hintEl.textContent = "ダブルクリックで全画面表示";

      // 組裝
      videoContainer.appendChild(videoEl);
      videoContainer.appendChild(playIcon);
      videoContainer.appendChild(hintEl);

      itemDiv.appendChild(videoContainer);

      // 事件綁定
      setupVideoControls(videoEl, playIcon);

    } else if (data.type === "iframe") {
      // ====== YouTube iframe ======
      const iframeEl = document.createElement("iframe");
      iframeEl.src = data.src;
      iframeEl.width = data.width || 560;
      iframeEl.height = data.height || 315;
      iframeEl.frameBorder = 0;
      // 若要支持全螢幕
      iframeEl.allowFullscreen = true;
      // 其他屬性（如自動播放等），可看你需求
      // iframeEl.setAttribute("allow", "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture");

      itemDiv.appendChild(iframeEl);

    } else {
      // ====== 圖片 ======
      const img = document.createElement("img");
      img.src = data.src;
      img.alt = data.alt || "";
      if (data.width) img.style.width = data.width + "px";
      if (data.height) img.style.height = data.height + "px";
      itemDiv.appendChild(img);
    }

    box.appendChild(itemDiv);
  });

  // 更新标题函数
  function updateTitle() {
    if (titleEl) {
      const currentItem = cardData[currentIndex];
      titleEl.textContent = currentItem.title || "";
    }
  }
  updateTitle();

  // 翻下一张
  function moveNext() {
    const items = box.querySelectorAll(".item");
    box.appendChild(items[0]); // 把第一张移到末尾
    currentIndex = (currentIndex + 1) % total;
    updateTitle();
  }

  // 翻上一张
  function movePrev() {
    const items = box.querySelectorAll(".item");
    box.prepend(items[items.length - 1]);
    currentIndex = (currentIndex - 1 + total) % total;
    updateTitle();
  }

  // 鼠标滚轮 => 翻页
  box.addEventListener("wheel", (event) => {
    event.preventDefault();
    if (event.deltaY > 0) moveNext();
    else movePrev();
  }, { passive: false });
}

// ========== 播放图标事件绑定 ==========
function setupVideoControls(video, icon) {
  // 初始状态
  if (video.paused) {
    icon.style.display = 'inline';
  } else {
    icon.style.display = 'none';
  }

  // 点击播放图标 => 播放/暂停
  icon.addEventListener("click", () => {
    if (video.paused) {
      video.play();
      icon.style.display = 'none';
    } else {
      video.pause();
      icon.style.display = 'inline';
    }
  });

  // 视频暂停/结束 => 显示图标
  video.addEventListener("pause", () => {
    icon.style.display = 'inline';
  });
  video.addEventListener("ended", () => {
    icon.style.display = 'inline';
  });

  // 双击视频 => 全屏
  video.addEventListener("dblclick", () => {
    if (video.requestFullscreen) {
      video.requestFullscreen();
    } else if (video.webkitEnterFullscreen) {
      video.webkitEnterFullscreen();
    }
  });
}
