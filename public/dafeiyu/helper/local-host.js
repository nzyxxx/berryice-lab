"use strict";

/**
 * 体验页里的最小宿主。每个 iframe 一份，只维持 /state 叶子和睡觉。
 * 不进服务器内存，也不调用模型。播放、拖拽和物理仍走上游桌面助手。
 */
function createDafeiyuHost(options) {
  var opts = options || {};
  var random = typeof opts.random === "function" ? opts.random : Math.random;
  var namesOf = typeof opts.names === "function" ? opts.names : function () { return null; };
  var textsOf = typeof opts.texts === "function" ? opts.texts : function () { return { start: [], end: [] }; };

  var counter = 0;
  var sleeping = null;
  var petLeaves = {};
  var waiters = new Set();

  function wakeWaiters() {
    Array.from(waiters).forEach(function (waiter) {
      if (waiter.since === counter) return;
      waiters.delete(waiter);
      clearTimeout(waiter.timer);
      waiter.resolve();
    });
  }

  function writeLeaf(name, data) {
    counter += 1;
    petLeaves[name] = { counter: counter, data: data };
    wakeWaiters();
  }

  function pick(pool) {
    if (!Array.isArray(pool) || pool.length === 0) return undefined;
    return pool[Math.floor(random() * pool.length)];
  }

  function snapshot() {
    var pets = {};
    if (Object.keys(petLeaves).length > 0) pets.main = Object.assign({}, petLeaves);
    return { counter: counter, sections: {}, pets: pets };
  }

  function wait(since, timeoutMs) {
    if (since !== counter) return Promise.resolve();
    var ms = Math.max(0, Math.min(30000, timeoutMs));
    return new Promise(function (resolve) {
      var waiter = {
        since: since,
        resolve: resolve,
        timer: setTimeout(function () {
          waiters.delete(waiter);
          resolve();
        }, ms),
      };
      waiters.add(waiter);
    });
  }

  function enter() {
    var names = namesOf();
    if (!names || !names.start || !names.loop || !names.end) {
      return {
        ok: false,
        reason: "no-sleep-animations",
        message: "这只宠物没有配置睡觉动画（animations.sleep）",
      };
    }
    if (sleeping) {
      return {
        ok: true,
        sleeping: true,
        changed: false,
        start: sleeping.start,
        loop: sleeping.loop,
        end: sleeping.end,
      };
    }
    sleeping = { start: names.start, loop: names.loop, end: names.end };
    writeLeaf("sleep", {
      sleeping: true,
      start: sleeping.start,
      loop: sleeping.loop,
      end: sleeping.end,
    });
    var started = pick(textsOf().start);
    if (started) writeLeaf("say", { text: started, anim: false });
    return {
      ok: true,
      sleeping: true,
      changed: true,
      start: sleeping.start,
      loop: sleeping.loop,
      end: sleeping.end,
    };
  }

  function wake() {
    if (!sleeping) return { ok: true, sleeping: false, changed: false };
    sleeping = null;
    writeLeaf("sleep", { sleeping: false });
    var ended = pick(textsOf().end);
    if (ended) writeLeaf("say", { text: ended, anim: false });
    return { ok: true, sleeping: false, changed: true };
  }

  function post(rest, petId) {
    if (petId && petId !== "main") {
      return { ok: false, reason: "unknown-pet", message: "没有这只宠物" };
    }
    if (rest === "sleep") return enter();
    if (rest === "wake") return wake();
    return { ok: false, reason: "unsupported", message: "这个体验页没有这一项。" };
  }

  return {
    snapshot: snapshot,
    wait: wait,
    post: post,
  };
}

if (typeof module === "object" && module.exports) {
  module.exports = { createDafeiyuHost: createDafeiyuHost };
}
if (typeof window !== "undefined") {
  window.DafeiyuLocalHost = { createDafeiyuHost: createDafeiyuHost };
}
