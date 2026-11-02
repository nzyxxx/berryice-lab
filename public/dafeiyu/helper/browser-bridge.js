"use strict";

/**
 * 把 dsh-pet 桌面助手放进网页舞台。
 * 上游用系统窗口搬家；这里改成挪 iframe 里的 #root。
 * /state 与睡觉留在本标签页，素材仍从 /dsh-pet-7340/ 取。
 */
(function () {
  var factory = window.DafeiyuLocalHost && window.DafeiyuLocalHost.createDafeiyuHost;
  if (typeof factory !== "function") {
    console.error("[dafeiyu] 本地宿主没装上");
    return;
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

  function petSize() {
    var n = Number(new URLSearchParams(location.search).get("petSize"));
    if (!Number.isFinite(n)) return 462;
    return Math.round(Math.min(462, Math.max(160, n)));
  }

  function patchConfig(data) {
    cached = data;
    var main = data && data.main;
    if (!main || !Array.isArray(main.pets) || !main.pets[0]) return data;
    var pet = main.pets[0];
    pet.size = petSize();
    pet.name = "大肥鱼";
    pet.position = { corner: "bottom-left", marginX: 28, marginY: 36 };
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
      return nativeFetch(input, init).then(function (res) {
        return res.json().then(function (data) {
          return jsonResponse(patchConfig(data));
        });
      });
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
      message: "这个体验页没有接上 DeepSeek Harness，碎碎念、对话和余额在这里用不了。",
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
    if (!data || data.type !== "dafeiyu-geometry" || typeof displaysCb !== "function") return;
    displaysCb(data.geo);
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
