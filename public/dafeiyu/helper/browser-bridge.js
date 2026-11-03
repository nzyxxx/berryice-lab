"use strict";

/**
 * 把 dsh-pet 桌面助手放进网页舞台。
 * 上游用系统窗口搬家；这里改成挪 iframe 里的 #root。
 * /state 与睡觉留在本标签页。大肥鱼的素材从 /dsh-pet-7340/ 取。
 * 小莓不取鱼的 config / thumb。成片只读她自己的 /characters/xiaomei/。
 */
(function () {
  var factory = window.DafeiyuLocalHost && window.DafeiyuLocalHost.createDafeiyuHost;
  if (typeof factory !== "function") {
    console.error("[dafeiyu] 本地宿主没装上");
    return;
  }

  var slot = window.BerryiceCharacterSlot;
  var characterId = slot && typeof slot.readCharacterId === "function"
    ? slot.readCharacterId(location.search)
    : (new URLSearchParams(location.search).get("character") === "xiaomei" ? "xiaomei" : "dafeiyu");
  // 小莓整段都不走鱼包：空包画占位，成片画她自己的光栅。thumb 仍在下面被拦住。
  var placeholder = characterId === "xiaomei";
  if (placeholder) {
    // 空宠物列表会走到上游的 window.close。这里是 iframe，关掉会把角色一起拆掉。
    window.close = function () {};
    var slotRoot = document.getElementById("root");
    if (slot && typeof slot.mountXiaomeiSlot === "function") slot.mountXiaomeiSlot(slotRoot);
    else if (slot && typeof slot.paintPlaceholder === "function") slot.paintPlaceholder(slotRoot);
    else if (slotRoot) slotRoot.textContent = "小莓 · 空包占位";
  }

  var cached = null;
  var displaysCb = null;
  var host = factory({
    names: function () {
      var sets = cached && cached.main && cached.main.animations && cached.main.animations.sleep;
      var set = Array.isArray(sets) ? sets[0] : null;
      if (!set) return null;
      var start = Array.isArray(set.start) ? set.start[0] : "";
      var loop = Array.isArray(set.loop) ? set.loop[0] : "";
      var end = Array.isArray(set.end) ? set.end[0] : "";
      if (!start || !loop || !end) return null;
      return { start: start, loop: loop, end: end };
    },
    texts: function () {
      var main = cached && cached.main ? cached.main : {};
      return { start: main.sleepStartTexts || [], end: main.sleepEndTexts || [] };
    },
  });

  var petRef = null;
  var pendingRest = null;

  function petSize() {
    var n = Number(new URLSearchParams(location.search).get("petSize"));
    if (!Number.isFinite(n)) return 462;
    // 保留小数。四舍五入到整数 CSS 像素会让 1.25 倍屏落在半个设备像素上，边缘发虚。
    return Math.min(462, Math.max(160, n));
  }

  function readMargin(name, fallback) {
    var n = Number(new URLSearchParams(location.search).get(name));
    if (!Number.isFinite(n)) return fallback;
    return Math.round(n);
  }

  function applyRest(pet, rest) {
    if (!pet || !rest) return;
    if (Number.isFinite(rest.marginX)) pet.position.marginX = rest.marginX;
    if (Number.isFinite(rest.marginY)) pet.position.marginY = rest.marginY;
  }

  function patchConfig(data) {
    cached = data;
    var main = data && data.main;
    if (!main || !Array.isArray(main.pets) || !main.pets[0]) return data;
    var pet = main.pets[0];
    pet.size = petSize();
    pet.name = "大肥鱼"; // 只改鱼包显示名。小莓不进这个函数。
    pet.position = {
      corner: "bottom-left",
      marginX: readMargin("marginX", 28),
      marginY: readMargin("marginY", 36),
    };
    petRef = pet;
    if (pendingRest) applyRest(pet, pendingRest);
    pet.whisperEnabled = false;
    pet.balanceEnabled = false;
    pet.workStatusEnabled = false;
    main.memes = {};
    main.chatImageEnabled = false;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      pet.fixedEnabled = true;
    }
    return data;
  }

  function jsonResponse(obj) {
    return new Response(JSON.stringify(obj), {
      status: 200,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
  }

  function absUrl(input) {
    if (typeof input === "string") return new URL(input, location.href);
    if (input instanceof URL) return new URL(input.href);
    return new URL(input.url, location.href);
  }

  function methodOf(input, init) {
    if (init && init.method) return String(init.method).toUpperCase();
    if (typeof Request !== "undefined" && input instanceof Request) return input.method.toUpperCase();
    return "GET";
  }

  var nativeFetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    var url;
    try {
      url = absUrl(input);
    } catch {
      return nativeFetch(input, init);
    }
    if (url.origin !== location.origin || url.pathname.indexOf("/dsh-pet-7340/") !== 0) {
      return nativeFetch(input, init);
    }
    var rest = url.pathname.slice("/dsh-pet-7340/".length);
    if (rest === "config") {
      if (placeholder) {
        var empty = slot && typeof slot.emptyDesktopConfig === "function"
          ? slot.emptyDesktopConfig()
          : { main: { pets: [], memes: {} } };
        return Promise.resolve(jsonResponse(empty));
      }
      return nativeFetch(input, init).then(function (res) {
        return res.json().then(function (data) {
          return jsonResponse(patchConfig(data));
        });
      });
    }
    if (placeholder && rest.indexOf("thumb/") === 0) {
      return Promise.resolve(new Response(null, { status: 404 }));
    }
    if (
      rest.indexOf("thumb/") === 0 ||
      rest.indexOf("sound/") === 0 ||
      rest.indexOf("pic/") === 0 ||
      rest.indexOf("font/") === 0 ||
      rest === "logo"
    ) {
      return nativeFetch(input, init);
    }
    var method = methodOf(input, init);
    if (method === "GET" && rest === "state") {
      var sinceRaw = url.searchParams.get("since");
      var timeoutRaw = url.searchParams.get("timeout");
      var pending = Promise.resolve();
      if (sinceRaw !== null && timeoutRaw !== null) {
        var since = Number(sinceRaw);
        var timeout = Number(timeoutRaw);
        if (Number.isFinite(since) && Number.isFinite(timeout)) pending = host.wait(since, timeout);
      }
      return pending.then(function () {
        return jsonResponse(host.snapshot());
      });
    }
    if (method === "POST" && (rest === "pose/report" || /^playback\/[^/]+\/report$/.test(rest))) {
      return Promise.resolve(jsonResponse({ ok: true }));
    }
    if (method === "POST" && (rest === "sleep" || rest === "wake")) {
      return Promise.resolve(jsonResponse(host.post(rest, url.searchParams.get("pet") || "main")));
    }
    return Promise.resolve(jsonResponse({
      ok: false,
      reason: "unsupported",
      message: "这个体验页没有这一项。",
    }));
  };

  window.petBridge = {
    setBounds: function (x, y, width, height) {
      var root = document.getElementById("root");
      if (!root) return;
      root.style.position = "absolute";
      root.style.left = Math.round(x) + "px";
      root.style.top = Math.round(y) + "px";
      root.style.width = Math.round(width) + "px";
      root.style.height = Math.round(height) + "px";
    },
    setInteractive: function () {},
    setInputBusy: function () {},
    setInputRegions: function () {},
    requestKeyboardFocus: function () {},
    openDshSite: function () {},
    captureScreen: function () {
      return Promise.resolve(null);
    },
    reportFlight: function () {},
    onFlightStates: function () {},
    reportCollide: function () {},
    onPetHit: function () {},
    onDisplays: function (cb) {
      displaysCb = cb;
    },
  };

  window.addEventListener("message", function (event) {
    if (event.origin !== location.origin) return;
    var data = event.data;
    if (!data || data.type !== "dafeiyu-geometry") return;
    if (data.rest) {
      pendingRest = data.rest;
      window.__dafeiyuRestMargin = data.rest;
      applyRest(petRef, data.rest);
    }
    if (typeof displaysCb === "function") displaysCb(data.geo);
  });

  document.addEventListener("visibilitychange", function () {
    var videos = document.querySelectorAll("video");
    for (var i = 0; i < videos.length; i += 1) {
      var video = videos[i];
      if (document.hidden) {
        video.pause();
      } else if (video.classList.contains("is-front")) {
        var play = video.play();
        if (play && typeof play.catch === "function") play.catch(function () {});
      }
    }
  });
})();
